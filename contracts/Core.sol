// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * CopyXCore.sol
 * MVP copy-trading contract (ERC20 collateral)
 *
 * Notes:
 * - Collateral is an ERC20 token (set at deployment or via admin).
 * - All USD-like values (sizeUsd) are expected scaled by 1e18 (1 USD = 1e18 units).
 * - Price oracle returns price scaled by 1e18 for indexToken or collateral as appropriate.
 * - GMX router integration points are present and commented (TODO) — plug real ABIs/addresses when available.
 *
 * Security / gas:
 * - This MVP loops through followers on-chain when mirroring trades (OK for small follower counts).
 * - ReentrancyGuard is used for external state-changing entrypoints.
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./interfaces/IGMXRouter.sol";
import "./interfaces/IPriceOracle.sol";

contract Core is Ownable, ReentrancyGuard {
    
    using SafeERC20 for IERC20;

    // --------- STRUCTS ---------

    struct Leader {
        address leaderAddress;
        uint256 totalFollowers;
        bool active;
        string meta;         // optional short description
        uint16 feeBps;       // performance fee (basis points), reserved for future use
    }

    struct LeaderPosition {
        bool isLong;
        uint256 entryPrice; // scaled by 1e18
        uint256 sizeUsd;    // scaled by 1e18 (leader notional)
        bool isOpen;
        address indexToken; // market token the leader traded (e.g., ETH token address)
    }

    struct FollowerPosition {
        bool isLong;
        uint256 entryPrice; // scaled by 1e18
        uint256 sizeUsd;    // scaled by 1e18 (follower notional)
        bool isOpen;
        address indexToken;
    }

    // --------- STORAGE ---------

    IERC20 public collateralToken; // stable token used for deposits (e.g., test USDC)
    IGMXRouter public gmxRouter;    // GMX router (set by owner)
    IPriceOracle public priceOracle; // price oracle (set by owner)

    uint256 public nextLeaderId;

    mapping(uint256 => Leader) public leaders;
    mapping(uint256 => LeaderPosition) public leaderPositions;
    mapping(uint256 => mapping(address => FollowerPosition)) public followerPositions;

    // deposits in collateral token: leaderId => follower => amount
    mapping(uint256 => mapping(address => uint256)) public deposits;

    // follower list per leader
    mapping(uint256 => address[]) public followersList;

    // total deposits per leader
    mapping(uint256 => uint256) public totalDeposits;

    // --------- EVENTS ---------

    event LeaderRegistered(uint256 indexed leaderId, address indexed leader, string meta);
    event Subscribed(uint256 indexed leaderId, address indexed follower, uint256 amount);
    event Unsubscribed(uint256 indexed leaderId, address indexed follower, uint256 amount);

    event LeaderSignal(uint256 indexed leaderId, string action, uint256 sizeUsd, bool isLong, address indexToken);
    event FollowerMirrored(uint256 indexed leaderId, address indexed follower, string action, uint256 sizeUsd, bool isLong, uint256 entryPrice, address indexToken);

    event PositionClosed(uint256 indexed leaderId, address indexed follower);
    event LeaderWithdraw(uint256 indexed leaderId, address indexed to, uint256 amount);

    // --------- MODIFIERS ---------

    modifier onlyLeader(uint256 leaderId) {
        require(leaders[leaderId].leaderAddress == msg.sender, "Not leader");
        _;
    }

    // --------- CONSTRUCTOR / ADMIN ---------

    constructor (
        address _collateralToken,
        address _priceOracle
    ) Ownable(msg.sender) {
        require(_collateralToken != address(0), "collateral required");
        collateralToken = IERC20(_collateralToken);
        priceOracle = IPriceOracle(_priceOracle);
    }

    /// Admin can set GMX router address (for testnet integration)
    function setGmxRouter(address _gmxRouter) external onlyOwner {
        gmxRouter = IGMXRouter(_gmxRouter);
    }

    /// Admin can set Price Oracle
    function setPriceOracle(address _oracle) external onlyOwner {
        priceOracle = IPriceOracle(_oracle);
    }

    /// Admin can change collateral token (if you want)
    function setCollateralToken(address _token) external onlyOwner {
        collateralToken = IERC20(_token);
    }

    // --------- LEADER FLOW ---------

    /// Register as a leader. Optionally include a short metadata string.
    function registerLeader(string calldata meta, uint16 feeBps) external returns (uint256) {
        uint256 leaderId = nextLeaderId++;
        leaders[leaderId] = Leader({ leaderAddress: msg.sender, totalFollowers: 0, active: true, meta: meta, feeBps: feeBps });

        emit LeaderRegistered(leaderId, msg.sender, meta);
        return leaderId;
    }

    /// Leader opens a long position. `sizeUsd` scaled by 1e18. `indexToken` is the traded asset (e.g., ETH token address)
    function leaderOpenLong(uint256 leaderId, uint256 sizeUsd, address indexToken) external onlyLeader(leaderId) nonReentrant {
        uint256 price = _getPrice(indexToken);

        leaderPositions[leaderId] = LeaderPosition({
            isLong: true,
            entryPrice: price,
            sizeUsd: sizeUsd,
            isOpen: true,
            indexToken: indexToken
        });

        emit LeaderSignal(leaderId, "OPEN_LONG", sizeUsd, true, indexToken);

        _mirrorTrade(leaderId, "OPEN_LONG", sizeUsd, true, indexToken);
    }

    /// Leader opens a short
    function leaderOpenShort(uint256 leaderId, uint256 sizeUsd, address indexToken) external onlyLeader(leaderId) nonReentrant {
        uint256 price = _getPrice(indexToken);

        leaderPositions[leaderId] = LeaderPosition({
            isLong: false,
            entryPrice: price,
            sizeUsd: sizeUsd,
            isOpen: true,
            indexToken: indexToken
        });

        emit LeaderSignal(leaderId, "OPEN_SHORT", sizeUsd, false, indexToken);

        _mirrorTrade(leaderId, "OPEN_SHORT", sizeUsd, false, indexToken);
    }

    /// Leader closes their position — mirrors close for followers
    function leaderClose(uint256 leaderId) external onlyLeader(leaderId) nonReentrant {
        LeaderPosition storage lp = leaderPositions[leaderId];
        require(lp.isOpen, "leader no open pos");

        lp.isOpen = false;

        emit LeaderSignal(leaderId, "CLOSE", 0, false, lp.indexToken);

        _mirrorClose(leaderId);
    }

    // --------- FOLLOWER FLOW (ERC20 deposits) ---------

    /// Subscribe by depositing collateral token. Approve before calling.
    function subscribe(uint256 leaderId, uint256 amount) external nonReentrant {
        require(leaders[leaderId].active, "leader not active");
        require(amount > 0, "amount > 0");

        // transferFrom follower to contract
        collateralToken.safeTransferFrom(msg.sender, address(this), amount);

        // add to mapping & list if first time
        if (deposits[leaderId][msg.sender] == 0) {
            followersList[leaderId].push(msg.sender);
            leaders[leaderId].totalFollowers += 1;
        }

        deposits[leaderId][msg.sender] += amount;
        totalDeposits[leaderId] += amount;

        emit Subscribed(leaderId, msg.sender, amount);
    }

    /// Unsubscribe and withdraw entire deposit for that leader (MVP)
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

    /// Leader (or owner) can withdraw any protocol-held tokens accidentally sent (admin safety)
    function adminWithdrawERC20(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
    }

    // --------- MIRRORING LOGIC (COMPLETE) ---------

    /**
     * Mirror leader trade to followers proportionally.
     * - sizeUsd: leader notional (scaled 1e18)
     * - followerSizeUsd = sizeUsd * deposits[follower] / totalDeposits[leaderId]
     *
     * The contract sets followerPositions[leaderId][follower] and emits FollowerMirrored.
     * Optionally (TODO) we can call GMX router here to open onchain positions.
     */
    function _mirrorTrade(
        uint256 leaderId,
        string memory action,
        uint256 sizeUsd,
        bool isLong,
        address indexToken
    ) internal {
        address[] storage fl = followersList[leaderId];
        uint256 len = fl.length;
        if (len == 0) {
            return;
        }

        uint256 totDep = totalDeposits[leaderId];
        if (totDep == 0) return;

        uint256 price = _getPrice(indexToken);

        for (uint256 i = 0; i < len; i++) {
            address follower = fl[i];
            uint256 dep = deposits[leaderId][follower];
            if (dep == 0) continue;

            uint256 followerSizeUsd = (sizeUsd * dep) / totDep;

            followerPositions[leaderId][follower] = FollowerPosition({
                isLong: isLong,
                entryPrice: price,
                sizeUsd: followerSizeUsd,
                isOpen: true,
                indexToken: indexToken
            });

            // Optionally open position on GMX for follower:
            // _maybeCallGMXForFollower(follower, followerSizeUsd, isLong, indexToken);

            emit FollowerMirrored(leaderId, follower, action, followerSizeUsd, isLong, price, indexToken);
        }

        // Optionally open position on GMX for leader as well:
        // _maybeCallGMXForLeader(leaderId, sizeUsd, isLong, indexToken);
    }

    /**
     * Mirror close: close all open follower positions for leader
     */
    function _mirrorClose(uint256 leaderId) internal {
        address[] storage fl = followersList[leaderId];
        uint256 len = fl.length;
        if (len == 0) return;

        for (uint256 i = 0; i < len; i++) {
            address follower = fl[i];

            FollowerPosition storage fp = followerPositions[leaderId][follower];
            if (fp.isOpen) {
                fp.isOpen = false;
                emit PositionClosed(leaderId, follower);

                // Optionally close GMX positions here:
                // _maybeCallGMXForFollowerClose(follower, fp.sizeUsd, fp.isLong, fp.indexToken);
            }
        }
    }

    // --------- OPTIONAL: GMX BRIDGE STUBS (replace with real calls) ---------

    /**
     * These functions are placeholders showing where you'd call the GMX router
     * to open/close per-follower or leader positions on-chain.
     *
     * WARNING: real GMX calls require correct parameters, approvals, and gas budgeting.
     */

    function _maybeCallGMXForFollower(
        address follower,
        uint256 followerSizeUsd,
        bool isLong,
        address indexToken
    ) internal {
        // Example (pseudocode):
        // if (address(gmxRouter) != address(0)) {
        //     // convert followerSizeUsd (USD) to sizeDelta param expected by GMX
        //     // call gmxRouter.increasePosition(contractAccountOrFollower, collateralToken, indexToken, sizeDelta, isLong);
        // }
    }

    function _maybeCallGMXForLeader(
        uint256 leaderId,
        uint256 sizeUsd,
        bool isLong,
        address indexToken
    ) internal {
        // similar to above
    }

    // --------- HELPERS / VIEWS ---------

    function _getPrice(address indexToken) internal view returns (uint256) {
        if (address(priceOracle) == address(0)) {
            revert("oracle not set");
        }
        return priceOracle.getPrice(indexToken);
    }

    function getFollowers(uint256 leaderId) external view returns (address[] memory) {
        return followersList[leaderId];
    }

    function getFollowerPosition(uint256 leaderId, address follower) external view returns (FollowerPosition memory) {
        return followerPositions[leaderId][follower];
    }

    function getLeaderPosition(uint256 leaderId) external view returns (LeaderPosition memory) {
        return leaderPositions[leaderId];
    }

    // remove follower using swap-and-pop (internal)
    function _removeFollower(uint256 leaderId, address follower) internal {
        address[] storage fl = followersList[leaderId];
        uint256 len = fl.length;
        for (uint256 i = 0; i < len; i++) {
            if (fl[i] == follower) {
                fl[i] = fl[len - 1];
                fl.pop();
                break;
            }
        }
    }

    // --------- UTIL / ADMIN ---------

    /// Leader can withdraw accrued profit if you implement fee logic later (placeholder)
    function leaderWithdraw(uint256 leaderId, address to, uint256 amount) external onlyLeader(leaderId) nonReentrant {
        // Placeholder for fee/profit withdrawal flow. For MVP, this can remain unused.
        emit LeaderWithdraw(leaderId, to, amount);
    }
}
