// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// GMX V2 Interfaces
interface IExchangeRouter {
    struct CreateOrderParams {
        CreateOrderParamsAddresses addresses;
        CreateOrderParamsNumbers numbers;
        uint8 orderType;
        uint8 decreasePositionSwapType;
        bool isLong;
        bool shouldUnwrapNativeToken;
        bytes32 referralCode;
    }

    struct CreateOrderParamsAddresses {
        address receiver;
        address cancellationReceiver;
        address callbackContract;
        address uiFeeReceiver;
        address market;
        address initialCollateralToken;
        address[] swapPath;
    }

    struct CreateOrderParamsNumbers {
        uint256 sizeDeltaUsd;
        uint256 initialCollateralDeltaAmount;
        uint256 triggerPrice;
        uint256 acceptablePrice;
        uint256 executionFee;
        uint256 callbackGasLimit;
        uint256 minOutputAmount;
    }

    function createOrder(CreateOrderParams calldata params) external payable returns (bytes32);
    function sendWnt(address receiver, uint256 amount) external payable;
}

contract CoreUpdate is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    struct Leader {
        address leader;
        bool active;
        uint16 feeBps;
    }

    struct FollowerPosition {
        bool isOpen;
        bool isLong;
        address indexToken;
        uint256 sizeUsd;
        bytes32 gmxPositionKey; // filled by backend
    }

    /*//////////////////////////////////////////////////////////////
                                STORAGE
    //////////////////////////////////////////////////////////////*/

    IERC20 public collateralToken;
    IExchangeRouter public exchangeRouter;

    uint256 public nextLeaderId;

    mapping(uint256 => Leader) public leaders;
    mapping(uint256 => address[]) public followers;
    mapping(uint256 => mapping(address => uint256)) public deposits;
    mapping(uint256 => uint256) public totalDeposits;

    mapping(uint256 => mapping(address => FollowerPosition)) public followerPositions;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event LeaderRegistered(uint256 indexed leaderId, address indexed leader);
    event Subscribed(uint256 indexed leaderId, address indexed follower, uint256 amount);
    event Unsubscribed(uint256 indexed leaderId, address indexed follower, uint256 amount);

    event GMXPositionIncreaseRequested(
        uint256 indexed leaderId,
        address indexed follower,
        address indexToken,
        uint256 sizeUsd,
        bool isLong
    );

    event GMXPositionDecreaseRequested(
        uint256 indexed leaderId,
        address indexed follower
    );

    /*//////////////////////////////////////////////////////////////
                                ADMIN
    //////////////////////////////////////////////////////////////*/

    constructor(
        address _collateral,
        address _exchangeRouter
    ) Ownable(msg.sender) {
        collateralToken = IERC20(_collateral);
        exchangeRouter = IExchangeRouter(_exchangeRouter);
    }


    function setExchangeRouter(address _router) external onlyOwner {
        exchangeRouter = IExchangeRouter(_router);
    }

    /*//////////////////////////////////////////////////////////////
                            LEADER FLOW
    //////////////////////////////////////////////////////////////*/

    function registerLeader(uint16 feeBps) external returns (uint256) {
        uint256 id = nextLeaderId++;
        leaders[id] = Leader({
            leader: msg.sender,
            active: true,
            feeBps: feeBps
        });

        emit LeaderRegistered(id, msg.sender);
        return id;
    }

    modifier onlyLeader(uint256 leaderId) {
        require(leaders[leaderId].leader == msg.sender, "Not leader");
        _;
    }

    /*//////////////////////////////////////////////////////////////
                           FOLLOWER FLOW
    //////////////////////////////////////////////////////////////*/

    function subscribe(uint256 leaderId, uint256 amount) external nonReentrant {
        require(leaders[leaderId].active, "leader inactive");
        require(amount > 0, "amount 0");

        collateralToken.safeTransferFrom(msg.sender, address(this), amount);

        if (deposits[leaderId][msg.sender] == 0) {
            followers[leaderId].push(msg.sender);
        }

        deposits[leaderId][msg.sender] += amount;
        totalDeposits[leaderId] += amount;

        emit Subscribed(leaderId, msg.sender, amount);
    }

    function unsubscribe(uint256 leaderId) external nonReentrant {
        uint256 dep = deposits[leaderId][msg.sender];
        require(dep > 0, "not subscribed");

        deposits[leaderId][msg.sender] = 0;
        totalDeposits[leaderId] -= dep;

        collateralToken.safeTransfer(msg.sender, dep);
        emit Unsubscribed(leaderId, msg.sender, dep);
    }

    /*//////////////////////////////////////////////////////////////
                         GMX EXECUTION
    //////////////////////////////////////////////////////////////*/

   function leaderOpenPosition(
        uint256 leaderId,
        address indexToken, 
        uint256 sizeUsd,
        bool isLong,
        uint256 acceptablePrice,
        uint256 executionFee
    ) external payable onlyLeader(leaderId) nonReentrant {

        address[] memory fl = followers[leaderId];
        uint256 totalDep = totalDeposits[leaderId];
        require(totalDep > 0, "no followers");

        for (uint256 i = 0; i < fl.length; i++) {
            address follower = fl[i];
            uint256 dep = deposits[leaderId][follower];
            if (dep == 0) continue;

            uint256 followerSizeUsd = (sizeUsd * dep) / totalDep;

            collateralToken.approve(address(exchangeRouter), dep);

            // 2. Prepare Swap Path (Empty for direct collateral deposit)
            address[] memory swapPath = new address[](0);

            // 3. Prepare Order Parameters
            IExchangeRouter.CreateOrderParams memory params = IExchangeRouter.CreateOrderParams({
                addresses: IExchangeRouter.CreateOrderParamsAddresses({
                    receiver: address(this), // The position is held by this contract
                    cancellationReceiver: address(this), // If cancelled, funds return here
                    callbackContract: address(0),
                    uiFeeReceiver: address(0),
                    market: indexToken, // IMPORTANT: In V2, this must be the MARKET address (e.g. 0x70d9...), not the token address
                    initialCollateralToken: address(collateralToken),
                    swapPath: swapPath
                }),
                numbers: IExchangeRouter.CreateOrderParamsNumbers({
                    sizeDeltaUsd: followerSizeUsd,
                    initialCollateralDeltaAmount: dep, // The amount of collateral to deposit
                    triggerPrice: 0, // 0 for Market Orders
                    acceptablePrice: acceptablePrice,
                    executionFee: executionFee,
                    callbackGasLimit: 0,
                    minOutputAmount: 0
                }),
                orderType: 2, // 2 = MarketIncrease (Open Position)
                decreasePositionSwapType: 0, // Not used for Increase
                isLong: isLong,
                shouldUnwrapNativeToken: false,
                referralCode: bytes32(0)
            });

            // 4. Send Execution Fee (ETH) to the Router
            // Note: Your contract must hold enough ETH to cover (executionFee * followers.length)
            exchangeRouter.sendWnt{ value: executionFee }(address(exchangeRouter), executionFee);

            // 5. Create the Order
            exchangeRouter.createOrder(params);

            // --- GMX V2 INTEGRATION END ---

            followerPositions[leaderId][follower] = FollowerPosition({
                isOpen: true,
                isLong: isLong,
                indexToken: indexToken,
                sizeUsd: followerSizeUsd,
                gmxPositionKey: bytes32(0) // Note: V2 doesn't use the same key system, you might store the orderKey (returned by createOrder) if needed
            });

            emit GMXPositionIncreaseRequested(
                leaderId,
                follower,
                indexToken,
                followerSizeUsd,
                isLong
            );
        }
    }

    function leaderClosePositions(
        uint256 leaderId,
        uint256 acceptablePrice,
        uint256 executionFee
    ) external payable onlyLeader(leaderId) nonReentrant {
        
        address[] memory fl = followers[leaderId];

        for (uint256 i = 0; i < fl.length; i++) {
            address follower = fl[i];
            FollowerPosition storage fp = followerPositions[leaderId][follower];
            if (!fp.isOpen) continue;

            address[] memory swapPath = new address[](0);

            // Prepare the V2 Order Parameters
            IExchangeRouter.CreateOrderParams memory params = IExchangeRouter.CreateOrderParams({
                addresses: IExchangeRouter.CreateOrderParamsAddresses({
                    receiver: follower, // Funds go back to follower
                    cancellationReceiver: follower,
                    callbackContract: address(0),
                    uiFeeReceiver: address(0),
                    market: address(collateralToken), // In V2, the "market" address is used, not just the token
                    initialCollateralToken: address(collateralToken),
                    swapPath: swapPath
                }),
                numbers: IExchangeRouter.CreateOrderParamsNumbers({
                    sizeDeltaUsd: fp.sizeUsd,
                    initialCollateralDeltaAmount: 0, // 0 means withdraw all collateral for full close
                    triggerPrice: 0, // 0 for Market Decrease
                    acceptablePrice: acceptablePrice,
                    executionFee: executionFee,
                    callbackGasLimit: 0,
                    minOutputAmount: 0
                }),
                orderType: 4, // 4 = MarketDecrease (Close Position)
                decreasePositionSwapType: 0, // 0 = No Swap (receive collateral token)
                isLong: fp.isLong,
                shouldUnwrapNativeToken: false, // Set true if you want ETH instead of WETH
                referralCode: bytes32(0)
            });

            // Send the execution fee to the router first (Required in V2)
            exchangeRouter.sendWnt{ value: executionFee }(address(exchangeRouter), executionFee);

            // Create the order
            exchangeRouter.createOrder(params);

            fp.isOpen = false;
            emit GMXPositionDecreaseRequested(leaderId, follower);
        }
    }
}
