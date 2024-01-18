# Chainlink VRF, Automation and Price Feeds

On the fifth project of the Road to Web 3 program we leveraged three of Chainlink's services to make dynamic, randomized NFTs with changing metadata based on the price of Bitcoin. You can find the explanation of the project's basics [here](https://docs.alchemy.com/docs/connect-apis-to-your-smart-contracts-using-chainlink), however, for more up to date version of the contract check out the code in this repo. 

## Table of Contents
- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Future Improvements](#future-improvements)
- [Contracts and subscriptions](#contracts-and-subscriptions)
- [Demo](#demo)

## Overview

The Bull & Bear NFTs change their metadata in a set interval thanks to Chainlink [Automation](https://automation.chain.link/), according to the change in price of a chosen asset, in our case, Bitcoin, which is made possible by Chainlink's [price feeds](https://docs.chain.link/data-feeds/price-feeds). Also, there are three different images both for bears and bulls, as you can see below. In order to select one of them at random when the Bitcoin price trend changes, we used Chainlink [VRF](https://vrf.chain.link/).

<p align="center">
  <img src="https://github.com/arynyestos/RoadToWeb3Chainlink/assets/33223441/e1319857-076f-4b19-90eb-6b92fe5e6396" style="width: 10vw;">
</p>

## Technology Stack

Although in Alchemy University's tutorial Remix was used, for this project we preferred to use Hardhat, which is a more suitable environment for more complex projects. This way we could keep learning this tool. For instance, verifying the contract directly in the deploy script was something we hadn't done before. Also, as you can see [here](https://github.com/arynyestos/RoadToWeb3Chainlink/blob/main/scripts/contractInteractions.js) a script that checked the whole functionality of the smart contract interacting with it was written, to check everything was in place, using mock contracts.

## Contracts and subscriptions

 - Bull & Bear [contract](https://sepolia.etherscan.io/address/0xd859D85789892f5Ab4837a84480A5b6720961Dba) deployed on Sepolia
 - Chainlink VRF [subscription](https://vrf.chain.link/sepolia/8553)
 - Chainlink [upkeep](https://automation.chain.link/sepolia/54160409165386770557288127799710003313191267279451333735004520043172341589585)

## Demo

After the contract is deployed using the deploy script, we must add it as a consumer to the VRF subscription:
<p align="center">
  <img src="https://github.com/arynyestos/RoadToWeb3Chainlink/assets/33223441/bc0e3493-3ba0-4d40-a9ac-d8a67b1672cd">
</p>

Once this is done, we configure the upkeep with the contract's address and the function we want to automate. Once all Chainlink services are correctly set up, we mint an NFT to our address, defaulting to the Gamer Bull NFT, which we could see at the OpenSea Testnet site:

<p align="center">
  <img src="https://github.com/arynyestos/RoadToWeb3Chainlink/assets/33223441/fb535feb-e99f-4c72-9d71-c7a1442a6d31)">
</p>

Then the upkeep will initiate the modification of the NFT's metadata, according to the trend of Bitcoin's price in the selected interval. As we can see, the price went down, since the NFT switched to Simple Bear:

<p align="center">
  <img src="https://github.com/arynyestos/RoadToWeb3Chainlink/assets/33223441/6229f568-396e-4fba-8984-8f34713262ca">
</p>

After another interval, we can see, both in Etherscan and OS how the metadata changes to Coolio Bear, as the price of Bitcoin kept on a downward trend:
<p align="center">
  <img src="https://github.com/arynyestos/RoadToWeb3Chainlink/assets/33223441/4cd1f817-77f8-42ec-a7de-a561ea4eb7ac">
</p>

However, OS didn't update the metadata fast enough, showing only the name of the modified NFT, which as a known behaviour:
<p align="center">
  <img src="https://github.com/arynyestos/RoadToWeb3Chainlink/assets/33223441/6d82e8e1-d2a1-4178-bfee-e18374cee33d">
</p>
