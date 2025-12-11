// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Minimal GMX Router interface for MVP.
 * Replace/extend with actual GMX router ABI for full integration.
 */
interface IGMXRouter {
    // This is a very simplified interface. Use the exact GMX ABIs for real calls.
    // NOTE: parameter ordering/typing here is placeholder and must be replaced with real GMX function signatures.
    function increasePosition(
        address _account,
        address _collateralToken,
        address _indexToken,
        uint256 _sizeDelta,
        bool _isLong
    ) external;

    function decreasePosition(
        address _account,
        address _collateralToken,
        address _indexToken,
        uint256 _sizeDelta,
        bool _isLong,
        address _receiver
    ) external;
}
