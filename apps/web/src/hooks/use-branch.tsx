'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Branch } from '@/types/branch';
import {
  getCurrentBranch,
  setCurrentBranch as saveCurrentBranch,
  clearCurrentBranch,
} from '@/lib/branch-storage';
import { useRestaurant } from './use-restaurant';
import { useAuth } from './use-auth';
import { getBranches } from '@/services/branches.service';

interface BranchContextValue {
  branches: Branch[];
  currentBranch: Branch | null;
  currentBranchId: string | null;
  isLoadingBranches: boolean;
  setCurrentBranch: (branch: Branch | null) => void;
  clearBranch: () => void;
  reloadBranches: () => Promise<void>;
}

const BranchContext = createContext<BranchContextValue | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { currentRestaurant } = useRestaurant();
  const isOwnerOrAdmin = user?.role === 'OWNER' || user?.role === 'PLATFORM_ADMIN';

  // Seeded from storage on the first render, with both guards applied before
  // the value is ever adopted: a branch from another restaurant is dropped,
  // and non-owner staff keep only their assigned Main branch. Doing this in an
  // effect meant every branch-scoped screen waited an extra commit — and the
  // request that follows an extra round trip — for something already on disk.
  const [currentBranch, setCurrentBranchState] = useState<Branch | null>(() => {
    const stored = getCurrentBranch();
    if (!stored) return null;
    if (currentRestaurant && stored.restaurantId !== currentRestaurant.id) return null;
    if (!isOwnerOrAdmin && stored.code?.toUpperCase() !== 'MAIN') return null;
    return stored;
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);

  // First render is covered by the seed above; this catches a restaurant switch
  // afterwards, so the previous restaurant's branch is not left selected while
  // the new list loads. The staff-branch rule is not re-applied here —
  // `reloadBranches` owns which branch a non-owner ends up on, and second-
  // guessing its choice from this effect would clear the branch it just set.
  useEffect(() => {
    if (!currentBranch || !currentRestaurant) return;
    if (currentBranch.restaurantId === currentRestaurant.id) return;
    clearCurrentBranch();
    setCurrentBranchState(null);
  }, [currentRestaurant?.id, currentBranch]);

  const clearBranch = useCallback(() => {
    setCurrentBranchState(null);
    setBranches([]);
    clearCurrentBranch();
  }, []);

  const setCurrentBranch = useCallback((branch: Branch | null) => {
    if (!isOwnerOrAdmin && branch && branches.length > 0 && branch.id !== branches[0].id) {
      // Non-owner staff cannot switch away from their assigned branch
      return;
    }
    setCurrentBranchState(branch);
    if (branch) {
      saveCurrentBranch(branch);
    } else {
      clearCurrentBranch();
    }
  }, [isOwnerOrAdmin, branches]);

  const reloadBranches = useCallback(async () => {
    if (!currentRestaurant) {
      clearBranch();
      return;
    }

    setIsLoadingBranches(true);
    try {
      const response = await getBranches(currentRestaurant.id);
      let loadedBranches = response.data ?? [];

      if (!isOwnerOrAdmin && loadedBranches.length > 0) {
        // Non-owner staff (waiter, cashier, kitchen, manager, staff) only see their assigned Main branch
        const mainBranch =
          loadedBranches.find(
            (b) => b.code.toUpperCase() === 'MAIN' || b.name.toLowerCase().includes('main'),
          ) || loadedBranches[0];
        const assigned = mainBranch!;
        setBranches([assigned]);
        saveCurrentBranch(assigned);
        setCurrentBranchState(assigned);
        return;
      }

      setBranches(loadedBranches);

      // Use functional state update to avoid capturing stale currentBranch
      setCurrentBranchState((prevBranch) => {
        if (loadedBranches.length === 0) {
          clearCurrentBranch();
          return null;
        }

        if (!prevBranch || prevBranch.restaurantId !== currentRestaurant.id) {
          saveCurrentBranch(loadedBranches[0]!);
          return loadedBranches[0]!;
        } else if (!loadedBranches.some((b) => b.id === prevBranch.id)) {
          const fallback = loadedBranches[0] ?? null;
          if (fallback) saveCurrentBranch(fallback);
          else clearCurrentBranch();
          return fallback;
        }
        return prevBranch;
      });
    } catch {
      // Ignore load error
    } finally {
      setIsLoadingBranches(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRestaurant?.id, isOwnerOrAdmin, clearBranch]);

  useEffect(() => {
    if (currentRestaurant) {
      void reloadBranches();
    } else {
      clearBranch();
    }
  }, [currentRestaurant?.id, reloadBranches, clearBranch]);


  // Memoised so a new object here does not re-render every branch consumer on
  // an unrelated state change further up the provider stack.
  const value = useMemo<BranchContextValue>(
    () => ({
      branches,
      currentBranch,
      currentBranchId: currentBranch?.id ?? null,
      isLoadingBranches,
      setCurrentBranch,
      clearBranch,
      reloadBranches,
    }),
    [
      branches,
      currentBranch,
      isLoadingBranches,
      setCurrentBranch,
      clearBranch,
      reloadBranches,
    ],
  );

  return (
    <BranchContext.Provider value={value}>{children}</BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
