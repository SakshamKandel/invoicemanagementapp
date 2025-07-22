// Firestore Optimization Configuration
// This file controls various optimization features

export const OPTIMIZATION_CONFIG = {
  // Caching configuration
  CACHE_ENABLED: true,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  
  // Pagination configuration
  PAGINATION_ENABLED: true,
  CUSTOMERS_PAGE_SIZE: 20,
  INVOICES_PAGE_SIZE: 15,
  PRODUCTS_PAGE_SIZE: 50,
  
  // Real-time listeners configuration
  DEBOUNCE_MS: 1000, // 1 second
  MAX_LISTENERS: 5,
  
  // Batch operations configuration
  BATCH_SIZE: 500,
  
  // Offline support
  OFFLINE_ENABLED: true,
  
  // Performance monitoring
  PERFORMANCE_LOGGING: true,
  
  // Feature flags for gradual rollout
  FEATURES: {
    OPTIMIZED_QUERIES: true,
    INTELLIGENT_CACHING: true,
    BATCH_WRITES: true,
    PAGINATION: true,
    SEARCH_OPTIMIZATION: true,
    REAL_TIME_DEBOUNCING: true
  },
  
  // Backward compatibility settings
  FALLBACK_ENABLED: true,
  FALLBACK_TIMEOUT: 5000, // 5 seconds
  
  // Cost optimization thresholds
  THRESHOLDS: {
    MAX_READS_PER_MINUTE: 1000,
    MAX_WRITES_PER_MINUTE: 100,
    WARNING_THRESHOLD: 0.8 // 80% of limit
  }
};

// Development vs Production configurations
export const ENVIRONMENT_OVERRIDES = {
  development: {
    CACHE_TTL: 1 * 60 * 1000, // 1 minute for development
    PERFORMANCE_LOGGING: true,
    FALLBACK_ENABLED: true
  },
  production: {
    CACHE_TTL: 10 * 60 * 1000, // 10 minutes for production
    PERFORMANCE_LOGGING: false,
    FALLBACK_ENABLED: true
  }
};

// Apply environment-specific overrides
const env = process.env.NODE_ENV || 'development';
if (ENVIRONMENT_OVERRIDES[env]) {
  Object.assign(OPTIMIZATION_CONFIG, ENVIRONMENT_OVERRIDES[env]);
}

export default OPTIMIZATION_CONFIG;