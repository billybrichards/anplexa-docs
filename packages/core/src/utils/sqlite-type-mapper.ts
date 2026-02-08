/**
 * SQLite Type Mapper Utilities
 *
 * Type-safe utilities for handling SQLite's lack of native boolean support.
 * SQLite stores boolean values as integers (0 or 1), and Drizzle's mode: 'boolean'
 * should handle conversion automatically. However, in some cases we need to
 * explicitly convert values when building dynamic queries.
 *
 * This module provides type-safe conversion functions that maintain proper
 * TypeScript typing without resorting to `as any` assertions.
 */

/**
 * Type representing fields in the User schema that are boolean in the domain
 * but stored as integers (0/1) in SQLite
 */
export type UserBooleanField =
  | 'isAdmin'
  | 'manualSubscriptionOverride'
  | 'emailOpened1'
  | 'emailOpened2'
  | 'emailOpened3'
  | 'clickedUseApp'
  | 'feedbackSubmitted'
  | 'refundRequested'
  | 'refundProcessed';

/**
 * Configuration mapping boolean field names to their SQLite integer representation
 */
export const USER_BOOLEAN_FIELDS: readonly UserBooleanField[] = [
  'isAdmin',
  'manualSubscriptionOverride',
  'emailOpened1',
  'emailOpened2',
  'emailOpened3',
  'clickedUseApp',
  'feedbackSubmitted',
  'refundRequested',
  'refundProcessed',
] as const;

/**
 * SQLite integer value representing boolean (0 or 1)
 */
export type SQLiteBoolean = 0 | 1;

/**
 * Type-safe conversion from boolean to SQLite integer
 *
 * @param value - Boolean value to convert
 * @returns 1 for true, 0 for false
 */
export function booleanToSQLite(value: boolean): SQLiteBoolean {
  return value ? 1 : 0;
}

/**
 * Type-safe conversion from SQLite integer to boolean
 *
 * @param value - SQLite integer (0 or 1) to convert
 * @returns true for 1, false for 0
 */
export function sqliteToBoolean(value: SQLiteBoolean | number | null | undefined): boolean {
  return value === 1;
}

/**
 * Check if a field name is a boolean field that needs SQLite conversion
 *
 * @param fieldName - Name of the field to check
 * @returns true if the field is a boolean field
 */
export function isUserBooleanField(fieldName: string): fieldName is UserBooleanField {
  return USER_BOOLEAN_FIELDS.includes(fieldName as UserBooleanField);
}

/**
 * Type for the input data before SQLite conversion
 * Allows both boolean and SQLite integer values for flexibility
 */
export type MixedBooleanValue = boolean | SQLiteBoolean | number;

/**
 * Transform a record by converting boolean fields to SQLite integers
 *
 * This is a type-safe alternative to using `as any` assertions.
 * It explicitly handles the conversion of boolean fields while
 * preserving the types of other fields.
 *
 * @param data - Record containing potentially mixed boolean/integer values
 * @param booleanFields - Array of field names that should be converted
 * @returns A new record with boolean fields converted to SQLite integers
 *
 * @example
 * ```typescript
 * const input = { isAdmin: true, email: 'test@example.com' };
 * const output = convertBooleansForSQLite(input, ['isAdmin']);
 * // output = { isAdmin: 1, email: 'test@example.com' }
 * ```
 */
export function convertBooleansForSQLite<T extends Record<string, unknown>>(
  data: T,
  booleanFields: readonly string[] = USER_BOOLEAN_FIELDS
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) {
      continue;
    }

    if (booleanFields.includes(key) && typeof value === 'boolean') {
      result[key] = booleanToSQLite(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Create a new user data object with SQLite-compatible boolean fields
 *
 * This is specifically designed for the create() operation where we need
 * to set default values for all boolean fields.
 *
 * @param userData - User creation data from the application layer
 * @param defaults - Default values for boolean fields not provided
 * @returns A new object with boolean fields converted to SQLite integers
 */
export interface CreateUserBooleanDefaults {
  isAdmin?: boolean;
  manualSubscriptionOverride?: boolean;
  emailOpened1?: boolean;
  emailOpened2?: boolean;
  emailOpened3?: boolean;
  clickedUseApp?: boolean;
  feedbackSubmitted?: boolean;
  refundRequested?: boolean;
  refundProcessed?: boolean;
}

export function createUserWithSQLiteBooleans<T extends CreateUserBooleanDefaults>(
  userData: T
): Omit<T, UserBooleanField> & Record<UserBooleanField, SQLiteBoolean> {
  const result = { ...userData } as Record<string, unknown>;

  // Convert provided boolean fields
  for (const field of USER_BOOLEAN_FIELDS) {
    const value = userData[field as keyof T];
    if (typeof value === 'boolean') {
      result[field] = booleanToSQLite(value);
    } else if (typeof value === 'number') {
      // Already a number, keep it
      result[field] = value as SQLiteBoolean;
    } else {
      // Default to 0 (false) for unset boolean fields
      result[field] = 0;
    }
  }

  return result as Omit<T, UserBooleanField> & Record<UserBooleanField, SQLiteBoolean>;
}

/**
 * Transform update data by converting boolean fields to SQLite integers
 * and removing undefined values
 *
 * @param updates - Partial user update data
 * @returns Cleaned update data with SQLite-compatible boolean fields
 */
export function prepareUpdateData<T extends Record<string, unknown>>(
  updates: T
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(updates)) {
    // Skip undefined values
    if (value === undefined) {
      continue;
    }

    // Convert boolean fields to SQLite integers
    if (isUserBooleanField(key) && typeof value === 'boolean') {
      result[key] = booleanToSQLite(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}
