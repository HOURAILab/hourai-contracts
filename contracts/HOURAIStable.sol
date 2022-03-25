// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';

import './libraries/Multicall.sol';

// import "hardhat/console.sol";

interface IHOURAI {

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;

}

contract HOURAIStable is Multicall, ReentrancyGuard, ERC721Enumerable, IERC721Receiver {

    address public hourAi;
   
    constructor(address _hourAi) ERC721("HOURAI STABLE", "hourai stable") {
        hourAi = _hourAi;
    }

    /// @notice Used for ERC721 safeTransferFrom
    function onERC721Received(address, address, uint256, bytes memory) 
        public 
        pure
        virtual 
        override 
        returns (bytes4) 
    {
        return this.onERC721Received.selector;
    }

    function stake(uint256 hourAiId) external nonReentrant {
        IHOURAI(hourAi).safeTransferFrom(msg.sender, address(this), hourAiId);
        _mint(msg.sender, hourAiId);
    }

}