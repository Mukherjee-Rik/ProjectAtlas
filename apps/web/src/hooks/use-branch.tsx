'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  const { currentRestaurant } = useRestaurant();
  const [currentBranch, setCurrentBranchState] = useState<Branch | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);

  useEffect(() => {
    const stored = getCurrentBranch();
    if (stored) {
      if (currentRestaurant && stored.restaurantId !== currentRestaurant.id) {
        clearCurrentBranch();
        setCurrentBranchState(null);
      } else {
        setCurrentBranchState(stored);
      }
    }
  }, [currentRestaurant?.id]);

  const clearBranch = useCallback(() => {
    setCurrentBranchState(null);
    setBranches([]);
    clearCurrentBranch();
  }, []);

  const setCurrentBranch = useCallback((branch: Branch | null) => {
    setCurrentBranchState(branch);
    if (branch) {
      saveCurrentBranch(branch);
    } else {
      clearCurrentBranch();
    }
  }, []);

  const reloadBranches = useCallback(async () => {
    if (!currentRestaurant) {
      clearBranch();
      return;
    }

    setIsLoadingBranches(true);
    try {
      const response = await getBranches(currentRestaurant.id);
      const loadedBranches = response.data ?? [];
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
    // ✅ currentBranch removed from deps - use functional setState instead
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRestaurant?.id, clearBranch]);

  useEffect(() => {
    if (currentRestaurant) {
      void reloadBranches();
    } else {
      clearBranch();
    }
  }, [currentRestaurant?.id, reloadBranches, clearBranch]);


  return (
    <BranchContext.Provider
      value={{
        branches,
        currentBranch,
        currentBranchId: currentBranch?.id ?? null,
        isLoadingBranches,
        setCurrentBranch,
        clearBranch,
        reloadBranches,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
