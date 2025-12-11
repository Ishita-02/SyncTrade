// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IGMXRouter.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

event MockIncrease(address indexed account, address collateral, address indexToken, uint256 sizeDelta, bool isLong);
event MockDecrease(address indexed account, address collateral, address indexToken, uint256 sizeDelta, bool isLong, address receiver);

/**
 * Minimal mock GMX router for testing.
 * It doesn't perform any real trading — just emits events so you can test flows end-to-end.
 */
contract MockGMX is IGMXRouter, Ownable {

    constructor() Ownable(msg.sender) {}
    
    function increasePosition(
        address _account,
        address _collateralToken,
        address _indexToken,
        uint256 _sizeDelta,
        bool _isLong
    ) external override {
        emit MockIncrease(_account, _collateralToken, _indexToken, _sizeDelta, _isLong);
    }

    function decreasePosition(
        address _account,
        address _collateralToken,
        address _indexToken,
        uint256 _sizeDelta,
        bool _isLong,
        address _receiver
    ) external override {
        emit MockDecrease(_account, _collateralToken, _indexToken, _sizeDelta, _isLong, _receiver);
    }
}
