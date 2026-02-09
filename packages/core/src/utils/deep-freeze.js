/**
 * Deep freeze utility function
 * 
 * Recursively freezes an object and all nested objects to make them immutable.
 * This is used by value objects to ensure their properties cannot be modified.
 * 
 * @param {Object} obj - The object to freeze
 * @returns {Object} The frozen object
 */
export function deepFreeze(obj) {
  // Return early for null, undefined, or primitive values
  if (obj === null || typeof obj !== 'object' && typeof obj !== 'function') {
    return obj;
  }
  
  // Freeze the object itself
  Object.freeze(obj);
  
  // Recursively freeze all properties
  Object.getOwnPropertyNames(obj).forEach(prop => {
    if (
      obj[prop] !== null &&
      (typeof obj[prop] === 'object' || typeof obj[prop] === 'function') &&
      !Object.isFrozen(obj[prop])
    ) {
      deepFreeze(obj[prop]);
    }
  });
  
  return obj;
}
