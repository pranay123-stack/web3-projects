// ============================================
// UNISWAP V3 ABIs
// ============================================

export const UNISWAP_V3_FACTORY_ABI = [
  'event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)',
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)',
  'function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)',
  'function owner() external view returns (address)',
  'function feeAmountTickSpacing(uint24 fee) external view returns (int24)'
];

export const UNISWAP_V3_POOL_ABI = [
  'event Initialize(uint160 sqrtPriceX96, int24 tick)',
  'event Mint(address sender, address indexed owner, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount, uint256 amount0, uint256 amount1)',
  'event Burn(address indexed owner, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount, uint256 amount0, uint256 amount1)',
  'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function fee() external view returns (uint24)',
  'function tickSpacing() external view returns (int24)',
  'function liquidity() external view returns (uint128)',
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function ticks(int24 tick) external view returns (uint128 liquidityGross, int128 liquidityNet, uint256 feeGrowthOutside0X128, uint256 feeGrowthOutside1X128, int56 tickCumulativeOutside, uint160 secondsPerLiquidityOutsideX128, uint32 secondsOutside, bool initialized)',
  'function initialize(uint160 sqrtPriceX96) external'
];

export const UNISWAP_V3_ROUTER_ABI = [
  'function exactInputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) external payable returns (uint256 amountOut)',
  'function exactInput(tuple(bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum) params) external payable returns (uint256 amountOut)',
  'function exactOutputSingle(tuple(address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96) params) external payable returns (uint256 amountIn)',
  'function exactOutput(tuple(bytes path, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum) params) external payable returns (uint256 amountIn)',
  'function multicall(uint256 deadline, bytes[] calldata data) external payable returns (bytes[] memory results)',
  'function multicall(bytes[] calldata data) external payable returns (bytes[] memory results)',
  'function unwrapWETH9(uint256 amountMinimum, address recipient) external payable',
  'function refundETH() external payable'
];

export const UNISWAP_V3_QUOTER_ABI = [
  'function quoteExactInputSingle(tuple(address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96) params) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
  'function quoteExactInput(bytes path, uint256 amountIn) external returns (uint256 amountOut, uint160[] sqrtPriceX96AfterList, uint32[] initializedTicksCrossedList, uint256 gasEstimate)',
  'function quoteExactOutputSingle(tuple(address tokenIn, address tokenOut, uint256 amount, uint24 fee, uint160 sqrtPriceLimitX96) params) external returns (uint256 amountIn, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
  'function quoteExactOutput(bytes path, uint256 amountOut) external returns (uint256 amountIn, uint160[] sqrtPriceX96AfterList, uint32[] initializedTicksCrossedList, uint256 gasEstimate)'
];

// ============================================
// UNISWAP V4 ABIs
// ============================================

export const UNISWAP_V4_POOL_MANAGER_ABI = [
  'event Initialize(bytes32 indexed id, address indexed currency0, address indexed currency1, uint24 fee, int24 tickSpacing, address hooks, uint160 sqrtPriceX96, int24 tick)',
  'event ModifyLiquidity(bytes32 indexed id, address indexed sender, int24 tickLower, int24 tickUpper, int256 liquidityDelta, bytes32 salt)',
  'event Swap(bytes32 indexed id, address indexed sender, int128 amount0, int128 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick, uint24 fee)',
  'event Donate(bytes32 indexed id, address indexed sender, uint256 amount0, uint256 amount1)',
  'function initialize(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, uint160 sqrtPriceX96) external returns (int24 tick)',
  'function swap(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, tuple(bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96) params, bytes hookData) external returns (int128 delta0, int128 delta1)',
  'function modifyLiquidity(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, tuple(int24 tickLower, int24 tickUpper, int256 liquidityDelta, bytes32 salt) params, bytes hookData) external returns (int128 delta0, int128 delta1)',
  'function donate(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, uint256 amount0, uint256 amount1, bytes hookData) external returns (int128 delta0, int128 delta1)',
  'function take(address currency, address to, uint256 amount) external',
  'function settle() external payable returns (uint256)',
  'function settleFor(address recipient) external payable returns (uint256)',
  'function sync(address currency) external',
  'function unlock(bytes calldata data) external returns (bytes memory)',
  'function getSlot0(bytes32 id) external view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)',
  'function getLiquidity(bytes32 id) external view returns (uint128)',
  'function getPosition(bytes32 id, address owner, int24 tickLower, int24 tickUpper, bytes32 salt) external view returns (uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128)'
];

export const UNISWAP_V4_POSITION_MANAGER_ABI = [
  'function mint(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) poolKey, int24 tickLower, int24 tickUpper, uint256 liquidity, uint256 amount0Max, uint256 amount1Max, address owner, bytes hookData) external payable returns (uint256 tokenId, uint128 liquidityActual, uint256 amount0, uint256 amount1)',
  'function increaseLiquidity(uint256 tokenId, uint256 liquidity, uint256 amount0Max, uint256 amount1Max, bytes hookData) external payable returns (uint128 liquidityActual, uint256 amount0, uint256 amount1)',
  'function decreaseLiquidity(uint256 tokenId, uint256 liquidity, uint256 amount0Min, uint256 amount1Min, bytes hookData) external returns (uint256 amount0, uint256 amount1)',
  'function collect(uint256 tokenId, address recipient, uint128 amount0Max, uint128 amount1Max) external returns (uint256 amount0, uint256 amount1)',
  'function burn(uint256 tokenId) external'
];

export const UNISWAP_V4_QUOTER_ABI = [
  'function quoteExactInputSingle(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) poolKey, bool zeroForOne, uint256 exactAmount, bytes hookData) external returns (int128[] deltaAmounts, uint160 sqrtPriceX96After, uint32 initializedTicksLoaded)',
  'function quoteExactInput(tuple(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) poolKey, bool zeroForOne, uint256 exactAmount)[] params, bytes hookData) external returns (int128[] deltaAmounts, uint160[] sqrtPriceX96AfterList, uint32[] initializedTicksLoadedList)',
  'function quoteExactOutputSingle(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) poolKey, bool zeroForOne, uint256 exactAmount, bytes hookData) external returns (int128[] deltaAmounts, uint160 sqrtPriceX96After, uint32 initializedTicksLoaded)',
  'function quoteExactOutput(tuple(tuple(address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) poolKey, bool zeroForOne, uint256 exactAmount)[] params, bytes hookData) external returns (int128[] deltaAmounts, uint160[] sqrtPriceX96AfterList, uint32[] initializedTicksLoadedList)'
];

export const UNISWAP_V4_STATE_VIEW_ABI = [
  'function getSlot0(bytes32 poolId) external view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)',
  'function getLiquidity(bytes32 poolId) external view returns (uint128)',
  'function getTickInfo(bytes32 poolId, int24 tick) external view returns (uint128 liquidityGross, int128 liquidityNet, uint256 feeGrowthOutside0X128, uint256 feeGrowthOutside1X128)',
  'function getTickLiquidity(bytes32 poolId, int24 tick) external view returns (uint128 liquidityGross, int128 liquidityNet)',
  'function getFeeGrowthGlobals(bytes32 poolId) external view returns (uint256 feeGrowthGlobal0, uint256 feeGrowthGlobal1)',
  'function getPoolBitmapInfo(bytes32 poolId, int16 word) external view returns (uint256)'
];

// ============================================
// ERC20 ABI
// ============================================

export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function transfer(address to, uint256 value) returns (bool)',
  'function transferFrom(address from, address to, uint256 value) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
];

// ============================================
// WETH ABI
// ============================================

export const WETH_ABI = [
  ...ERC20_ABI,
  'function deposit() payable',
  'function withdraw(uint256 wad)'
];

// ============================================
// FUNCTION SELECTORS
// ============================================

export const FUNCTION_SELECTORS = {
  // V3 Router
  exactInputSingle: '0x414bf389',
  exactInput: '0xc04b8d59',
  exactOutputSingle: '0xdb3e2198',
  exactOutput: '0xf28c0498',
  multicall: '0xac9650d8',
  multicallWithDeadline: '0x5ae401dc',

  // V4 Pool Manager
  swap: '0x9d9b0e14',
  modifyLiquidity: '0x9c0e1c92',
  initialize: '0x8f86e3c4',
  unlock: '0x48c89491',

  // ERC20
  approve: '0x095ea7b3',
  transfer: '0xa9059cbb',
  transferFrom: '0x23b872dd'
};

// ============================================
// EVENT TOPICS
// ============================================

export const EVENT_TOPICS = {
  // V3 Events
  V3_POOL_CREATED: '0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118',
  V3_SWAP: '0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67',
  V3_MINT: '0x7a53080ba414158be7ec69b987b5fb7d07dee101fe85488f0853ae16239d0bde',
  V3_BURN: '0x0c396cd989a39f4459b5fa1aed6a9a8dcdbc45908acfd67e028cd568da98982c',
  V3_INITIALIZE: '0x98636036cb66a9c19a37435efc1e90142190214e8abeb821bdba3f2990dd4c95',

  // V4 Events
  V4_INITIALIZE: '0xdd466e674ea557f56295e2d0218a125ea4b4f0f6f3307b95f85e6110838d6438',
  V4_SWAP: '0x40e9cecb9f5f1f1c5b9c97dec2917b7ee92e57ba5563708daca94dd84ad7112f',
  V4_MODIFY_LIQUIDITY: '0x3067048beee31b25b2f1681f88dac838c8bba36af25bfb2b7cf7473a5847e35f'
};
