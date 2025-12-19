// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Core.sol
 * CopyX core contract with on-chain PnL settlement & leader fees (MVP)
 *
 * - Collateral is an ERC-20 USD-pegged token (18 decimals).
 * - priceOracle is ChainlinkOracle that returns prices scaled by 1e18.
 * - sizeUsd and entryPrice and priceOracle values are 1e18 scaled.
 */

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./interfaces/IGMXRouter.sol";
import "./ChainlinkOracle.sol";

contract Core is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // --------- STRUCTS ---------
    struct Leader {
        address leaderAddress;
        uint256 totalFollowers;
        bool active;
        string meta;
        uint16 feeBps; // basis points, e.g., 200 = 2%
    }

    struct LeaderPosition {
        bool isLong;
        uint256 entryPrice; // 1e18
        uint256 sizeUsd;    // 1e18
        bool isOpen;
        address indexToken;
    }

    struct FollowerPosition {
        bool isLong;
        uint256 entryPrice; // 1e18
        uint256 sizeUsd;    // 1e18
        bool isOpen;
        address indexToken;
    }

    // --------- STORAGE ---------
    IERC20 public collateralToken;
    IGMXRouter public gmxRouter;
    ChainlinkOracle public priceOracle;

    uint256 public nextLeaderId;

    mapping(uint256 => Leader) public leaders;
    mapping(uint256 => LeaderPosition) public leaderPositions;
    mapping(uint256 => mapping(address => FollowerPosition)) public followerPositions;

    // deposits (collateral token units, 18 decimals): leaderId => follower => amount
    mapping(uint256 => mapping(address => uint256)) public deposits;

    // leaderId => accumulated fees (collateral units)
    mapping(uint256 => uint256) public leaderFees;

    // followers list and totals
    mapping(uint256 => address[]) public followersList;
    mapping(uint256 => uint256) public totalDeposits;

    // --------- EVENTS ---------
    event LeaderRegistered(uint256 indexed leaderId, address indexed leader, string meta);
    event Subscribed(uint256 indexed leaderId, address indexed follower, uint256 amount);
    event Unsubscribed(uint256 indexed leaderId, address indexed follower, uint256 amount);

    event LeaderSignal(uint256 indexed leaderId, string action, uint256 sizeUsd, bool isLong, address indexToken, uint256 price);
    event FollowerMirrored(uint256 indexed leaderId, address indexed follower, string action, uint256 sizeUsd, bool isLong, uint256 entryPrice, address indexToken);

    event PositionClosed(uint256 indexed leaderId, address indexed follower);
    event FollowerPnLSettled(uint256 indexed leaderId, address indexed follower, int256 pnlUsd); // signed pnl in 1e18 units
    event LeaderFeesAccrued(uint256 indexed leaderId, uint256 amount);
    event LeaderWithdraw(uint256 indexed leaderId, address indexed to, uint256 amount);

    // --------- MODIFIERS ---------
    modifier onlyLeader(uint256 leaderId) {
        require(leaders[leaderId].leaderAddress == msg.sender, "Not leader");
        _;
    }

    // --------- CONSTRUCTOR / ADMIN ---------
    constructor(address _collateralToken, address _priceOracle) Ownable(msg.sender) {
        require(_collateralToken != address(0), "collateral required");
        collateralToken = IERC20(_collateralToken);
        priceOracle = ChainlinkOracle(_priceOracle);
    }

    function setGmxRouter(address _gmxRouter) external onlyOwner {
        gmxRouter = IGMXRouter(_gmxRouter);
    }

    function setPriceOracle(address _oracle) external onlyOwner {
        priceOracle = ChainlinkOracle(_oracle);
    }

    function setCollateralToken(address _token) external onlyOwner {
        collateralToken = IERC20(_token);
    }

    // --------- LEADER FLOW ---------
    function registerLeader(string calldata meta, uint16 feeBps) external returns (uint256) {
        uint256 leaderId = nextLeaderId++;
        leaders[leaderId] = Leader({ leaderAddress: msg.sender, totalFollowers: 0, active: true, meta: meta, feeBps: feeBps });
        emit LeaderRegistered(leaderId, msg.sender, meta);
        return leaderId;
    }

    function leaderOpenLong(uint256 leaderId, uint256 sizeUsd, address indexToken) external onlyLeader(leaderId) nonReentrant {
        require(!leaderPositions[leaderId].isOpen, "position already open");
        uint256 price = _getPrice(indexToken);

        leaderPositions[leaderId] = LeaderPosition({
            isLong: true,
            entryPrice: price,
            sizeUsd: sizeUsd,
            isOpen: true,
            indexToken: indexToken
        });

        emit LeaderSignal(leaderId, "OPEN_LONG", sizeUsd, true, indexToken, price);
        _mirrorTrade(leaderId, "OPEN_LONG", sizeUsd, true, indexToken);
    }

    function leaderOpenShort(uint256 leaderId, uint256 sizeUsd, address indexToken) external onlyLeader(leaderId) nonReentrant {
        require(!leaderPositions[leaderId].isOpen, "position already open");
        uint256 price = _getPrice(indexToken);

        leaderPositions[leaderId] = LeaderPosition({
            isLong: false,
            entryPrice: price,
            sizeUsd: sizeUsd,
            isOpen: true,
            indexToken: indexToken
        });

        emit LeaderSignal(leaderId, "OPEN_SHORT", sizeUsd, false, indexToken, price);
        _mirrorTrade(leaderId, "OPEN_SHORT", sizeUsd, false, indexToken);
    }

    /// Close leader position and settle PnL for followers
    function leaderClose(uint256 leaderId) external onlyLeader(leaderId) nonReentrant {
        LeaderPosition storage lp = leaderPositions[leaderId];
        require(lp.isOpen, "leader no open pos");
        uint256 price = _getPrice(lp.indexToken);

        lp.isOpen = false;
        emit LeaderSignal(leaderId, "CLOSE", 0, false, lp.indexToken, price);

        _settleAndClose(leaderId);
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
    function _mirrorTrade(uint256 leaderId, string memory action, uint256 sizeUsd, bool isLong, address indexToken) internal {
        address[] storage fl = followersList[leaderId];
        uint256 len = fl.length;
        if (len == 0) return;
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

            emit FollowerMirrored(leaderId, follower, action, followerSizeUsd, isLong, price, indexToken);
        }
    }

    // --------- SETTLEMENT (PnL + fees) ---------
    function _settleAndClose(uint256 leaderId) internal {
        LeaderPosition storage lp = leaderPositions[leaderId];
        address[] storage fl = followersList[leaderId];
        uint256 len = fl.length;
        if (len == 0) return;

        uint256 exitPrice = _getPrice(lp.indexToken);
        uint16 feeBps = leaders[leaderId].feeBps;

        for (uint256 i = 0; i < len; i++) {
            address follower = fl[i];
            FollowerPosition storage fp = followerPositions[leaderId][follower];
            if (!fp.isOpen) continue;

            uint256 sizeUsd = fp.sizeUsd;
            uint256 entry = fp.entryPrice;
            uint256 exitP = exitPrice;

            int256 pnlSigned = 0;

            // Long case
            if (fp.isLong) {
                if (exitP >= entry) {
                    uint256 profitUsd = (sizeUsd * (exitP - entry)) / entry;
                    // leader fee
                    uint256 fee = (profitUsd * feeBps) / 10000;
                    if (fee > 0) {
                        leaderFees[leaderId] += fee;
                        emit LeaderFeesAccrued(leaderId, fee);
                    }
                    uint256 netProfit = profitUsd - fee;
                    deposits[leaderId][follower] += netProfit;
                    pnlSigned = int256(int256(uint256(netProfit)));
                } else {
                    uint256 lossUsd = (sizeUsd * (entry - exitP)) / entry;
                    uint256 dep = deposits[leaderId][follower];
                    if (lossUsd >= dep) {
                        deposits[leaderId][follower] = 0;
                        pnlSigned = -int256(int256(uint256(dep)));
                    } else {
                        deposits[leaderId][follower] = dep - lossUsd;
                        pnlSigned = -int256(int256(uint256(lossUsd)));
                    }
                }
            } else {
                // Short case
                if (entry >= exitP) {
                    uint256 profitUsd = (sizeUsd * (entry - exitP)) / entry;
                    uint256 fee = (profitUsd * feeBps) / 10000;
                    if (fee > 0) {
                        leaderFees[leaderId] += fee;
                        emit LeaderFeesAccrued(leaderId, fee);
                    }
                    uint256 netProfit = profitUsd - fee;
                    deposits[leaderId][follower] += netProfit;
                    pnlSigned = int256(int256(uint256(netProfit)));
                } else {
                    uint256 lossUsd = (sizeUsd * (exitP - entry)) / entry;
                    uint256 dep = deposits[leaderId][follower];
                    if (lossUsd >= dep) {
                        deposits[leaderId][follower] = 0;
                        pnlSigned = -int256(int256(uint256(dep)));
                    } else {
                        deposits[leaderId][follower] = dep - lossUsd;
                        pnlSigned = -int256(int256(uint256(lossUsd)));
                    }
                }
            }

            // mark follower closed and emit events
            fp.isOpen = false;
            emit FollowerPnLSettled(leaderId, follower, pnlSigned);
            emit PositionClosed(leaderId, follower);
        }
    }

    // --------- HELPER / VIEWS ---------
    function _getPrice(address indexToken) internal view returns (uint256) {
        require(address(priceOracle) != address(0), "oracle not set");
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
    function adminWithdrawERC20(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
    }

    function leaderWithdraw(uint256 leaderId, address to, uint256 amount) external onlyLeader(leaderId) nonReentrant {
        require(amount > 0, "amount 0");
        require(leaderFees[leaderId] >= amount, "insufficient fees");
        require(to != address(0), "invalid to");

        leaderFees[leaderId] -= amount;
        collateralToken.safeTransfer(to, amount);

        emit LeaderWithdraw(leaderId, to, amount);
    }
}
