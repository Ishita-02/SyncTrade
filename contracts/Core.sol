// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Core.sol
 * CopyX core contract with off-chain PnL settlement (MVP)
 *
 * - Collateral is an ERC-20 USD-pegged token (18 decimals).
 * - Prices & PnL are computed OFF-CHAIN.
 * - Contract only enforces balances + custody.
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Core is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --------- STRUCTS ---------
    struct Leader {
        address leaderAddress;
        uint256 totalFollowers;
        bool active;
        string meta;
        uint16 feeBps;
    }

    struct LeaderPosition {
        bool isLong;
        uint256 entryPrice; // off-chain reference
        uint256 sizeUsd;    // off-chain reference
        bool isOpen;
        address indexToken;
    }

    struct FollowerPosition {
        bool isLong;
        uint256 entryPrice; // off-chain reference
        uint256 sizeUsd;    // off-chain reference
        bool isOpen;
        address indexToken;
    }

    // --------- STORAGE ---------
    IERC20 public collateralToken;

    uint256 public nextLeaderId;

    mapping(uint256 => Leader) public leaders;
    mapping(uint256 => LeaderPosition) public leaderPositions;
    mapping(uint256 => mapping(address => FollowerPosition)) public followerPositions;

    mapping(uint256 => mapping(address => uint256)) public deposits;
    mapping(uint256 => uint256) public leaderFees;
    mapping(uint256 => address[]) public followersList;
    mapping(uint256 => uint256) public totalDeposits;

    // --------- EVENTS ---------
    event LeaderRegistered(uint256 indexed leaderId, address indexed leader, string meta);
    event Subscribed(uint256 indexed leaderId, address indexed follower, uint256 amount);
    event Unsubscribed(uint256 indexed leaderId, address indexed follower, uint256 amount);

    event LeaderSignal(
        uint256 indexed leaderId,
        string action,
        uint256 sizeUsd,
        bool isLong,
        address indexToken,
        uint256 entryPrice
    );

    event FollowerMirrored(
        uint256 indexed leaderId,
        address indexed follower,
        string action,
        uint256 sizeUsd,
        bool isLong,
        uint256 entryPrice,
        address indexToken
    );

    event FollowerPnLSettled(uint256 indexed leaderId, address indexed follower, int256 pnlUsd);
    event LeaderFeesAccrued(uint256 indexed leaderId, uint256 amount);
    event LeaderWithdraw(uint256 indexed leaderId, address indexed to, uint256 amount);

    // --------- MODIFIERS ---------
    modifier onlyLeader(uint256 leaderId) {
        require(leaders[leaderId].leaderAddress == msg.sender, "Not leader");
        _;
    }

    // --------- CONSTRUCTOR ---------
    constructor(address _collateralToken) Ownable(msg.sender) {
        require(_collateralToken != address(0), "collateral required");
        collateralToken = IERC20(_collateralToken);
    }

    // --------- LEADER FLOW ---------
    function registerLeader(string calldata meta, uint16 feeBps) external returns (uint256) {
        uint256 leaderId = nextLeaderId++;
        leaders[leaderId] = Leader({
            leaderAddress: msg.sender,
            totalFollowers: 0,
            active: true,
            meta: meta,
            feeBps: feeBps
        });

        emit LeaderRegistered(leaderId, msg.sender, meta);
        return leaderId;
    }

    function leaderOpenPosition(
        uint256 leaderId,
        bool isLong,
        uint256 entryPrice,  
        uint256 sizeUsd,
        address indexToken
    ) external onlyLeader(leaderId) nonReentrant {

        require(!leaderPositions[leaderId].isOpen, "position already open");

        leaderPositions[leaderId] = LeaderPosition({
            isLong: isLong,
            entryPrice: entryPrice,
            sizeUsd: sizeUsd,
            isOpen: true,
            indexToken: indexToken
        });

        emit LeaderSignal(
            leaderId,
            isLong ? "OPEN_LONG" : "OPEN_SHORT",
            sizeUsd,
            isLong,
            indexToken,
            entryPrice
        );

        _mirrorTrade(
            leaderId,
            isLong ? "OPEN_LONG" : "OPEN_SHORT",
            sizeUsd,
            isLong,
            indexToken,
            entryPrice 
        );
    }

    function leaderClose(uint256 leaderId) external onlyLeader(leaderId) nonReentrant {
        LeaderPosition storage lp = leaderPositions[leaderId];
        require(lp.isOpen, "no open position");

        lp.isOpen = false;

        emit LeaderSignal(
            leaderId,
            "CLOSE",
            0,
            lp.isLong,
            lp.indexToken,
            0 
        );
    }

    // --------- FOLLOWER FLOW ---------
    function subscribe(uint256 leaderId, uint256 amount) external nonReentrant {
        require(leaders[leaderId].active, "leader not active");
        require(amount > 0, "amount > 0");

        collateralToken.safeTransferFrom(msg.sender, address(this), amount);

        if (deposits[leaderId][msg.sender] == 0) {
            followersList[leaderId].push(msg.sender);
            leaders[leaderId].totalFollowers += 1;
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
        leaders[leaderId].totalFollowers -= 1;

        _removeFollower(leaderId, msg.sender);
        collateralToken.safeTransfer(msg.sender, dep);

        emit Unsubscribed(leaderId, msg.sender, dep);
    }

    // --------- MIRRORING ---------
    function _mirrorTrade(
        uint256 leaderId,
        string memory action,
        uint256 sizeUsd,
        bool isLong,
        address indexToken,
        uint256 entryPrice // FIX
    ) internal {

        address[] storage fl = followersList[leaderId];
        uint256 totDep = totalDeposits[leaderId];
        if (totDep == 0) return;

        for (uint256 i = 0; i < fl.length; i++) {
            address follower = fl[i];
            uint256 dep = deposits[leaderId][follower];
            if (dep == 0) continue;

            uint256 followerSizeUsd = (sizeUsd * dep) / totDep;

            followerPositions[leaderId][follower] = FollowerPosition({
                isLong: isLong,
                entryPrice: entryPrice,
                sizeUsd: followerSizeUsd,
                isOpen: true,
                indexToken: indexToken
            });

            emit FollowerMirrored(
                leaderId,
                follower,
                action,
                followerSizeUsd,
                isLong,
                entryPrice,
                indexToken
            );
        }
    }

    // --------- OFF-CHAIN PNL SETTLEMENT ---------
    function settleFollowerPnL(
        uint256 leaderId,
        address follower,
        int256 pnlUsd
    ) external onlyOwner nonReentrant { // FIX: backend-controlled settlement

        uint256 dep = deposits[leaderId][follower];

        if (pnlUsd > 0) {
            uint256 profit = uint256(pnlUsd);
            uint256 fee = (profit * leaders[leaderId].feeBps) / 10000;

            deposits[leaderId][follower] += (profit - fee);
            leaderFees[leaderId] += fee;

            emit LeaderFeesAccrued(leaderId, fee);
        } else {
            uint256 loss = uint256(-pnlUsd);
            deposits[leaderId][follower] = loss >= dep ? 0 : dep - loss;
        }

        followerPositions[leaderId][follower].isOpen = false;

        emit FollowerPnLSettled(leaderId, follower, pnlUsd);
    }

    // --------- HELPERS ---------
    function _removeFollower(uint256 leaderId, address follower) internal {
        address[] storage fl = followersList[leaderId];
        for (uint256 i = 0; i < fl.length; i++) {
            if (fl[i] == follower) {
                fl[i] = fl[fl.length - 1];
                fl.pop();
                break;
            }
        }
    }

    // --------- ADMIN / FEES ---------
    function leaderWithdraw(uint256 leaderId, address to, uint256 amount)
        external
        onlyLeader(leaderId)
        nonReentrant
    {
        require(amount > 0, "amount 0");
        require(leaderFees[leaderId] >= amount, "insufficient fees");

        leaderFees[leaderId] -= amount;
        collateralToken.safeTransfer(to, amount);

        emit LeaderWithdraw(leaderId, to, amount);
    }
}
