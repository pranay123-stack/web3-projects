const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("RWA Tokenization Platform", function () {
  let identityRegistry;
  let complianceModule;
  let realEstateToken;
  let propertyTokenFactory;
  let owner;
  let investor1;
  let investor2;
  let unverifiedUser;

  const INDIA_COUNTRY_CODE = 356;
  const USA_COUNTRY_CODE = 840;

  beforeEach(async function () {
    [owner, investor1, investor2, unverifiedUser] = await ethers.getSigners();

    // Deploy IdentityRegistry
    const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
    identityRegistry = await IdentityRegistry.deploy();
    await identityRegistry.waitForDeployment();

    // Deploy ComplianceModule
    const ComplianceModule = await ethers.getContractFactory("ComplianceModule");
    complianceModule = await ComplianceModule.deploy(
      await identityRegistry.getAddress(),
      500,  // maxInvestors
      ethers.parseEther("1"),  // minHoldingAmount
      ethers.parseEther("100000"),  // maxHoldingAmount
      0  // holdingPeriod
    );
    await complianceModule.waitForDeployment();

    // Deploy RealEstateToken
    const RealEstateToken = await ethers.getContractFactory("RealEstateToken");
    realEstateToken = await RealEstateToken.deploy(
      "Mumbai Office Tower",
      "MOT",
      await identityRegistry.getAddress(),
      await complianceModule.getAddress(),
      "PROP-001",
      "123 Business Park, Mumbai, India",
      "commercial",
      ethers.parseEther("1000000"),  // $1M total value
      10000,  // 100% tokenized
      "ipfs://QmLegalDocs"
    );
    await realEstateToken.waitForDeployment();

    // Register investors
    const hash1 = ethers.keccak256(ethers.toUtf8Bytes("KYC_" + investor1.address));
    const hash2 = ethers.keccak256(ethers.toUtf8Bytes("KYC_" + investor2.address));

    await identityRegistry.registerIdentity(investor1.address, hash1, INDIA_COUNTRY_CODE);
    await identityRegistry.registerIdentity(investor2.address, hash2, USA_COUNTRY_CODE);
  });

  describe("Identity Registry", function () {
    it("Should register investor identity", async function () {
      expect(await identityRegistry.isVerified(investor1.address)).to.equal(true);
      expect(await identityRegistry.getInvestorCountry(investor1.address)).to.equal(INDIA_COUNTRY_CODE);
    });

    it("Should reject unverified investor", async function () {
      expect(await identityRegistry.isVerified(unverifiedUser.address)).to.equal(false);
    });

    it("Should update investor country", async function () {
      await identityRegistry.updateCountry(investor1.address, USA_COUNTRY_CODE);
      expect(await identityRegistry.getInvestorCountry(investor1.address)).to.equal(USA_COUNTRY_CODE);
    });

    it("Should delete investor identity", async function () {
      await identityRegistry.deleteIdentity(investor1.address);
      expect(await identityRegistry.isVerified(investor1.address)).to.equal(false);
    });

    it("Should revert if identity already registered", async function () {
      const hash = ethers.keccak256(ethers.toUtf8Bytes("KYC_DUPLICATE"));
      await expect(
        identityRegistry.registerIdentity(investor1.address, hash, INDIA_COUNTRY_CODE)
      ).to.be.revertedWithCustomError(identityRegistry, "IdentityAlreadyRegistered");
    });
  });

  describe("Compliance Module", function () {
    beforeEach(async function () {
      // Mint some tokens to investor1 for testing
      await realEstateToken.mint(investor1.address, ethers.parseEther("100"));
    });

    it("Should allow compliant transfer", async function () {
      expect(
        await complianceModule.canTransfer(
          investor1.address,
          investor2.address,
          ethers.parseEther("50")
        )
      ).to.equal(true);
    });

    it("Should reject transfer to unverified address", async function () {
      expect(
        await complianceModule.canTransfer(
          investor1.address,
          unverifiedUser.address,
          ethers.parseEther("50")
        )
      ).to.equal(false);
    });

    it("Should enforce country restrictions", async function () {
      // Restrict USA
      await complianceModule.setCountryRestriction(USA_COUNTRY_CODE, true);

      expect(
        await complianceModule.canTransfer(
          investor1.address,
          investor2.address,
          ethers.parseEther("50")
        )
      ).to.equal(false);
    });

    it("Should enforce maximum investor limit", async function () {
      await complianceModule.setMaxInvestors(1);

      // First investor already has tokens, so max is reached
      expect(
        await complianceModule.canTransfer(
          investor1.address,
          investor2.address,
          ethers.parseEther("50")
        )
      ).to.equal(false);
    });

    it("Should enforce minimum holding amount", async function () {
      // Try to transfer amount that leaves sender below minimum
      expect(
        await complianceModule.canTransfer(
          investor1.address,
          investor2.address,
          ethers.parseEther("99.5")  // Leaves 0.5, below 1 minimum
        )
      ).to.equal(false);
    });

    it("Should enforce holding period", async function () {
      await complianceModule.setHoldingPeriod(86400); // 1 day

      // Immediately after receiving, cannot transfer
      expect(
        await complianceModule.canTransfer(
          investor1.address,
          investor2.address,
          ethers.parseEther("50")
        )
      ).to.equal(false);

      // After holding period
      await time.increase(86401);
      expect(
        await complianceModule.canTransfer(
          investor1.address,
          investor2.address,
          ethers.parseEther("50")
        )
      ).to.equal(true);
    });
  });

  describe("Real Estate Token", function () {
    it("Should mint tokens to verified investor", async function () {
      await realEstateToken.mint(investor1.address, ethers.parseEther("100"));
      expect(await realEstateToken.balanceOf(investor1.address)).to.equal(
        ethers.parseEther("100")
      );
    });

    it("Should reject minting to unverified address", async function () {
      await expect(
        realEstateToken.mint(unverifiedUser.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(realEstateToken, "TransferNotCompliant");
    });

    it("Should transfer between verified investors", async function () {
      await realEstateToken.mint(investor1.address, ethers.parseEther("100"));

      await realEstateToken.connect(investor1).transfer(
        investor2.address,
        ethers.parseEther("50")
      );

      expect(await realEstateToken.balanceOf(investor1.address)).to.equal(
        ethers.parseEther("50")
      );
      expect(await realEstateToken.balanceOf(investor2.address)).to.equal(
        ethers.parseEther("50")
      );
    });

    it("Should reject transfer to unverified address", async function () {
      await realEstateToken.mint(investor1.address, ethers.parseEther("100"));

      await expect(
        realEstateToken.connect(investor1).transfer(
          unverifiedUser.address,
          ethers.parseEther("50")
        )
      ).to.be.revertedWithCustomError(realEstateToken, "TransferNotCompliant");
    });

    it("Should freeze and unfreeze accounts", async function () {
      await realEstateToken.mint(investor1.address, ethers.parseEther("100"));

      // Freeze account
      await realEstateToken.setAccountFrozen(investor1.address, true);

      // Should reject transfer from frozen account
      await expect(
        realEstateToken.connect(investor1).transfer(
          investor2.address,
          ethers.parseEther("50")
        )
      ).to.be.revertedWithCustomError(realEstateToken, "AccountFrozenError");

      // Unfreeze
      await realEstateToken.setAccountFrozen(investor1.address, false);

      // Should work now
      await realEstateToken.connect(investor1).transfer(
        investor2.address,
        ethers.parseEther("50")
      );
    });

    it("Should return correct property info", async function () {
      const info = await realEstateToken.getPropertyInfo();
      expect(info.propertyId).to.equal("PROP-001");
      expect(info.propertyAddress).to.equal("123 Business Park, Mumbai, India");
      expect(info.propertyType).to.equal("commercial");
      expect(info.totalValue).to.equal(ethers.parseEther("1000000"));
    });
  });

  describe("Dividend Distribution", function () {
    beforeEach(async function () {
      // Mint tokens to investors
      await realEstateToken.mint(investor1.address, ethers.parseEther("100"));
      await realEstateToken.mint(investor2.address, ethers.parseEther("100"));
    });

    it("Should deposit dividends", async function () {
      const dividendAmount = ethers.parseEther("10");

      await realEstateToken.depositDividends({ value: dividendAmount });

      expect(await realEstateToken.totalDividendsDistributed()).to.equal(dividendAmount);
    });

    it("Should calculate pending dividends correctly", async function () {
      const dividendAmount = ethers.parseEther("10");
      await realEstateToken.depositDividends({ value: dividendAmount });

      // Each investor has 50% of supply, so should get 5 ETH each
      const pending1 = await realEstateToken.pendingDividends(investor1.address);
      const pending2 = await realEstateToken.pendingDividends(investor2.address);

      expect(pending1).to.equal(ethers.parseEther("5"));
      expect(pending2).to.equal(ethers.parseEther("5"));
    });

    it("Should claim dividends", async function () {
      const dividendAmount = ethers.parseEther("10");
      await realEstateToken.depositDividends({ value: dividendAmount });

      const balanceBefore = await ethers.provider.getBalance(investor1.address);

      const tx = await realEstateToken.connect(investor1).claimDividends();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(investor1.address);

      expect(balanceAfter - balanceBefore + gasUsed).to.be.closeTo(
        ethers.parseEther("5"),
        ethers.parseEther("0.001")
      );
    });

    it("Should handle dividends correctly after transfer", async function () {
      // Deposit initial dividends
      await realEstateToken.depositDividends({ value: ethers.parseEther("10") });

      // Transfer tokens
      await realEstateToken.connect(investor1).transfer(
        investor2.address,
        ethers.parseEther("50")
      );

      // investor1 should still have their credited dividends
      const pending1 = await realEstateToken.pendingDividends(investor1.address);
      expect(pending1).to.be.gt(0);
    });
  });

  describe("Property Token Factory", function () {
    beforeEach(async function () {
      const PropertyTokenFactory = await ethers.getContractFactory("PropertyTokenFactory");
      propertyTokenFactory = await PropertyTokenFactory.deploy(ethers.parseEther("0.01"));
      await propertyTokenFactory.waitForDeployment();

      // Register owner as verified investor
      const factoryRegistry = await propertyTokenFactory.identityRegistry();
      const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
      const registry = IdentityRegistry.attach(factoryRegistry);

      const hash = ethers.keccak256(ethers.toUtf8Bytes("KYC_OWNER"));
      await propertyTokenFactory.registerInvestor(owner.address, hash, INDIA_COUNTRY_CODE);
    });

    it("Should create new property token", async function () {
      const propertyParams = {
        name: "Test Property",
        symbol: "TPROP",
        propertyId: "TEST-001",
        propertyAddress: "Test Address",
        propertyType: "residential",
        totalValue: ethers.parseEther("500000"),
        tokenizedPercentage: 10000,
        legalDocumentURI: "ipfs://test",
        totalSupply: 0
      };

      const complianceParams = {
        maxInvestors: 100,
        minHoldingAmount: ethers.parseEther("1"),
        maxHoldingAmount: 0,
        holdingPeriod: 0,
        restrictedCountries: []
      };

      const tx = await propertyTokenFactory.createPropertyToken(
        propertyParams,
        complianceParams,
        { value: ethers.parseEther("0.01") }
      );

      await expect(tx).to.emit(propertyTokenFactory, "PropertyTokenCreated");

      expect(await propertyTokenFactory.totalProperties()).to.equal(1);
    });

    it("Should reject duplicate property ID", async function () {
      const propertyParams = {
        name: "Test Property",
        symbol: "TPROP",
        propertyId: "TEST-001",
        propertyAddress: "Test Address",
        propertyType: "residential",
        totalValue: ethers.parseEther("500000"),
        tokenizedPercentage: 10000,
        legalDocumentURI: "ipfs://test",
        totalSupply: 0
      };

      const complianceParams = {
        maxInvestors: 100,
        minHoldingAmount: ethers.parseEther("1"),
        maxHoldingAmount: 0,
        holdingPeriod: 0,
        restrictedCountries: []
      };

      await propertyTokenFactory.createPropertyToken(
        propertyParams,
        complianceParams,
        { value: ethers.parseEther("0.01") }
      );

      await expect(
        propertyTokenFactory.createPropertyToken(
          propertyParams,
          complianceParams,
          { value: ethers.parseEther("0.01") }
        )
      ).to.be.revertedWithCustomError(propertyTokenFactory, "PropertyIdAlreadyExists");
    });

    it("Should reject insufficient deployment fee", async function () {
      const propertyParams = {
        name: "Test Property",
        symbol: "TPROP",
        propertyId: "TEST-001",
        propertyAddress: "Test Address",
        propertyType: "residential",
        totalValue: ethers.parseEther("500000"),
        totalSupply: 0,
        tokenizedPercentage: 10000,
        legalDocumentURI: "ipfs://test"
      };

      const complianceParams = {
        maxInvestors: 100,
        minHoldingAmount: ethers.parseEther("1"),
        maxHoldingAmount: 0,
        holdingPeriod: 0,
        restrictedCountries: []
      };

      await expect(
        propertyTokenFactory.createPropertyToken(
          propertyParams,
          complianceParams,
          { value: ethers.parseEther("0.001") }  // Insufficient
        )
      ).to.be.revertedWithCustomError(propertyTokenFactory, "InsufficientDeploymentFee");
    });
  });
});
