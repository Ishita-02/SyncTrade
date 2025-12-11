// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Simple oracle interface returning price scaled by 1e18
 * e.g., if ETH = $3,000, return 3000 * 1e18
 */
interface IPriceOracle {
    function getPrice(address token) external view returns (uint256);
}
