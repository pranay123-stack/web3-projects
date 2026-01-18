const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("RealEstateMarketplace", function () {
  let realEstateNFT;
  let marketplace;
  let owner;
  let seller;
  let buyer;
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
    [owner, seller, buyer] = await ethers.getSigners();
    mintingFee = ethers.parseEther("0.01");

    // Deploy NFT contract
    const RealEstateNFT = await ethers.getContractFactory("RealEstateNFT");
    realEstateNFT = await RealEstateNFT.deploy(mintingFee);
    await realEstateNFT.waitForDeployment();

    // Deploy Marketplace
    const RealEstateMarketplace = await ethers.getContractFactory("RealEstateMarketplace");
    marketplace = await RealEstateMarketplace.deploy();
    await marketplace.waitForDeployment();

    // Mint a property for seller
    await realEstateNFT.connect(seller).mintProperty(
      seller.address,
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

    // Approve marketplace
    await realEstateNFT.connect(seller).setApprovalForAll(await marketplace.getAddress(), true);
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await marketplace.owner()).to.equal(owner.address);
    });

    it("Should set the correct platform fee", async function () {
      expect(await marketplace.platformFeeBps()).to.equal(250); // 2.5%
    });
  });

  describe("Listing", function () {
    const listingPrice = ethers.parseEther("1");

    it("Should list a property successfully", async function () {
      const nftAddress = await realEstateNFT.getAddress();
      const tx = await marketplace.connect(seller).listProperty(
        nftAddress,
        0,
        listingPrice,
        ethers.ZeroAddress // ETH payment
      );

      await expect(tx)
        .to.emit(marketplace, "Listed")
        .withArgs(0, seller.address, nftAddress, 0, listingPrice, ethers.ZeroAddress);

      const listing = await marketplace.getListing(0);
      expect(listing.seller).to.equal(seller.address);
      expect(listing.price).to.equal(listingPrice);
      expect(listing.isActive).to.equal(true);
    });

    it("Should revert if not NFT owner", async function () {
      const nftAddress = await realEstateNFT.getAddress();
      await expect(
        marketplace.connect(buyer).listProperty(nftAddress, 0, listingPrice, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(marketplace, "NotNFTOwner");
    });

    it("Should revert if price is zero", async function () {
      const nftAddress = await realEstateNFT.getAddress();
      await expect(
        marketplace.connect(seller).listProperty(nftAddress, 0, 0, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(marketplace, "InvalidPrice");
    });

    it("Should cancel listing successfully", async function () {
      const nftAddress = await realEstateNFT.getAddress();
      await marketplace.connect(seller).listProperty(nftAddress, 0, listingPrice, ethers.ZeroAddress);

      await expect(marketplace.connect(seller).cancelListing(0))
        .to.emit(marketplace, "ListingCancelled")
        .withArgs(0);

      const listing = await marketplace.getListing(0);
      expect(listing.isActive).to.equal(false);
    });

    it("Should update listing price", async function () {
      const nftAddress = await realEstateNFT.getAddress();
      await marketplace.connect(seller).listProperty(nftAddress, 0, listingPrice, ethers.ZeroAddress);

      const newPrice = ethers.parseEther("2");
      await expect(marketplace.connect(seller).updateListingPrice(0, newPrice))
        .to.emit(marketplace, "ListingUpdated")
        .withArgs(0, newPrice);

      const listing = await marketplace.getListing(0);
      expect(listing.price).to.equal(newPrice);
    });
  });

  describe("Buying", function () {
    const listingPrice = ethers.parseEther("1");

    beforeEach(async function () {
      const nftAddress = await realEstateNFT.getAddress();
      await marketplace.connect(seller).listProperty(nftAddress, 0, listingPrice, ethers.ZeroAddress);
    });

    it("Should buy a property successfully", async function () {
      const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);

      const tx = await marketplace.connect(buyer).buyProperty(0, { value: listingPrice });

      await expect(tx).to.emit(marketplace, "Sale");

      // Check NFT transferred
      expect(await realEstateNFT.ownerOf(0)).to.equal(buyer.address);

      // Check listing inactive
      const listing = await marketplace.getListing(0);
      expect(listing.isActive).to.equal(false);

      // Check seller received payment (minus platform fee)
      const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
      const expectedProceeds = listingPrice - (listingPrice * BigInt(250)) / BigInt(10000);
      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(expectedProceeds);
    });

    it("Should revert if insufficient payment", async function () {
      const insufficientAmount = ethers.parseEther("0.5");
      await expect(
        marketplace.connect(buyer).buyProperty(0, { value: insufficientAmount })
      ).to.be.revertedWithCustomError(marketplace, "InsufficientPayment");
    });

    it("Should refund excess payment", async function () {
      const excessAmount = ethers.parseEther("2");
      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

      const tx = await marketplace.connect(buyer).buyProperty(0, { value: excessAmount });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);
      const expectedSpent = listingPrice + gasUsed;

      expect(buyerBalanceBefore - buyerBalanceAfter).to.be.closeTo(expectedSpent, ethers.parseEther("0.001"));
    });
  });

  describe("Bidding", function () {
    const listingPrice = ethers.parseEther("1");
    const bidAmount = ethers.parseEther("0.8");
    const bidDuration = 7 * 24 * 60 * 60; // 7 days

    beforeEach(async function () {
      const nftAddress = await realEstateNFT.getAddress();
      await marketplace.connect(seller).listProperty(nftAddress, 0, listingPrice, ethers.ZeroAddress);
    });

    it("Should place a bid successfully", async function () {
      const tx = await marketplace.connect(buyer).placeBid(0, bidAmount, bidDuration, { value: bidAmount });

      await expect(tx).to.emit(marketplace, "BidPlaced");

      const bids = await marketplace.getListingBids(0);
      expect(bids.length).to.equal(1);
      expect(bids[0].bidder).to.equal(buyer.address);
      expect(bids[0].amount).to.equal(bidAmount);
      expect(bids[0].isActive).to.equal(true);
    });

    it("Should accept a bid successfully", async function () {
      await marketplace.connect(buyer).placeBid(0, bidAmount, bidDuration, { value: bidAmount });

      const tx = await marketplace.connect(seller).acceptBid(0, 0);

      await expect(tx)
        .to.emit(marketplace, "BidAccepted")
        .withArgs(0, buyer.address, bidAmount);

      // Check NFT transferred
      expect(await realEstateNFT.ownerOf(0)).to.equal(buyer.address);
    });

    it("Should cancel a bid and return escrow", async function () {
      await marketplace.connect(buyer).placeBid(0, bidAmount, bidDuration, { value: bidAmount });

      const buyerBalanceBefore = await ethers.provider.getBalance(buyer.address);

      const tx = await marketplace.connect(buyer).cancelBid(0, 0);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const buyerBalanceAfter = await ethers.provider.getBalance(buyer.address);

      expect(buyerBalanceAfter - buyerBalanceBefore + gasUsed).to.equal(bidAmount);
    });

    it("Should revert accepting expired bid", async function () {
      await marketplace.connect(buyer).placeBid(0, bidAmount, bidDuration, { value: bidAmount });

      // Fast forward time
      await time.increase(bidDuration + 1);

      await expect(
        marketplace.connect(seller).acceptBid(0, 0)
      ).to.be.revertedWithCustomError(marketplace, "BidExpired");
    });
  });

  describe("Offers", function () {
    const offerAmount = ethers.parseEther("0.5");
    const offerDuration = 7 * 24 * 60 * 60;

    it("Should make an offer on NFT", async function () {
      const nftAddress = await realEstateNFT.getAddress();

      const tx = await marketplace.connect(buyer).makeOffer(
        nftAddress,
        0,
        offerAmount,
        ethers.ZeroAddress,
        offerDuration,
        { value: offerAmount }
      );

      await expect(tx)
        .to.emit(marketplace, "OfferMade")
        .withArgs(nftAddress, 0, buyer.address, offerAmount, ethers.ZeroAddress);
    });

    it("Should accept an offer", async function () {
      const nftAddress = await realEstateNFT.getAddress();

      await marketplace.connect(buyer).makeOffer(
        nftAddress,
        0,
        offerAmount,
        ethers.ZeroAddress,
        offerDuration,
        { value: offerAmount }
      );

      const tx = await marketplace.connect(seller).acceptOffer(nftAddress, 0, 0);

      await expect(tx)
        .to.emit(marketplace, "OfferAccepted")
        .withArgs(nftAddress, 0, buyer.address, offerAmount);

      expect(await realEstateNFT.ownerOf(0)).to.equal(buyer.address);
    });
  });

  describe("Admin Functions", function () {
    it("Should update platform fee", async function () {
      const newFee = 500; // 5%
      await expect(marketplace.setPlatformFee(newFee))
        .to.emit(marketplace, "PlatformFeeUpdated")
        .withArgs(250, newFee);

      expect(await marketplace.platformFeeBps()).to.equal(newFee);
    });

    it("Should revert if fee too high", async function () {
      await expect(
        marketplace.setPlatformFee(1500) // 15%
      ).to.be.revertedWithCustomError(marketplace, "FeeTooHigh");
    });

    it("Should add supported payment token", async function () {
      const mockToken = buyer.address; // Using address as mock
      await expect(marketplace.setPaymentToken(mockToken, true))
        .to.emit(marketplace, "PaymentTokenUpdated")
        .withArgs(mockToken, true);

      expect(await marketplace.supportedTokens(mockToken)).to.equal(true);
    });
  });
});
