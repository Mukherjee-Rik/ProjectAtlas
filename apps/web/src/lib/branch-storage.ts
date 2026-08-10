import type { Branch } from '@/types/branch';

const BRANCH_STORAGE_KEY = 'atlas_current_branch';

export function getCurrentBranchId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const stored = localStorage.getItem(BRANCH_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.id ?? null;
  } catch {
    return null;
  }
}

export function getCurrentBranch(): Branch | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const stored = localStorage.getItem(BRANCH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setCurrentBranch(branch: Branch): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(BRANCH_STORAGE_KEY, JSON.stringify(branch));
  }
}

export function clearCurrentBranch(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(BRANCH_STORAGE_KEY);
  }
}
