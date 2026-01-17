// Chainlink Contract Addresses - Mainnet
const CHAINLINK_ADDRESSES = {
  // CCIP Routers
  CCIP_ROUTER: {
    ethereum: "0x80226fc0Ee2b096224EeAc085Bb9a8cba1146f7D",
    polygon: "0x849c5ED5a80F5B408Dd4969b78c2C8fdf0565Bfe",
    arbitrum: "0x141fa059441E0ca23ce184B6A78bafD2A517DdE8",
    optimism: "0x3206695CaE29952f4b0c22a169725a865bc8Ce0f",
    avalanche: "0xF4c7E640EdA248ef95972845a62bdC74237805dB",
    bsc: "0x34B03Cb9086d7D758AC55af71584F81A598759FE",
    base: "0x881e3A65B4d4a04dD529061dd0071cf975F58bCD"
  },

  // Chain Selectors for CCIP
  CHAIN_SELECTORS: {
    ethereum: "5009297550715157269",
    polygon: "4051577828743386545",
    arbitrum: "4949039107694359620",
    optimism: "3734403246176062136",
    avalanche: "6433500567565415381",
    bsc: "11344663589394136015",
    base: "15971525489660198786"
  },

  // Price Feed Addresses (ETH/USD)
  PRICE_FEEDS: {
    ethereum: {
      "ETH/USD": "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
      "BTC/USD": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "LINK/USD": "0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c",
      "USDC/USD": "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
      "DAI/USD": "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9"
    },
    polygon: {
      "ETH/USD": "0xF9680D99D6C9589e2a93a78A04A279e509205945",
      "BTC/USD": "0xc907E116054Ad103354f2D350FD2514433D57F6f",
      "LINK/USD": "0xd9FFdb71EbE7496cC440152d43986Aae0AB76665",
      "MATIC/USD": "0xAB594600376Ec9fD91F8e885dADF0CE036862dE0"
    },
    arbitrum: {
      "ETH/USD": "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612",
      "BTC/USD": "0x6ce185860a4963106506C203335A2910220E6f5b",
      "LINK/USD": "0x86E53CF1B870786351Da77A57575e79CB55812CB"
    }
  },

  // VRF Coordinators
  VRF_COORDINATOR: {
    ethereum: "0x271682DEB8C4E0901D1a1550aD2e64D568E69909",
    polygon: "0xAE975071Be8F8eE67addBC1A82488F1C24858067",
    arbitrum: "0x41034678D6C633D8a95c75e1138A360a28bA15d1"
  },

  // Automation Registry
  AUTOMATION_REGISTRY: {
    ethereum: "0x6593c7De001fC8542bB1703532EE1E5aA0D458fD",
    polygon: "0x08a8eea76D2395807Ce7D1FC942382515469cCA1",
    arbitrum: "0x37D9dC70bfcd8BC77Ec2858836B923c560E891D1"
  },

  // LINK Token
  LINK_TOKEN: {
    ethereum: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    polygon: "0xb0897686c545045aFc77CF20eC7A532E3120E0F1",
    arbitrum: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4"
  }
};

// ABIs
const CCIP_ROUTER_ABI = [
  "function getFee(uint64 destinationChainSelector, (bytes,bytes,address,(address,uint256)[],bytes) message) view returns (uint256)",
  "function getSupportedTokens(uint64 chainSelector) view returns (address[])",
  "function isChainSupported(uint64 chainSelector) view returns (bool)"
];

const PRICE_FEED_ABI = [
  "function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
  "function decimals() view returns (uint8)",
  "function description() view returns (string)"
];

const VRF_COORDINATOR_ABI = [
  "function getSubscription(uint64 subId) view returns (uint96 balance, uint64 reqCount, address owner, address[] consumers)",
  "function createSubscription() returns (uint64 subId)",
  "function addConsumer(uint64 subId, address consumer)",
  "function removeConsumer(uint64 subId, address consumer)",
  "function cancelSubscription(uint64 subId, address to)"
];

const AUTOMATION_REGISTRY_ABI = [
  "function getUpkeep(uint256 id) view returns (address target, uint32 executeGas, bytes checkData, uint96 balance, address admin, uint64 maxValidBlocknumber, uint32 lastPerformBlockNumber, uint96 amountSpent, bool paused, bytes offchainConfig)",
  "function getState() view returns ((uint32,uint32,uint32,uint32,uint32,uint24,uint16,uint96,uint256,uint256,address,address[]) state, (uint32,uint32,uint32,uint24,uint16,uint96,uint32,uint32,uint32,uint256,uint256,address,address) config, address[] signers, address[] transmitters, uint8 f)"
];

const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)"
];

module.exports = {
  CHAINLINK_ADDRESSES,
  CCIP_ROUTER_ABI,
  PRICE_FEED_ABI,
  VRF_COORDINATOR_ABI,
  AUTOMATION_REGISTRY_ABI,
  ERC20_ABI
};
