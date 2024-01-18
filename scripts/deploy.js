const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    console.log("Deploying contract with the account:", deployer.address);

    const BullBear = await ethers.getContractFactory("BullBear");
    const bullBear = await BullBear.deploy(
        deployer.address,
        5 * 60, // Minimal update interval in seconds
        "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43", // Price feed address
        "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625", // Sepolia VRF coordinator address
        "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c", // Sepolia VRF key hash
        8553 // VRF subscription ID
    );

    // await bullBear.waitForDeployment();
    console.log("BullBear deployed to:", bullBear.target);

    await bullBear.deploymentTransaction().wait(5) // Wait for five blocks before verification

    //verify (source: https://hardhat.org/hardhat-runner/plugins/nomiclabs-hardhat-etherscan#using-programmatically)
    await hre.run("verify:verify", {
        address: bullBear.target,
        contract: "contracts/Bull&Bear.sol:BullBear",
        constructorArguments: [
            deployer.address,
            5 * 60,
            "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43",
            "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
            "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
            8553],
    });

    console.log("Bull&Bear contract verified");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
