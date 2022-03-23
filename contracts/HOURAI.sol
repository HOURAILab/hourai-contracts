//  SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./libraries/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "hardhat/console.sol";

contract HOURAI is ReentrancyGuard, Ownable, ERC721A {

    string public baseURI;

    struct Config {
        uint256 maxBatchSize;
        uint256 maxSize;
        uint256 maxMintSize;
        uint256 maxPreserveSize;
        uint256 startTimeOfWhiteListMint;
        uint256 startTimeOfPublicSale;
        uint256 priceOfWhiteListMintABC;
        uint256 priceOfWhiteListMintD;
        uint256 priceOfPublicSale;
    }

    uint256 public mintNum;
    uint256 public preserveMintNum;

    Config public config;

    mapping(address=>uint8) public whiteListRemain;
    mapping(address=>bool) public whiteListIsD;
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
        preserveMintNum = 0;
        config = config_;
        config.maxPreserveSize = config_.maxSize - config_.maxMintSize;
        enable = true;
        ethReceiver = ethReceiver_;
        require(config_.startTimeOfWhiteListMint < config_.startTimeOfPublicSale, "White List Mint First");
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        baseURI = newBaseURI;
    }

    function setWhiteListAddress(address[] calldata addrList, uint8 sizePerAddr, bool isD) external onlyOwner {
        require(sizePerAddr == 1 || sizePerAddr == 2 || sizePerAddr == 10);
        for (uint256 i = 0; i < addrList.length; i ++) {
            whiteListRemain[addrList[i]] = sizePerAddr;
        }
        if (isD) {
            for (uint256 i = 0; i < addrList.length; i ++) {
                whiteListIsD[addrList[i]] = true;
            }
        }
    }

    function _safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, "STE");
    }
    function _checkPayableAndRefundIfOver(uint256 totalPrice) private {
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

    function getPrice(address user, uint256 timestamp) public view returns(uint256) {
        if (timestamp >= config.startTimeOfPublicSale) {
            return config.priceOfPublicSale;
        }
        if (whiteListIsD[user]) {
            return config.priceOfWhiteListMintD;
        }
        return config.priceOfWhiteListMintABC;
    }

    function mint(uint256 quantity) external payable nonReentrant {
        require(enable, "Not Enable");
        require(quantity > 0, "Quantity should be >0");
        require(block.timestamp >= config.startTimeOfWhiteListMint, "Not Start");
        require(mintNum + quantity <= config.maxMintSize, "Remain NFT Not Enough");
        uint256 price = getPrice(msg.sender, block.timestamp);
        _checkPayableAndRefundIfOver(quantity * price);

        if (block.timestamp < config.startTimeOfPublicSale) {
            // time for white list mint

            // do not need to explitly check in 8.0
            uint256 remain = uint256(whiteListRemain[msg.sender]) - quantity;
            whiteListRemain[msg.sender] = uint8(remain);
        } else {
            // time for public sale mint

            uint256 saleNum = uint256(publicSaleNum[msg.sender]);
            require(saleNum + quantity <= 1, "Public Sale At Most 1 NFT");
            publicSaleNum[msg.sender] = uint8(saleNum + quantity);
        }
        mintNum += quantity;
        _mint721A(quantity, msg.sender);
    }

    function tokensOfUser(address user)
        public
        view
        returns (uint256[] memory tokenIdList)
    {
        uint256 size = balanceOf(user);
        if (size == 0) {
            return tokenIdList;
        }
        tokenIdList = new uint256[](size);
        uint256 numMintedSoFar = totalSupply();
        uint256 tokenIdx = 0;
        address currOwnershipAddr = address(0);
        for (uint256 i = 0; i < numMintedSoFar; i++) {
            if (tokenIdx == size) {
                break;
            }
            TokenOwnership memory ownership = _ownerships[i];
            if (ownership.addr != address(0)) {
                currOwnershipAddr = ownership.addr;
            }
            if (currOwnershipAddr == user) {
                tokenIdList[tokenIdx] = i;
                tokenIdx ++;
            }
        }
        return tokenIdList;
    }

    // management interfaces

    function collectEther() external nonReentrant {
        require(msg.sender == ethReceiver, "Not Receiver");
        _safeTransferETH(msg.sender, address(this).balance);
    }

    function preserveMintFor(uint256 quantity, address recipient) external onlyOwner {
        require(preserveMintNum + quantity <= config.maxPreserveSize, 'Too Many Preserved');
        _mint721A(quantity, recipient);
        preserveMintNum += quantity;
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