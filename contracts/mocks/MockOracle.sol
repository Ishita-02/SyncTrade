// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IPriceOracle.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * Mock oracle for local testing. Owner can set price.
 */
contract MockOracle is IPriceOracle, Ownable {
    // price scaled by 1e18
    uint256 public price;

    constructor(uint256 initialPrice) Ownable(msg.sender) {
        price = initialPrice;
    }

    function setPrice(uint256 newPrice) external onlyOwner {
        price = newPrice;
    }

    function getPrice(address /* token */) external view override returns (uint256) {
        return price;
    }
}
