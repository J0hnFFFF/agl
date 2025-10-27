/**
 * Utility functions for converting between camelCase and snake_case
 *
 * This allows the TypeScript SDK to use JavaScript conventions (camelCase)
 * while communicating with Python backend APIs that use snake_case.
 */

/**
 * Convert a camelCase string to snake_case
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convert a snake_case string to camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert object keys from camelCase to snake_case
 */
export function keysToSnakeCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => keysToSnakeCase(item)) as any;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const snakeKey = toSnakeCase(key);
        result[snakeKey] = keysToSnakeCase(obj[key]);
      }
    }
    return result;
  }

  return obj;
}

/**
 * Convert object keys from snake_case to camelCase
 */
export function keysToCamelCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => keysToCamelCase(item)) as any;
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const camelKey = toCamelCase(key);
        result[camelKey] = keysToCamelCase(obj[key]);
      }
    }
    return result;
  }

  return obj;
}
