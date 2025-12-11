// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ChainlinkOracle is Ownable {

    constructor() Ownable(msg.sender) {}


    // token => chainlink feed
    mapping(address => address) public feeds;

    event FeedSet(address indexed token, address indexed feed);

    function setFeed(address token, address feed) external onlyOwner {
        require(feed != address(0), "Invalid feed");
        feeds[token] = feed;
        emit FeedSet(token, feed);
    }

    function getPrice(address token) external view returns (uint256) {
        address feed = feeds[token];
        require(feed != address(0), "Feed not set");

        (, int256 price,,,) = AggregatorV3Interface(feed).latestRoundData();
        require(price > 0, "Invalid price");

        // Chainlink returns 8-decimal price; upscale to 1e18
        return uint256(price) * 1e10;
    }
}
