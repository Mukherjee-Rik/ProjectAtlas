/**
 * Atlas Standard Form Validation Utilities
 */

// Email regex adhering to RFC 5322 standard
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Standard Phone regex: allows optional +, numbers, spaces, hyphens (7 to 15 digits)
export const PHONE_REGEX = /^\+?[0-9\s-]{7,15}$/;

// Alphanumeric code regex (letters, numbers, hyphens, underscores)
export const CODE_REGEX = /^[A-Za-z0-9-_]+$/;

// URL regex
export const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates an email address.
 */
export function validateEmail(email: string, required = true): ValidationResult {
  const trimmed = (email || '').trim();
  if (!trimmed) {
    return required
      ? { isValid: false, error: 'Email address is required' }
      : { isValid: true };
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. name@domain.com)' };
  }
  if (trimmed.length > 255) {
    return { isValid: false, error: 'Email address cannot exceed 255 characters' };
  }
  return { isValid: true };
}

/**
 * Validates a phone number.
 */
export function validatePhone(phone: string, required = false): ValidationResult {
  const trimmed = (phone || '').trim();
  if (!trimmed) {
    return required
      ? { isValid: false, error: 'Phone number is required' }
      : { isValid: true };
  }
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return { isValid: false, error: 'Phone number must contain between 7 and 15 digits' };
  }
  if (!PHONE_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Phone number can only contain numbers, +, - and spaces' };
  }
  return { isValid: true };
}

/**
 * Validates short alphanumeric codes (e.g. Table Code, Branch Code, Menu Code).
 */
export function validateCode(
  code: string,
  min = 1,
  max = 10,
  fieldName = 'Code',
  required = true,
): ValidationResult {
  const trimmed = (code || '').trim();
  if (!trimmed) {
    return required
      ? { isValid: false, error: `${fieldName} is required` }
      : { isValid: true };
  }
  if (trimmed.length < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min} characters` };
  }
  if (trimmed.length > max) {
    return { isValid: false, error: `${fieldName} cannot exceed ${max} characters` };
  }
  if (!CODE_REGEX.test(trimmed)) {
    return { isValid: false, error: `${fieldName} can only contain letters, numbers, and hyphens` };
  }
  return { isValid: true };
}

/**
 * Validates general text fields (e.g. names, titles, descriptions).
 */
export function validateText(
  text: string,
  fieldName = 'Field',
  min = 1,
  max = 100,
  required = true,
): ValidationResult {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    return required
      ? { isValid: false, error: `${fieldName} is required` }
      : { isValid: true };
  }
  if (trimmed.length < min) {
    return { isValid: false, error: `${fieldName} must be at least ${min} characters` };
  }
  if (trimmed.length > max) {
    return { isValid: false, error: `${fieldName} cannot exceed ${max} characters` };
  }
  return { isValid: true };
}

/**
 * Validates numeric fields (e.g. seating capacity, price, prep time).
 */
export function validateNumber(
  value: number | string,
  fieldName = 'Value',
  min = 0,
  max = 1000000,
  integerOnly = false,
  required = true,
): ValidationResult {
  if (value === '' || value === null || value === undefined) {
    return required
      ? { isValid: false, error: `${fieldName} is required` }
      : { isValid: true };
  }
  const num = Number(value);
  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }
  if (integerOnly && !Number.isInteger(num)) {
    return { isValid: false, error: `${fieldName} must be a whole number` };
  }
  if (num < min) {
    return { isValid: false, error: `${fieldName} cannot be less than ${min}` };
  }
  if (num > max) {
    return { isValid: false, error: `${fieldName} cannot exceed ${max}` };
  }
  return { isValid: true };
}

/**
 * Validates password strength & length.
 */
export function validatePassword(password: string, min = 8, required = true): ValidationResult {
  if (!password) {
    return required
      ? { isValid: false, error: 'Password is required' }
      : { isValid: true };
  }
  if (password.length < min) {
    return { isValid: false, error: `Password must be at least ${min} characters long` };
  }
  if (password.length > 100) {
    return { isValid: false, error: 'Password cannot exceed 100 characters' };
  }
  return { isValid: true };
}
