import {
  shortenAddress,
  shortenTxHash,
  sqrtPriceX96ToPrice,
  priceToSqrtPriceX96,
  tickToPrice,
  priceToTick,
  calculateMinAmountOut,
  calculateMaxAmountIn,
  gweiToWei,
  weiToGwei,
  getDeadline,
  isValidAddress,
  isValidTxHash,
  calculatePercentage,
  sortTokens,
  generateId
} from '../src/utils/helpers';

describe('Helper Functions', () => {
  describe('Address formatting', () => {
    it('should shorten address correctly', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      expect(shortenAddress(address)).toBe('0x1234...5678');
      expect(shortenAddress(address, 6)).toBe('0x123456...345678');
    });

    it('should shorten tx hash correctly', () => {
      const hash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      expect(shortenTxHash(hash)).toBe('0x123456...abcdef');
    });
  });

  describe('Price calculations', () => {
    it('should convert sqrtPriceX96 to price', () => {
      // Test with known values
      const sqrtPriceX96 = BigInt('79228162514264337593543950336'); // 1:1 price
      const price = sqrtPriceX96ToPrice(sqrtPriceX96, 18, 18);
      expect(price).toBeCloseTo(1, 5);
    });

    it('should convert tick to price', () => {
      // Tick 0 should be price 1
      const price = tickToPrice(0, 18, 18);
      expect(price).toBeCloseTo(1, 10);
    });

    it('should convert price to tick', () => {
      const tick = priceToTick(1);
      expect(tick).toBe(0);
    });
  });

  describe('Slippage calculations', () => {
    it('should calculate min amount out correctly', () => {
      const amountOut = BigInt('1000000000000000000'); // 1 ETH
      const slippage = 5; // 5%
      const minAmountOut = calculateMinAmountOut(amountOut, slippage);
      // Should be 95% of original
      expect(minAmountOut).toBe(BigInt('950000000000000000'));
    });

    it('should calculate max amount in correctly', () => {
      const amountIn = BigInt('1000000000000000000'); // 1 ETH
      const slippage = 5; // 5%
      const maxAmountIn = calculateMaxAmountIn(amountIn, slippage);
      // Should be 105% of original
      expect(maxAmountIn).toBe(BigInt('1050000000000000000'));
    });
  });

  describe('Gas utilities', () => {
    it('should convert gwei to wei', () => {
      const wei = gweiToWei(50);
      expect(wei).toBe(BigInt('50000000000'));
    });

    it('should convert wei to gwei', () => {
      const gwei = weiToGwei(BigInt('50000000000'));
      expect(gwei).toBe(50);
    });
  });

  describe('Time utilities', () => {
    it('should generate deadline in the future', () => {
      const deadline = getDeadline(20);
      const now = Math.floor(Date.now() / 1000);
      expect(deadline).toBeGreaterThan(now);
      expect(deadline).toBeLessThanOrEqual(now + 20 * 60 + 1);
    });
  });

  describe('Validation', () => {
    it('should validate addresses', () => {
      expect(isValidAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(true);
      expect(isValidAddress('0x123')).toBe(false);
      expect(isValidAddress('invalid')).toBe(false);
    });

    it('should validate tx hashes', () => {
      expect(isValidTxHash('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')).toBe(true);
      expect(isValidTxHash('0x123')).toBe(false);
    });
  });

  describe('Percentage calculations', () => {
    it('should calculate percentage correctly', () => {
      const value = BigInt(25);
      const total = BigInt(100);
      expect(calculatePercentage(value, total)).toBe(25);
    });

    it('should handle zero total', () => {
      const value = BigInt(25);
      const total = BigInt(0);
      expect(calculatePercentage(value, total)).toBe(0);
    });
  });

  describe('Token sorting', () => {
    it('should sort tokens correctly', () => {
      const tokenA = '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';
      const tokenB = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
      const [token0, token1] = sortTokens(tokenA, tokenB);
      expect(token0.toLowerCase()).toBe(tokenB.toLowerCase());
      expect(token1.toLowerCase()).toBe(tokenA.toLowerCase());
    });
  });

  describe('ID generation', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(id1.length).toBeGreaterThan(0);
    });
  });
});
