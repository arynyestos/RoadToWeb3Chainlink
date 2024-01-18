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

    // Request random number
    const tx2 = await bullBear.connect(owner).requestRandomWords();
    const receipt2 = await tx2.wait();
    // Decode logs
    const logs2 = receipt2.logs.map(log => mockVrfCoordinator.interface.parseLog(log));
    const requestId = logs2[0].args[1];
    // event RandomWordsRequested(bytes32 indexed keyHash, uint256 requestId, uint256 preSeed, uint64 indexed subId, uint16 minimumRequestConfirmations, uint32 callbackGasLimit, uint32 numWords, address indexed sender);

    // Fulfill VRF request: this is a local environment, so we need to call fulfillRandomWords ourselves
    await mockVrfCoordinator.connect(owner).fulfillRandomWords(requestId, bullBear.target);

    // Check random number was received
    const randomNumber = await bullBear.connect(owner).s_vrfRandomNumber();
    console.log("Random number:", randomNumber);

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
