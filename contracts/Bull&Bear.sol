// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from  "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {AutomationCompatible} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

contract BullBear is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable, VRFConsumerBaseV2, AutomationCompatible {
    uint256 private _nextTokenId;

    uint public /*immutable*/ interval;
    uint public lastTimeStamp;
    AggregatorV3Interface public priceFeed;
    int256 public currentPrice;
    
    VRFCoordinatorV2Interface immutable COORDINATOR;
    uint64 s_vrfSubscriptionId;
    bytes32 immutable s_vrfKeyHash;
    uint32 constant s_vrfCallbackGasLimit = 100000;
    uint16 constant s_vrfRequestConfirmations = 3;
    uint32 constant s_vrfNumWords = 1;
    uint256 public s_vrfRequestId;
    uint256 public s_vrfRandomNumber;

    // IPFS URIs for the dynamic nft graphics/metadata.
    // NOTE: These connect to my IPFS Companion node.
    // You should upload the contents of the /ipfs folder to your own node for development.
    string[] bullUrisIpfs = [
        "https://ipfs.io/ipfs/QmRXyfi3oNZCubDxiVFre3kLZ8XeGt6pQsnAQRZ7akhSNs?filename=gamer_bull.json",
        "https://ipfs.io/ipfs/QmRJVFeMrtYS2CUVUM2cHJpBV5aX2xurpnsfZxLTTQbiD3?filename=party_bull.json",
        "https://ipfs.io/ipfs/QmdcURmN1kEEtKgnbkVJJ8hrmsSWHpZvLkRgsKKoiWvW9g?filename=simple_bull.json"
    ];
    string[] bearUrisIpfs = [
        "https://ipfs.io/ipfs/Qmdx9Hx7FCDZGExyjLR6vYcnutUR8KhBZBnZfAPHiUommN?filename=beanie_bear.json",
        "https://ipfs.io/ipfs/QmTVLyTSuiKGUEmb88BgXG3qNC8YgpHZiFbjHrXKH3QHEu?filename=coolio_bear.json",
        "https://ipfs.io/ipfs/QmbKhBXVWmwrYsTPFYfroR2N7NAekAMxHUVg2CWks7i9qj?filename=simple_bear.json"
    ];

    event TokensUpdated(string marketTrend);
    event ReturnedRandomNumber(uint256 randomNumber);

    constructor(address initialOwner, 
        uint256 updateInterval, 
        address priceFeedAddress, 
        address vrfCoordinatorAddress,
        bytes32 vrfKeyHash,
        uint64 vrfSubscriptionId)
        ERC721("Bull&Bear", "B&B")
        Ownable(initialOwner)
        VRFConsumerBaseV2(vrfCoordinatorAddress)
    {
        interval = updateInterval;
        lastTimeStamp = block.timestamp;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
        currentPrice = getLatestPrice();
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinatorAddress);
        s_vrfKeyHash = vrfKeyHash;
        s_vrfSubscriptionId = vrfSubscriptionId;
    }

    function safeMint(address to) external {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        
        //Defaults to gamer bull NFT
        string memory defaultUri = bullUrisIpfs[0];
        _setTokenURI(tokenId, defaultUri);
    }

    function checkUpkeep(bytes calldata /*checkData*/) external view returns (bool upkeepNeeded, bytes memory /*performData*/){
        upkeepNeeded = (block.timestamp - lastTimeStamp) >= interval;
    }

    function performUpkeep(bytes calldata /*performData*/) external {
        if((block.timestamp - lastTimeStamp) >= interval){
            lastTimeStamp = block.timestamp;
            requestRandomWords();
        } 
    }

    function getLatestPrice() public view returns (int256 price) {
        (, price,,,) = priceFeed.latestRoundData();
    }
    
    /**
     * @notice Requests randomness
     * Assumes the subscription is funded sufficiently; "Words" refers to unit of data in Computer Science
     */
    function requestRandomWords() public {
        // Will revert if subscription is not set and funded.
        s_vrfRequestId = COORDINATOR.requestRandomWords(
            s_vrfKeyHash,
            s_vrfSubscriptionId,
            s_vrfRequestConfirmations,
            s_vrfCallbackGasLimit,
            s_vrfNumWords
        );
    }

    /**
     * @notice Callback function used by VRF Coordinator
     * @param  - id of the request
     * @param randomWords - array of random results from VRF Coordinator
     */
    function fulfillRandomWords(
        uint256 /* requestId */,
        uint256[] memory randomWords
    ) internal override {
        s_vrfRandomNumber = randomWords[0] % 3; // Random number with value 0, 1 or 2
        emit ReturnedRandomNumber(s_vrfRandomNumber);
        
        int latestPrice = getLatestPrice();

        if(latestPrice == currentPrice) return;
        if(latestPrice < currentPrice) {
            //bear
            updateAllTokenUris("bear", s_vrfRandomNumber);
        } else {
            //bull
            updateAllTokenUris("bull", s_vrfRandomNumber);
        }

        currentPrice = latestPrice;
    }

    function updateAllTokenUris(string memory trend, uint256 randomNumber) internal {
        if(compareStrings(trend, "bear")){
            for(uint256 i; i < _nextTokenId; i++) {
            _setTokenURI(i, bearUrisIpfs[randomNumber]);
            }
        } else{
            for(uint256 i; i < _nextTokenId; i++) {
            _setTokenURI(i, bullUrisIpfs[randomNumber]);
            }
        }

        emit TokensUpdated(trend);
    }

    function setInterval(uint256 newInterval) public onlyOwner {
        interval = newInterval;
    }

    function setPriceFeed(address newFeed) public onlyOwner {
        priceFeed = AggregatorV3Interface(newFeed);
    }

    //Helper functions
    function compareStrings(string memory a, string memory b) internal pure returns (bool){
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }

    // The following functions are overrides required by Solidity.

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}