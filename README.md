# hourai-contracts

### This repo is built for the HOURAI NFTs.

#### HOURAI:
-   use ERC721a implementation
-   there are 2 phases
    -   `phase1: whitelist sale`
        -  start with `startTimeOfWhiteListMint` and end with `startTimeOfPublicSale`
        -  only `whitelist` can mint NFT， there are `4` types of whitelist address which can mint `1,2,10,1` NFTs respectively.

    -   `phase2: public sale`
        -  marked with `startTimeOfPublicSale` and no end time limit but can be closed by owner
        -  each address can mint at most `1` NFTs.

- sale (whitelist and public Sale) up to `2400` NFTs.
- `600` NFTs reserved for the official team.
  

#### HOURAI Stable:
- use normal ERC721 implementation by @openzeppelin.
- receive HOURAI NFTs and mint HOURAI Stable NFTs for the sender.
- a multi-sig official `recipient` address can claim the HOURAI NFTs in this contract.
  