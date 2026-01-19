const hre = require("hardhat");

async function main() {
  console.log("🏠 Deploying Real Estate NFT Marketplace...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy RealEstateNFT
  console.log("1. Deploying RealEstateNFT...");
  const mintingFee = hre.ethers.parseEther("0.01"); // 0.01 ETH minting fee

  const RealEstateNFT = await hre.ethers.getContractFactory("RealEstateNFT");
  const realEstateNFT = await RealEstateNFT.deploy(mintingFee);
  await realEstateNFT.waitForDeployment();

  const nftAddress = await realEstateNFT.getAddress();
  console.log("✅ RealEstateNFT deployed to:", nftAddress);

  // Deploy RealEstateMarketplace
  console.log("\n2. Deploying RealEstateMarketplace...");
  const RealEstateMarketplace = await hre.ethers.getContractFactory("RealEstateMarketplace");
  const marketplace = await RealEstateMarketplace.deploy();
  await marketplace.waitForDeployment();

  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ RealEstateMarketplace deployed to:", marketplaceAddress);

  // Setup: Add deployer as verified minter
  console.log("\n3. Setting up permissions...");
  const addMinterTx = await realEstateNFT.addVerifiedMinter(deployer.address);
  await addMinterTx.wait();
  console.log("✅ Added deployer as verified minter");

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Network:", hre.network.name);
  console.log("RealEstateNFT:", nftAddress);
  console.log("RealEstateMarketplace:", marketplaceAddress);
  console.log("Minting Fee:", hre.ethers.formatEther(mintingFee), "ETH");
  console.log("Platform Fee: 2.5%");
  console.log("=".repeat(60));

  // Verification instructions
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n📝 To verify contracts on explorer:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${nftAddress} ${mintingFee}`);
    console.log(`npx hardhat verify --network ${hre.network.name} ${marketplaceAddress}`);
  }

  return { realEstateNFT, marketplace, nftAddress, marketplaceAddress };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
