import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge class names, letting later Tailwind utilities beat earlier ones.
 *
 * clsx flattens conditionals; twMerge then resolves conflicts so a caller's
 * `px-6` overrides a component's built-in `px-4` instead of both landing in
 * the class list and the winner being decided by stylesheet order.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
