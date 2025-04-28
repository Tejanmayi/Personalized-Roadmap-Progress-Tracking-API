const NodeCache = require('node-cache');

// Cache configuration
const cache = new NodeCache({
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every minute
  useClones: false // Don't clone objects for better performance
});

// Cache keys
const CACHE_KEYS = {
  ROADMAP: (userId, roadmapId) => `roadmap:${userId}:${roadmapId}`,
  USER_ROADMAPS: (userId) => `user_roadmaps:${userId}`,
  PROGRESS: (userId, roadmapId) => `progress:${userId}:${roadmapId}`,
  ANALYTICS: (userId) => `analytics:${userId}`,
  LOCK: (key) => `${key}:lock`
};

// Cache TTLs in seconds
const CACHE_TTL = {
  ROADMAP: 300, // 5 minutes
  USER_ROADMAPS: 600, // 10 minutes
  PROGRESS: 60, // 1 minute
  ANALYTICS: 900, // 15 minutes
  LOCK: 30 // 30 seconds lock timeout
};

// In-flight requests tracking
const inFlightRequests = new Map();

class CacheService {
  static cache = new NodeCache();

  // Get cached data with request coalescing
  static async get(key) {
    // Check if request is in flight
    if (inFlightRequests.has(key)) {
      return inFlightRequests.get(key);
    }
    return this.cache.get(key);
  }

  // Set cached data
  static set(key, value, ttl) {
    return this.cache.set(key, value, ttl);
  }

  // Delete cached data
  static del(key) {
    return this.cache.del(key);
  }

  // Flush entire cache
  static flush() {
    return this.cache.flushAll();
  }

  // Acquire lock
  static async acquireLock(key, timeout = CACHE_TTL.LOCK) {
    const lockKey = CACHE_KEYS.LOCK(key);
    if (this.cache.get(lockKey)) {
      return false;
    }
    return this.cache.set(lockKey, true, timeout);
  }

  // Release lock
  static releaseLock(key) {
    const lockKey = CACHE_KEYS.LOCK(key);
    return this.cache.del(lockKey);
  }

  // Get roadmap from cache with locking and request coalescing
  static async getRoadmap(userId, roadmapId, fetchFn) {
    const key = CACHE_KEYS.ROADMAP(userId, roadmapId);
    
    let roadmap = await this.get(key);
    if (roadmap) return roadmap;

    if (inFlightRequests.has(key)) {
      return inFlightRequests.get(key);
    }

    if (!await this.acquireLock(key)) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.getRoadmap(userId, roadmapId, fetchFn);
    }

    try {
      const promise = fetchFn().then(result => {
        if (result) {
          this.set(key, result, CACHE_TTL.ROADMAP);
        }
        inFlightRequests.delete(key);
        return result;
      });

      inFlightRequests.set(key, promise);
      return promise;
    } finally {
      this.releaseLock(key);
    }
  }

  // Get user roadmaps from cache or set if not exists
  static async getUserRoadmaps(userId, fetchFn) {
    const key = CACHE_KEYS.USER_ROADMAPS(userId);
    let roadmaps = this.get(key);

    if (!roadmaps) {
      roadmaps = await fetchFn();
      if (roadmaps) {
        this.set(key, roadmaps, CACHE_TTL.USER_ROADMAPS);
      }
    }

    return roadmaps;
  }

  // Get progress from cache with locking and request coalescing
  static async getProgress(userId, roadmapId, fetchFn) {
    const key = CACHE_KEYS.PROGRESS(userId, roadmapId);
    
    // Check cache first
    let progress = await this.get(key);
    if (progress) return progress;

    // Check for in-flight request
    if (inFlightRequests.has(key)) {
      return inFlightRequests.get(key);
    }

    // Try to acquire lock
    if (!await this.acquireLock(key)) {
      // Wait and retry if locked
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.getProgress(userId, roadmapId, fetchFn);
    }

    try {
      // Create promise for request coalescing
      const promise = fetchFn().then(result => {
        if (result) {
          this.set(key, result, CACHE_TTL.PROGRESS);
        }
        inFlightRequests.delete(key);
        return result;
      });

      inFlightRequests.set(key, promise);
      return promise;
    } finally {
      this.releaseLock(key);
    }
  }

  // Get analytics from cache with locking and request coalescing
  static async getAnalytics(userId, fetchFn) {
    const key = CACHE_KEYS.ANALYTICS(userId);
    
    let analytics = await this.get(key);
    if (analytics) return analytics;

    if (inFlightRequests.has(key)) {
      return inFlightRequests.get(key);
    }

    if (!await this.acquireLock(key)) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.getAnalytics(userId, fetchFn);
    }

    try {
      const promise = fetchFn().then(result => {
        if (result) {
          this.set(key, result, CACHE_TTL.ANALYTICS);
        }
        inFlightRequests.delete(key);
        return result;
      });

      inFlightRequests.set(key, promise);
      return promise;
    } finally {
      this.releaseLock(key);
    }
  }

  // Atomic cache invalidation
  static async invalidateProgressData(userId, roadmapId) {
    const keys = [
      CACHE_KEYS.ROADMAP(userId, roadmapId),
      CACHE_KEYS.PROGRESS(userId, roadmapId),
      CACHE_KEYS.ANALYTICS(userId)
    ];
    
    return Promise.all(keys.map(key => this.del(key)));
  }

  // Individual cache invalidation methods (for backward compatibility)
  static invalidateRoadmap(userId, roadmapId) {
    const key = CACHE_KEYS.ROADMAP(userId, roadmapId);
    this.del(key);
    this.invalidateUserRoadmaps(userId);
  }

  // Invalidate user roadmaps cache
  static invalidateUserRoadmaps(userId) {
    const key = CACHE_KEYS.USER_ROADMAPS(userId);
    this.del(key);
  }

  static invalidateProgress(userId, roadmapId) {
    const key = CACHE_KEYS.PROGRESS(userId, roadmapId);
    this.del(key);
  }

  static invalidateAnalytics(userId) {
    const key = CACHE_KEYS.ANALYTICS(userId);
    this.del(key);
  }
}

module.exports = CacheService; 