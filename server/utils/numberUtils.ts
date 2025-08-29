/**
 * Utility functions for safe number parsing and validation
 */

/**
 * Safely parse a float value with fallback
 * @param value - Value to parse (string, number, or undefined)
 * @param fallback - Fallback value if parsing fails (default: 0)
 * @returns Parsed number or fallback
 */
export function safeParseFloat(value: string | number | undefined | null, fallback: number = 0): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  
  if (typeof value === 'number') {
    return isFinite(value) ? value : fallback;
  }
  
  const parsed = parseFloat(value);
  return isFinite(parsed) ? parsed : fallback;
}

/**
 * Safely parse an integer value with fallback
 * @param value - Value to parse
 * @param fallback - Fallback value if parsing fails (default: 0)
 * @returns Parsed integer or fallback
 */
export function safeParseInt(value: string | number | undefined | null, fallback: number = 0): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  
  if (typeof value === 'number') {
    return isFinite(value) ? Math.floor(value) : fallback;
  }
  
  const parsed = parseInt(value, 10);
  return isFinite(parsed) ? parsed : fallback;
}

/**
 * Round a number to specified decimal places
 * @param value - Number to round
 * @param decimals - Number of decimal places (default: 2)
 * @returns Rounded number
 */
export function roundTo(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Ensure a value is within a range
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Validate that percentages sum to 1.0 (100%)
 * @param percentages - Array of percentage values (as decimals)
 * @param tolerance - Acceptable tolerance (default: 0.001)
 * @returns true if sum is within tolerance of 1.0
 */
export function validatePercentageSum(percentages: number[], tolerance: number = 0.001): boolean {
  const sum = percentages.reduce((acc, val) => acc + val, 0);
  return Math.abs(sum - 1.0) <= tolerance;
}

/**
 * Convert percentage string to decimal (e.g., "6.0%" -> 0.06)
 * @param percentStr - Percentage string
 * @returns Decimal value
 */
export function percentToDecimal(percentStr: string): number {
  if (typeof percentStr !== 'string') return 0;
  const cleaned = percentStr.replace('%', '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num / 100;
}