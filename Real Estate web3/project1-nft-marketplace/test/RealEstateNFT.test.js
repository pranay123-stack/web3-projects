const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RealEstateNFT", function () {
  let realEstateNFT;
  let owner;
  let user1;
  let user2;
  let mintingFee;

  const propertyData = {
    uri: "ipfs://QmTest123/metadata.json",
    propertyAddress: "123 Main Street, Mumbai, India",
    propertyType: "apartment",
    squareFeet: 1500,
    bedrooms: 3,
    bathrooms: 2,
    yearBuilt: 2020,
    legalDocumentHash: "QmLegalDoc123"
  };

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    mintingFee = ethers.parseEther("0.01");

    const RealEstateNFT = await ethers.getContractFactory("RealEstateNFT");
    realEstateNFT = await RealEstateNFT.deploy(mintingFee);
    await realEstateNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await realEstateNFT.name()).to.equal("RealEstateNFT");
      expect(await realEstateNFT.symbol()).to.equal("RENFT");
    });

    it("Should set the correct owner", async function () {
      expect(await realEstateNFT.owner()).to.equal(owner.address);
    });

    it("Should set the correct minting fee", async function () {
      expect(await realEstateNFT.mintingFee()).to.equal(mintingFee);
    });
  });

  describe("Minting", function () {
    it("Should mint a property NFT successfully", async function () {
      const tx = await realEstateNFT.mintProperty(
        user1.address,
        propertyData.uri,
        propertyData.propertyAddress,
        propertyData.propertyType,
        propertyData.squareFeet,
        propertyData.bedrooms,
        propertyData.bathrooms,
        propertyData.yearBuilt,
        propertyData.legalDocumentHash,
        { value: mintingFee }
      );

      await expect(tx)
        .to.emit(realEstateNFT, "PropertyMinted")
        .withArgs(0, user1.address, propertyData.propertyAddress, propertyData.propertyType, propertyData.squareFeet);

      expect(await realEstateNFT.ownerOf(0)).to.equal(user1.address);
      expect(await realEstateNFT.tokenURI(0)).to.equal(propertyData.uri);
    });

    it("Should store property details correctly", async function () {
      await realEstateNFT.mintProperty(
        user1.address,
        propertyData.uri,
        propertyData.propertyAddress,
        propertyData.propertyType,
        propertyData.squareFeet,
        propertyData.bedrooms,
        propertyData.bathrooms,
        propertyData.yearBuilt,
        propertyData.legalDocumentHash,
        { value: mintingFee }
      );

      const property = await realEstateNFT.getProperty(0);
      expect(property.propertyAddress).to.equal(propertyData.propertyAddress);
      expect(property.propertyType).to.equal(propertyData.propertyType);
      expect(property.squareFeet).to.equal(propertyData.squareFeet);
      expect(property.bedrooms).to.equal(propertyData.bedrooms);
      expect(property.bathrooms).to.equal(propertyData.bathrooms);
      expect(property.yearBuilt).to.equal(propertyData.yearBuilt);
      expect(property.isVerified).to.equal(false);
      expect(property.originalOwner).to.equal(user1.address);
    });

    it("Should revert if minting fee is insufficient", async function () {
      const insufficientFee = ethers.parseEther("0.005");

      await expect(
        realEstateNFT.mintProperty(
          user1.address,
          propertyData.uri,
          propertyData.propertyAddress,
          propertyData.propertyType,
          propertyData.squareFeet,
          propertyData.bedrooms,
          propertyData.bathrooms,
          propertyData.yearBuilt,
          propertyData.legalDocumentHash,
          { value: insufficientFee }
        )
      ).to.be.revertedWithCustomError(realEstateNFT, "InsufficientMintingFee");
    });

    it("Should revert if property address is empty", async function () {
      await expect(
        realEstateNFT.mintProperty(
          user1.address,
          propertyData.uri,
          "",
          propertyData.propertyType,
          propertyData.squareFeet,
          propertyData.bedrooms,
          propertyData.bathrooms,
          propertyData.yearBuilt,
          propertyData.legalDocumentHash,
          { value: mintingFee }
        )
      ).to.be.revertedWithCustomError(realEstateNFT, "InvalidPropertyAddress");
    });

    it("Should revert if square feet is zero", async function () {
      await expect(
        realEstateNFT.mintProperty(
          user1.address,
          propertyData.uri,
          propertyData.propertyAddress,
          propertyData.propertyType,
          0,
          propertyData.bedrooms,
          propertyData.bathrooms,
          propertyData.yearBuilt,
          propertyData.legalDocumentHash,
          { value: mintingFee }
        )
      ).to.be.revertedWithCustomError(realEstateNFT, "InvalidSquareFeet");
    });
  });

  describe("Verification", function () {
    beforeEach(async function () {
      await realEstateNFT.mintProperty(
        user1.address,
        propertyData.uri,
        propertyData.propertyAddress,
        propertyData.propertyType,
        propertyData.squareFeet,
        propertyData.bedrooms,
        propertyData.bathrooms,
        propertyData.yearBuilt,
        propertyData.legalDocumentHash,
        { value: mintingFee }
      );
    });

    it("Should allow owner to verify property", async function () {
      await expect(realEstateNFT.verifyProperty(0))
        .to.emit(realEstateNFT, "PropertyVerified")
        .withArgs(0, owner.address);

      const property = await realEstateNFT.getProperty(0);
      expect(property.isVerified).to.equal(true);
    });

    it("Should allow verified minter to verify property", async function () {
      await realEstateNFT.addVerifiedMinter(user2.address);
      await expect(realEstateNFT.connect(user2).verifyProperty(0))
        .to.emit(realEstateNFT, "PropertyVerified")
        .withArgs(0, user2.address);
    });

    it("Should revert if non-verified minter tries to verify", async function () {
      await expect(
        realEstateNFT.connect(user1).verifyProperty(0)
      ).to.be.revertedWithCustomError(realEstateNFT, "NotVerifiedMinter");
    });

    it("Should revert if property is already verified", async function () {
      await realEstateNFT.verifyProperty(0);
      await expect(
        realEstateNFT.verifyProperty(0)
      ).to.be.revertedWithCustomError(realEstateNFT, "PropertyAlreadyVerified");
    });
  });

  describe("Minter Management", function () {
    it("Should add verified minter", async function () {
      await expect(realEstateNFT.addVerifiedMinter(user1.address))
        .to.emit(realEstateNFT, "MinterVerified")
        .withArgs(user1.address);

      expect(await realEstateNFT.verifiedMinters(user1.address)).to.equal(true);
    });

    it("Should remove verified minter", async function () {
      await realEstateNFT.addVerifiedMinter(user1.address);
      await expect(realEstateNFT.removeVerifiedMinter(user1.address))
        .to.emit(realEstateNFT, "MinterRevoked")
        .withArgs(user1.address);

      expect(await realEstateNFT.verifiedMinters(user1.address)).to.equal(false);
    });
  });

  describe("Admin Functions", function () {
    it("Should update minting fee", async function () {
      const newFee = ethers.parseEther("0.02");
      await expect(realEstateNFT.setMintingFee(newFee))
        .to.emit(realEstateNFT, "MintingFeeUpdated")
        .withArgs(mintingFee, newFee);

      expect(await realEstateNFT.mintingFee()).to.equal(newFee);
    });

    it("Should withdraw contract balance", async function () {
      // Mint a property to add funds to contract
      await realEstateNFT.mintProperty(
        user1.address,
        propertyData.uri,
        propertyData.propertyAddress,
        propertyData.propertyType,
        propertyData.squareFeet,
        propertyData.bedrooms,
        propertyData.bathrooms,
        propertyData.yearBuilt,
        propertyData.legalDocumentHash,
        { value: mintingFee }
      );

      const balanceBefore = await ethers.provider.getBalance(owner.address);
      await realEstateNFT.withdraw();
      const balanceAfter = await ethers.provider.getBalance(owner.address);

      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });

  describe("View Functions", function () {
    it("Should return tokens by owner", async function () {
      // Mint two properties for user1
      await realEstateNFT.mintProperty(
        user1.address,
        propertyData.uri,
        propertyData.propertyAddress,
        propertyData.propertyType,
        propertyData.squareFeet,
        propertyData.bedrooms,
        propertyData.bathrooms,
        propertyData.yearBuilt,
        propertyData.legalDocumentHash,
        { value: mintingFee }
      );

      await realEstateNFT.mintProperty(
        user1.address,
        "ipfs://QmTest456",
        "456 Second Street",
        "house",
        2000,
        4,
        3,
        2018,
        "QmLegalDoc456",
        { value: mintingFee }
      );

      const tokens = await realEstateNFT.getTokensByOwner(user1.address);
      expect(tokens.length).to.equal(2);
      expect(tokens[0]).to.equal(0);
      expect(tokens[1]).to.equal(1);
    });

    it("Should return total properties count", async function () {
      await realEstateNFT.mintProperty(
        user1.address,
        propertyData.uri,
        propertyData.propertyAddress,
        propertyData.propertyType,
        propertyData.squareFeet,
        propertyData.bedrooms,
        propertyData.bathrooms,
        propertyData.yearBuilt,
        propertyData.legalDocumentHash,
        { value: mintingFee }
      );

      expect(await realEstateNFT.totalProperties()).to.equal(1);
    });
  });
});
