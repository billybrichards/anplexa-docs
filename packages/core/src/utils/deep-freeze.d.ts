/**
 * Deep freeze utility function
 * 
 * Recursively freezes an object and all nested objects to make them immutable.
 * This is used by value objects to ensure their properties cannot be modified.
 * 
 * @param obj - The object to freeze
 * @returns The frozen object as a readonly type
 */
export declare function deepFreeze<T>(obj: T): Readonly<T>;
