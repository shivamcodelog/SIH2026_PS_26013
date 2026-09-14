/**
 * SIH26013 Shared Application API Contracts
 * Single source of truth for response shapes between backend and frontend.
 * Conforms to PROJECT_CONTEXT §13 (unified record), §14 (map), §16 (dashboard metrics).
 */

export const DATASET_TYPES = {
  CADASTRAL: 'CADASTRAL',
  MUNICIPAL: 'MUNICIPAL',
  DRONE: 'DRONE'
};

export const DATASET_STATUS = {
  UPLOADED: 'UPLOADED',
  PARSED: 'PARSED',
  NORMALIZED: 'NORMALIZED',
  ERROR: 'ERROR'
};

export const MATCH_STATUS = {
  AUTO_VERIFIED: 'AUTO_VERIFIED',
  REQUIRES_REVIEW: 'REQUIRES_REVIEW',
  HUMAN_VERIFIED: 'HUMAN_VERIFIED',
  REJECTED: 'REJECTED'
};

export const CONFLICT_TYPES = {
  OWNER_MISMATCH: 'OWNER_MISMATCH',
  AREA_MISMATCH: 'AREA_MISMATCH',
  AREA_DISCREPANCY: 'AREA_DISCREPANCY',
  BOUNDARY_MISMATCH: 'BOUNDARY_MISMATCH',
  BOUNDARY_SHIFT: 'BOUNDARY_SHIFT',
  MISSING_RECORD: 'MISSING_RECORD',
  MISSING_MUNICIPAL_RECORD: 'MISSING_MUNICIPAL_RECORD',
  MISSING_CADASTRAL_RECORD: 'MISSING_CADASTRAL_RECORD'
};

export const CONFLICT_SEVERITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH'
};

export const REVIEW_DECISIONS = {
  ACCEPT: 'ACCEPT',
  REJECT: 'REJECT',
  RESOLVE: 'RESOLVE'
};

/**
 * Standard API Success Response Envelope
 */
export function successResponse(data = {}, meta = {}) {
  return {
    success: true,
    ...data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };
}

/**
 * Standard API Error Response Envelope
 */
export function errorResponse(message, code = 500, details = null) {
  return {
    success: false,
    error: {
      message,
      code,
      details,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Creates a standard Dashboard Summary Metrics object (§16)
 */
export function createDashboardMetrics({
  datasetsCount = 0,
  recordsProcessed = 0,
  matchedCount = 0,
  conflictsCount = 0,
  requiresReviewCount = 0,
  autoVerifiedCount = 0,
  humanVerifiedCount = 0,
  rejectedCount = 0
} = {}) {
  const highConfidenceCount = autoVerifiedCount + humanVerifiedCount;
  const highConfidenceRate = recordsProcessed > 0
    ? Math.round((highConfidenceCount / recordsProcessed) * 100)
    : 0;

  return {
    datasetsCount,
    recordsProcessed,
    matchedCount,
    conflictsCount,
    requiresReviewCount,
    autoVerifiedCount,
    humanVerifiedCount,
    rejectedCount,
    highConfidenceRate
  };
}
