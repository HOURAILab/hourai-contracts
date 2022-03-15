//  SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./libraries/ERC721A.sol";

import "./libraries/Multicall.sol";

import "@openzeppelin/contracts/access/Ownable.sol";


contract HOURAI is Multicall, Ownable, ERC721A {

    string public baseURI;

    struct Config {
        uint256 maxBatchSize;
        uint256 maxSize;
        uint256 startTimeOfWhiteListMint;
        uint256 startTimeOfPublicSale;
        uint256 priceOfWhiteListMint;
        uint256 priceOfPublicSale;
    }

    uint256 constant maxSizeOfA = 1100;
    uint256 constant maxSizeOfB = 300;
    uint256 constant maxSizeOfC = 100;
    uint256 constant maxSizeOfWhiteListNum = 1500;

    uint256 public mintNum;

    Config public config;

    mapping(address=>uint8) public whiteListRemain;
    mapping(address=>uint8) public publicSaleNum;

    bool public enable;

    address ethReceiver;

    receive() external payable {}

    constructor(
        string memory name_,
        string memory symbol_,
        string memory baseURI_,
        Config memory config_,
        address ethReceiver_
    ) ERC721A(name_, symbol_, config_.maxBatchSize, config_.maxSize) {
        baseURI = baseURI_;
        mintNum = 0;
        config = config_;
        enable = true;
        ethReceiver = ethReceiver_;
        require(config_.startTimeOfWhiteListMint > config_.startTimeOfPublicSale, "White List Mint First");
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string calldata newBaseURI) internal onlyOwner {
        baseURI = newBaseURI;
    }

    function setWhiteListAddress(address[] calldata addrList, uint8 sizePerAddr) external onlyOwner {
        require(sizePerAddr == 1 || sizePerAddr == 2 || sizePerAddr == 10);
        for (uint256 i = 0; i < addrList.length; i ++) {
            whiteListRemain[addrList[i]] = sizePerAddr;
        }
    }

    function _safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, "STE");
    }
    function checkPayableAndRefundIfOver(uint256 totalPrice) private {
        require(msg.value >= totalPrice, "Need to send more ETH.");
        if (msg.value > totalPrice) {
            _safeTransferETH(msg.sender, msg.value - totalPrice);
        }
    }

    function _mint721A(uint256 quantity, address to) internal {
        uint256 batch = quantity / config.maxBatchSize;
        uint256 remain = quantity % config.maxBatchSize;
        for (uint256 i = 0; i < batch; i ++) {
            _safeMint(to, config.maxBatchSize);
        }
        if (remain > 0) {
            _safeMint(to, remain);
        }
    }

    function mint(uint256 quantity) external payable {
        require(enable, "Not Enable");
        require(quantity > 0, "Quantity should be >0");
        require(block.timestamp >= config.startTimeOfWhiteListMint, "Not Start");
        require(mintNum + quantity < config.maxSize, "Remain NFT Not Enough");
        uint256 price = (block.timestamp >= config.startTimeOfPublicSale) ? config.priceOfPublicSale : config.priceOfWhiteListMint;
        checkPayableAndRefundIfOver(quantity * price);

        if (block.timestamp < config.startTimeOfPublicSale) {
            // time for white list mint

            // do not need to explitly check in 8.0
            uint256 remain = uint256(whiteListRemain[msg.sender]) - quantity;
            whiteListRemain[msg.sender] = uint8(remain);
        } else {
            // time for public sale mint

            uint256 saleNum = uint256(publicSaleNum[msg.sender]);
            require(saleNum + quantity < 3, "Public Sale At Most 3 NFT");
        }
        _mint721A(quantity, msg.sender);
    }

    // management interfaces

    function collectEther() external {
        require(msg.sender == ethReceiver, "Not Receiver");
        _safeTransferETH(msg.sender, address(this).balance);
    }

    function modifyEthReceiver(address _ethReceiver) external onlyOwner {
        ethReceiver = _ethReceiver;
    }

    function modifyEnable(bool enable_) external onlyOwner {
        enable = enable_;
    }

    function modifystartTimeOfWhiteListMint(uint256 startTimeOfWhiteListMint) external onlyOwner {
        require(block.timestamp < config.startTimeOfWhiteListMint, "White List Mint Has Started");
        require(block.timestamp <= startTimeOfWhiteListMint, "New Start Time Too Late");
        require(startTimeOfWhiteListMint < config.startTimeOfPublicSale, "White List Mint First");
        config.startTimeOfWhiteListMint = startTimeOfWhiteListMint;
    }

    function modifystartTimeOfPublicSale(uint256 startTimeOfPublicSale) external onlyOwner {
        require(block.timestamp < config.startTimeOfPublicSale, "Public Sale Has Started");
        require(block.timestamp <= startTimeOfPublicSale, "New Start Time Too Late");
        require(config.startTimeOfWhiteListMint < startTimeOfPublicSale, "White List Mint First");
        config.startTimeOfPublicSale = startTimeOfPublicSale;
    }
}