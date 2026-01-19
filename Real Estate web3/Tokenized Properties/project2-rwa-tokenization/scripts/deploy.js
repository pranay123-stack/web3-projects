const hre = require("hardhat");

async function main() {
  console.log("🏢 Deploying Real Estate RWA Tokenization Platform...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy PropertyTokenFactory
  console.log("1. Deploying PropertyTokenFactory...");
  const deploymentFee = hre.ethers.parseEther("0.01"); // 0.01 ETH deployment fee

  const PropertyTokenFactory = await hre.ethers.getContractFactory("PropertyTokenFactory");
  const factory = await PropertyTokenFactory.deploy(deploymentFee);
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("✅ PropertyTokenFactory deployed to:", factoryAddress);

  // Get Identity Registry address (deployed by factory)
  const identityRegistryAddress = await factory.identityRegistry();
  console.log("✅ IdentityRegistry deployed to:", identityRegistryAddress);

  // Register deployer as a verified investor for testing
  console.log("\n2. Registering deployer as verified investor...");
  const identityHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("KYC_VERIFIED_" + deployer.address));
  const countryCode = 356; // India ISO code

  await factory.registerInvestor(deployer.address, identityHash, countryCode);
  console.log("✅ Deployer registered as verified investor");

  // Create a sample property token
  console.log("\n3. Creating sample property token...");

  const propertyParams = {
    name: "Mumbai Tower Fractional",
    symbol: "MBTF",
    propertyId: "PROP-001",
    propertyAddress: "123 Business Park, Mumbai, India",
    propertyType: "commercial",
    totalValue: hre.ethers.parseEther("1000000"), // $1M
    tokenizedPercentage: 10000, // 100%
    legalDocumentURI: "ipfs://QmSampleLegalDocs"
  };

  const complianceParams = {
    maxInvestors: 500,
    minHoldingAmount: hre.ethers.parseEther("1"),
    maxHoldingAmount: hre.ethers.parseEther("100000"),
    holdingPeriod: 0,
    restrictedCountries: []
  };

  const tx = await factory.createPropertyToken(propertyParams, complianceParams, {
    value: deploymentFee
  });
  const receipt = await tx.wait();

  // Get the created token address from events
  const event = receipt.logs.find(log => {
    try {
      const parsed = factory.interface.parseLog(log);
      return parsed?.name === "PropertyTokenCreated";
    } catch {
      return false;
    }
  });

  let tokenAddress, complianceAddress;
  if (event) {
    const parsed = factory.interface.parseLog(event);
    tokenAddress = parsed.args[0];
    complianceAddress = parsed.args[1];
    console.log("✅ Sample RealEstateToken deployed to:", tokenAddress);
    console.log("✅ Sample ComplianceModule deployed to:", complianceAddress);
  }

  // Mint some tokens to deployer
  if (tokenAddress) {
    console.log("\n4. Minting sample tokens to deployer...");
    const RealEstateToken = await hre.ethers.getContractFactory("RealEstateToken");
    const token = RealEstateToken.attach(tokenAddress);

    const mintAmount = hre.ethers.parseEther("1000"); // 1000 tokens
    await token.mint(deployer.address, mintAmount);
    console.log("✅ Minted 1000 tokens to deployer");
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Network:", hre.network.name);
  console.log("PropertyTokenFactory:", factoryAddress);
  console.log("IdentityRegistry:", identityRegistryAddress);
  if (tokenAddress) {
    console.log("Sample RealEstateToken:", tokenAddress);
    console.log("Sample ComplianceModule:", complianceAddress);
  }
  console.log("Deployment Fee:", hre.ethers.formatEther(deploymentFee), "ETH");
  console.log("=".repeat(60));

  // Verification instructions
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n📝 To verify contracts on explorer:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${factoryAddress} ${deploymentFee}`);
  }

  return { factory, factoryAddress, identityRegistryAddress, tokenAddress, complianceAddress };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
