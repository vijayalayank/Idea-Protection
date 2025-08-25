const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting IdeaRegistry deployment...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy the contract
  console.log("📄 Deploying IdeaRegistry contract...");
  const IdeaRegistry = await ethers.getContractFactory("IdeaRegistry");
  
  // Estimate gas
  const deploymentData = IdeaRegistry.interface.encodeDeploy([]);
  const estimatedGas = await deployer.estimateGas({ data: deploymentData });
  console.log("⛽ Estimated gas for deployment:", estimatedGas.toString());

  // Deploy with gas limit
  const ideaRegistry = await IdeaRegistry.deploy({
    gasLimit: estimatedGas * 120n / 100n // Add 20% buffer
  });

  console.log("⏳ Waiting for deployment transaction...");
  await ideaRegistry.waitForDeployment();

  const contractAddress = await ideaRegistry.getAddress();
  console.log("✅ IdeaRegistry deployed to:", contractAddress);

  // Get deployment transaction
  const deploymentTx = ideaRegistry.deploymentTransaction();
  console.log("📋 Deployment transaction hash:", deploymentTx.hash);
  console.log("🔗 Block number:", deploymentTx.blockNumber);

  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    transactionHash: deploymentTx.hash,
    blockNumber: deploymentTx.blockNumber,
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    gasUsed: deploymentTx.gasLimit?.toString(),
    abi: IdeaRegistry.interface.formatJson()
  };

  // Save to file
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to:", deploymentFile);

  // Save ABI for frontend
  const abiDir = path.join(__dirname, "../src/contracts");
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }

  const abiFile = path.join(abiDir, "IdeaRegistry.json");
  const abiData = {
    contractName: "IdeaRegistry",
    abi: JSON.parse(IdeaRegistry.interface.formatJson()),
    networks: {
      [hre.network.config.chainId]: {
        address: contractAddress,
        transactionHash: deploymentTx.hash
      }
    }
  };

  fs.writeFileSync(abiFile, JSON.stringify(abiData, null, 2));
  console.log("📄 ABI saved to:", abiFile);

  // Test the contract
  console.log("🧪 Testing contract functionality...");
  try {
    const totalIdeas = await ideaRegistry.totalIdeas();
    console.log("📊 Initial total ideas:", totalIdeas.toString());

    // Test registration (optional)
    if (hre.network.name === "localhost" || hre.network.name === "hardhat") {
      console.log("🔧 Testing idea registration...");
      const testTx = await ideaRegistry.registerIdea(
        "QmTestMetadataHash123456789",
        false,
        ""
      );
      await testTx.wait();
      console.log("✅ Test registration successful!");
    }

  } catch (error) {
    console.error("❌ Contract test failed:", error.message);
  }

  // Network-specific instructions
  const network = hre.network.name;
  console.log("\n🎉 Deployment completed successfully!");
  console.log("=" .repeat(50));
  console.log(`📍 Network: ${network}`);
  console.log(`📄 Contract: ${contractAddress}`);
  console.log(`🔗 Transaction: ${deploymentTx.hash}`);
  
  if (network === "mumbai") {
    console.log(`🔍 Verify on PolygonScan: https://mumbai.polygonscan.com/address/${contractAddress}`);
    console.log(`💰 Get test MATIC: https://faucet.polygon.technology/`);
  } else if (network === "polygon") {
    console.log(`🔍 Verify on PolygonScan: https://polygonscan.com/address/${contractAddress}`);
  } else if (network === "sepolia") {
    console.log(`🔍 Verify on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);
    console.log(`💰 Get test ETH: https://sepoliafaucet.com/`);
  }

  console.log("\n📋 Next steps:");
  console.log("1. Update your .env file with the contract address");
  console.log("2. Configure your backend with the new contract");
  console.log("3. Test the frontend integration");
  console.log("=" .repeat(50));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
