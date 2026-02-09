/**
 * Deep freeze utility function
 * 
 * Recursively freezes an object and all nested objects to make them immutable.
 * This is used by value objects to ensure their properties cannot be modified.
 * 
 * @param obj - The object to freeze
 * @returns The frozen object
 */
export function deepFreeze<T>(obj: T): T {
  // Return early for null, undefined, or primitive values
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return obj;
  }
  
  // Freeze the object itself
  Object.freeze(obj);
  
  // Recursively freeze all properties
  Object.getOwnPropertyNames(obj).forEach((prop: string) => {
    const value = (obj as any)[prop];
    if (
      value !== null &&
      (typeof value === 'object' || typeof value === 'function') &&
      !Object.isFrozen(value)
    ) {
      deepFreeze(value);
    }
  });
  
  return obj;
}
