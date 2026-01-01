// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IMintableERC20 {
    function mint(address to, uint256 amount) external;
}

contract TokenFaucet is Ownable {
    constructor() Ownable(msg.sender) {}

    struct FaucetToken {
        bool enabled;
        uint256 dripAmount;     
        uint256 maxPerWallet;   
        uint256 cooldown;       
    }

    mapping(address => FaucetToken) public faucetTokens;

    mapping(address => mapping(address => uint256)) public lastClaimAt;

    mapping(address => mapping(address => uint256)) public totalClaimed;

    event TokenAdded(address token);
    event TokenClaimed(address user, address token, uint256 amount);

    function addOrUpdateToken(
        address token,
        uint256 dripAmount,
        uint256 maxPerWallet,
        uint256 cooldown,
        bool enabled
    ) external onlyOwner {
        faucetTokens[token] = FaucetToken({
            enabled: enabled,
            dripAmount: dripAmount,
            maxPerWallet: maxPerWallet,
            cooldown: cooldown
        });

        emit TokenAdded(token);
    }

    function disableToken(address token) external onlyOwner {
        faucetTokens[token].enabled = false;
    }

    function claim(address token) external {
        FaucetToken memory cfg = faucetTokens[token];
        require(cfg.enabled, "Token not enabled");

        uint256 lastClaim = lastClaimAt[token][msg.sender];
        require(
            block.timestamp >= lastClaim + cfg.cooldown,
            "Cooldown active"
        );

        uint256 newTotal = totalClaimed[token][msg.sender] + cfg.dripAmount;
        require(
            newTotal <= cfg.maxPerWallet,
            "Max token limit reached"
        );

        lastClaimAt[token][msg.sender] = block.timestamp;
        totalClaimed[token][msg.sender] = newTotal;

        IMintableERC20(token).mint(msg.sender, cfg.dripAmount);

        emit TokenClaimed(msg.sender, token, cfg.dripAmount);
    }
}
