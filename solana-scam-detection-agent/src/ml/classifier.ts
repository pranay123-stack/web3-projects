import { FeatureVector, ModelPrediction } from '../types';
import logger from '../utils/logger';

/**
 * Simple ML classifier for scam detection
 * Uses a weighted heuristic model (can be replaced with actual ML model)
 */
export class ScamClassifier {
  // Feature weights learned from historical data
  private weights: Record<keyof FeatureVector, number> = {
    holderConcentration: 0.25,
    deployerAge: -0.15, // Negative = older is safer
    liquidityRatio: -0.10,
    mintAuthorityActive: 0.20,
    freezeAuthorityActive: 0.15,
    transferCount: -0.05,
    uniqueHolders: -0.05,
    namePatternScore: 0.10,
    symbolPatternScore: 0.05,
    metadataQuality: -0.05,
  };

  // Threshold for classification
  private threshold: number = 0.5;

  // Training data statistics for normalization
  private featureMeans: Record<keyof FeatureVector, number> = {
    holderConcentration: 0.5,
    deployerAge: 0.25,
    liquidityRatio: 0.5,
    mintAuthorityActive: 0.5,
    freezeAuthorityActive: 0.5,
    transferCount: 0.3,
    uniqueHolders: 0.2,
    namePatternScore: 0.3,
    symbolPatternScore: 0.2,
    metadataQuality: 0.7,
  };

  private featureStds: Record<keyof FeatureVector, number> = {
    holderConcentration: 0.3,
    deployerAge: 0.2,
    liquidityRatio: 0.3,
    mintAuthorityActive: 0.5,
    freezeAuthorityActive: 0.5,
    transferCount: 0.2,
    uniqueHolders: 0.15,
    namePatternScore: 0.4,
    symbolPatternScore: 0.35,
    metadataQuality: 0.3,
  };

  constructor() {
    logger.info('ScamClassifier initialized');
  }

  /**
   * Predict if token is a scam
   */
  predict(features: FeatureVector): ModelPrediction {
    // Normalize features
    const normalized = this.normalizeFeatures(features);

    // Calculate weighted sum
    let score = 0;
    for (const [feature, value] of Object.entries(normalized)) {
      const weight = this.weights[feature as keyof FeatureVector];
      score += value * weight;
    }

    // Apply sigmoid for probability
    const probability = this.sigmoid(score);

    return {
      isScam: probability >= this.threshold,
      probability,
      features,
    };
  }

  /**
   * Batch prediction
   */
  predictBatch(featuresList: FeatureVector[]): ModelPrediction[] {
    return featuresList.map((features) => this.predict(features));
  }

  /**
   * Normalize features using z-score normalization
   */
  private normalizeFeatures(features: FeatureVector): FeatureVector {
    const normalized: Partial<FeatureVector> = {};

    for (const [key, value] of Object.entries(features)) {
      const featureKey = key as keyof FeatureVector;
      const mean = this.featureMeans[featureKey];
      const std = this.featureStds[featureKey];

      normalized[featureKey] = std > 0 ? (value - mean) / std : value;
    }

    return normalized as FeatureVector;
  }

  /**
   * Sigmoid activation function
   */
  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  /**
   * Update model weights (simple online learning)
   */
  updateWeights(
    features: FeatureVector,
    actualLabel: boolean,
    learningRate: number = 0.01
  ): void {
    const prediction = this.predict(features);
    const error = (actualLabel ? 1 : 0) - prediction.probability;

    // Update each weight using gradient descent
    for (const [feature, value] of Object.entries(features)) {
      const featureKey = feature as keyof FeatureVector;
      this.weights[featureKey] += learningRate * error * value;
    }

    logger.debug(`Weights updated, error: ${error.toFixed(4)}`);
  }

  /**
   * Get feature importance ranking
   */
  getFeatureImportance(): { feature: string; importance: number }[] {
    return Object.entries(this.weights)
      .map(([feature, weight]) => ({
        feature,
        importance: Math.abs(weight),
      }))
      .sort((a, b) => b.importance - a.importance);
  }

  /**
   * Export model for persistence
   */
  exportModel(): {
    weights: Record<string, number>;
    threshold: number;
    means: Record<string, number>;
    stds: Record<string, number>;
  } {
    return {
      weights: { ...this.weights },
      threshold: this.threshold,
      means: { ...this.featureMeans },
      stds: { ...this.featureStds },
    };
  }

  /**
   * Import model from saved state
   */
  importModel(model: ReturnType<typeof this.exportModel>): void {
    this.weights = model.weights as Record<keyof FeatureVector, number>;
    this.threshold = model.threshold;
    this.featureMeans = model.means as Record<keyof FeatureVector, number>;
    this.featureStds = model.stds as Record<keyof FeatureVector, number>;
    logger.info('Model imported successfully');
  }

  /**
   * Calculate model accuracy on test set
   */
  evaluate(
    testData: { features: FeatureVector; label: boolean }[]
  ): {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  } {
    let tp = 0, fp = 0, tn = 0, fn = 0;

    for (const { features, label } of testData) {
      const prediction = this.predict(features);

      if (prediction.isScam && label) tp++;
      else if (prediction.isScam && !label) fp++;
      else if (!prediction.isScam && !label) tn++;
      else fn++;
    }

    const accuracy = (tp + tn) / (tp + fp + tn + fn);
    const precision = tp / (tp + fp) || 0;
    const recall = tp / (tp + fn) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

    return { accuracy, precision, recall, f1Score };
  }
}

export default ScamClassifier;
