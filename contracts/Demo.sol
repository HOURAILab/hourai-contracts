// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./libraries/ERC721A.sol";

import "@openzeppelin/contracts/access/Ownable.sol";

contract Demo is Ownable, ERC721A {

    string public baseURI;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxBatchSize_,
        uint256 collectionSize_
    ) ERC721A(name_, symbol_, maxBatchSize_, collectionSize_) {}

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string calldata newBaseURI) internal onlyOwner {
        baseURI = newBaseURI;
    }

    uint256 public constant PRICE = 0.1 ether;

    function mint(uint256 quantity) external {
        require(totalSupply() + quantity <= collectionSize, 'too many');
        for (uint256 i = 0; i < quantity / maxBatchSize; i ++) {
            _safeMint(msg.sender, maxBatchSize);
        }
        if (quantity % maxBatchSize != 0) {
            _safeMint(msg.sender, quantity % maxBatchSize);
        }
        refundIfOver(quantity * PRICE);
    }

    function refundIfOver(uint256 price) private {
        require(msg.value >= price, "Need to send more ETH.");
        if (msg.value > price) {
             payable(msg.sender).transfer(msg.value - price);
        }
    }
}