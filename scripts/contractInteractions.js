const { ethers } = require("hardhat");

async function main() {
  // Deploy MockPriceFeed
  const MockPriceFeed = await ethers.getContractFactory("MockV3Aggregator");
  const mockPriceFeed = await MockPriceFeed.deploy(8, 12341234);

  await mockPriceFeed.waitForDeployment();
  console.log("MockPriceFeed deployed to:", mockPriceFeed.target);

  //Deploy MockVRF
  const MockVrfCoordinator = await ethers.getContractFactory("VRFCoordinatorV2Mock");
  const mockVrfCoordinator = await MockVrfCoordinator.deploy(10000000000000, 100000);

  await mockVrfCoordinator.waitForDeployment();
  console.log("MockVRF deployed to:", mockVrfCoordinator.target);

  const [owner] = await ethers.getSigners();

  //Create subscription
  const tx = await mockVrfCoordinator.connect(owner).createSubscription();
  const receipt = await tx.wait();

  // Decode logs
  const logs = receipt.logs.map(log => mockVrfCoordinator.interface.parseLog(log));
  const subscriptionId = logs[0].args[0]; // event SubscriptionCreated(uint64 indexed subId, address owner);

  // Fund subscription
  await mockVrfCoordinator.connect(owner).fundSubscription(subscriptionId, 100000000000000);

  // Deploy BullBear contract
  const BullBear = await ethers.getContractFactory("BullBear");
  const bullBear = await BullBear.deploy(
    owner.address,
    1,
    mockPriceFeed.target,
    mockVrfCoordinator.target,
    "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
    subscriptionId
  );

  await bullBear.waitForDeployment();
  console.log("BullBear deployed to:", bullBear.target);

  //Add BullBear contract as consumer to VRFCoordinator subscription
  await mockVrfCoordinator.connect(owner).addConsumer(subscriptionId, bullBear.target);

  // Mint an NFT
  await bullBear.connect(owner).safeMint(owner.address);
  console.log("NFT minted by:", owner.address);

  //Check token URI
  let tokenURI = await bullBear.connect(owner).tokenURI(0);
  console.log("Token URI:", tokenURI);

  // Update price feed to lower price
  const newPrice = 1234123; // Set the new price value
  await mockPriceFeed.updateAnswer(newPrice);
  console.log("Price feed updated to:", newPrice);

  // Check price was updated
  const [, latestPrice] = await mockPriceFeed.latestRoundData();
  console.log("Latest price:", latestPrice);

  // Perform upkeep (updates token URIs)
  let upkeepNedded = false;
  while (!upkeepNedded) {
    [upkeepNedded] = await bullBear.connect(owner).checkUpkeep("0x");
  }
  const txResult = await bullBear.connect(owner).performUpkeep("0x");
  console.log(txResult);

  // Fulfill VRF request: this is a local environment, so we need to call fulfillRandomWords ourselves (requestRandomWords was called by performUpkeep)
  await mockVrfCoordinator.connect(owner).fulfillRandomWords(1, bullBear.target);

  //Check token URI
  tokenURI = await bullBear.connect(owner).tokenURI(0);
  console.log("Token URI:", tokenURI);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
