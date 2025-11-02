/**
 * In-Memory Cache (replaces Redis)
 */

import NodeCache from 'node-cache';

let cache: NodeCache | null = null;

export function createCache() {
  cache = new NodeCache({
    stdTTL: 3600, // Default TTL: 1 hour
    checkperiod: 600, // Check for expired keys every 10 minutes
    useClones: false // Better performance
  });

  console.log('✅ Cache initialized');
  return cache;
}

export function getCache(): NodeCache {
  if (!cache) {
    throw new Error('Cache not initialized. Call createCache() first.');
  }
  return cache;
}
