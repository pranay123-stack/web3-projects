import { ScamClassifier } from './classifier';
import { FeatureVector } from '../types';

describe('ScamClassifier', () => {
  let classifier: ScamClassifier;

  beforeEach(() => {
    classifier = new ScamClassifier();
  });

  describe('predict', () => {
    it('should classify high-risk tokens as scams', () => {
      const riskyFeatures: FeatureVector = {
        holderConcentration: 0.9, // Very concentrated
        deployerAge: 0.01, // Very new
        liquidityRatio: 0.1, // Low liquidity
        mintAuthorityActive: 1, // Mint active
        freezeAuthorityActive: 1, // Freeze active
        transferCount: 0.05,
        uniqueHolders: 0.01,
        namePatternScore: 1, // Suspicious name
        symbolPatternScore: 1,
        metadataQuality: 0, // No metadata
      };

      const prediction = classifier.predict(riskyFeatures);
      expect(prediction.probability).toBeGreaterThan(0.5);
    });

    it('should classify low-risk tokens as safe', () => {
      const safeFeatures: FeatureVector = {
        holderConcentration: 0.2, // Well distributed
        deployerAge: 0.9, // Old deployer
        liquidityRatio: 0.8, // Good liquidity
        mintAuthorityActive: 0, // Revoked
        freezeAuthorityActive: 0, // Revoked
        transferCount: 0.7,
        uniqueHolders: 0.5,
        namePatternScore: 0, // Normal name
        symbolPatternScore: 0,
        metadataQuality: 1, // Has metadata
      };

      const prediction = classifier.predict(safeFeatures);
      expect(prediction.probability).toBeLessThan(0.5);
    });
  });

  describe('predictBatch', () => {
    it('should predict multiple tokens', () => {
      const featuresList: FeatureVector[] = [
        {
          holderConcentration: 0.9,
          deployerAge: 0.01,
          liquidityRatio: 0.1,
          mintAuthorityActive: 1,
          freezeAuthorityActive: 1,
          transferCount: 0.05,
          uniqueHolders: 0.01,
          namePatternScore: 1,
          symbolPatternScore: 1,
          metadataQuality: 0,
        },
        {
          holderConcentration: 0.2,
          deployerAge: 0.9,
          liquidityRatio: 0.8,
          mintAuthorityActive: 0,
          freezeAuthorityActive: 0,
          transferCount: 0.7,
          uniqueHolders: 0.5,
          namePatternScore: 0,
          symbolPatternScore: 0,
          metadataQuality: 1,
        },
      ];

      const predictions = classifier.predictBatch(featuresList);
      expect(predictions).toHaveLength(2);
      expect(predictions[0].probability).toBeGreaterThan(predictions[1].probability);
    });
  });

  describe('getFeatureImportance', () => {
    it('should return feature importance ranking', () => {
      const importance = classifier.getFeatureImportance();

      expect(importance.length).toBeGreaterThan(0);
      expect(importance[0]).toHaveProperty('feature');
      expect(importance[0]).toHaveProperty('importance');

      // Should be sorted by importance
      for (let i = 1; i < importance.length; i++) {
        expect(importance[i - 1].importance).toBeGreaterThanOrEqual(importance[i].importance);
      }
    });
  });

  describe('exportModel and importModel', () => {
    it('should export and import model correctly', () => {
      const exported = classifier.exportModel();

      expect(exported).toHaveProperty('weights');
      expect(exported).toHaveProperty('threshold');
      expect(exported).toHaveProperty('means');
      expect(exported).toHaveProperty('stds');

      // Create new classifier and import
      const newClassifier = new ScamClassifier();
      newClassifier.importModel(exported);

      // Both should produce same predictions
      const testFeatures: FeatureVector = {
        holderConcentration: 0.5,
        deployerAge: 0.5,
        liquidityRatio: 0.5,
        mintAuthorityActive: 0.5,
        freezeAuthorityActive: 0.5,
        transferCount: 0.5,
        uniqueHolders: 0.5,
        namePatternScore: 0.5,
        symbolPatternScore: 0.5,
        metadataQuality: 0.5,
      };

      const pred1 = classifier.predict(testFeatures);
      const pred2 = newClassifier.predict(testFeatures);

      expect(pred1.probability).toBeCloseTo(pred2.probability, 5);
    });
  });

  describe('evaluate', () => {
    it('should calculate evaluation metrics', () => {
      const testData = [
        {
          features: {
            holderConcentration: 0.9,
            deployerAge: 0.01,
            liquidityRatio: 0.1,
            mintAuthorityActive: 1,
            freezeAuthorityActive: 1,
            transferCount: 0.05,
            uniqueHolders: 0.01,
            namePatternScore: 1,
            symbolPatternScore: 1,
            metadataQuality: 0,
          } as FeatureVector,
          label: true, // Actually a scam
        },
        {
          features: {
            holderConcentration: 0.2,
            deployerAge: 0.9,
            liquidityRatio: 0.8,
            mintAuthorityActive: 0,
            freezeAuthorityActive: 0,
            transferCount: 0.7,
            uniqueHolders: 0.5,
            namePatternScore: 0,
            symbolPatternScore: 0,
            metadataQuality: 1,
          } as FeatureVector,
          label: false, // Not a scam
        },
      ];

      const metrics = classifier.evaluate(testData);

      expect(metrics).toHaveProperty('accuracy');
      expect(metrics).toHaveProperty('precision');
      expect(metrics).toHaveProperty('recall');
      expect(metrics).toHaveProperty('f1Score');

      expect(metrics.accuracy).toBeGreaterThanOrEqual(0);
      expect(metrics.accuracy).toBeLessThanOrEqual(1);
    });
  });
});
