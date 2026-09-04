'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  className?: string;
  compact?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  className = '',
  compact = false,
}: PaginationProps) {
  if (totalPages <= 1 && (!totalItems || totalItems <= (pageSize || 10))) {
    return null;
  }

  // Calculate item range: e.g. "Showing 11 to 20 of 45 items"
  const startItem = pageSize ? (currentPage - 1) * pageSize + 1 : 1;
  const endItem = pageSize && totalItems ? Math.min(currentPage * pageSize, totalItems) : undefined;

  // Generate page numbers with smart ellipsis
  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | '...')[] = [];
    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    pages.push(totalPages);
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border px-4 py-3 bg-card/60 backdrop-blur-xs text-xs ${className}`}
    >
      {/* Range text */}
      <div className="text-muted-foreground flex items-center gap-2">
        {totalItems !== undefined ? (
          <span>
            Showing <strong className="text-foreground">{startItem}</strong>
            {endItem !== undefined && (
              <>
                {' '}to <strong className="text-foreground">{endItem}</strong>
              </>
            )}{' '}
            of <strong className="text-foreground">{totalItems}</strong> items
          </span>
        ) : (
          <span>
            Page <strong className="text-foreground">{currentPage}</strong> of{' '}
            <strong className="text-foreground">{totalPages}</strong>
          </span>
        )}

        {pageSizeOptions && onPageSizeChange && pageSize && (
          <div className="hidden sm:flex items-center gap-1.5 ml-3 pl-3 border-l border-border/80">
            <span className="text-[11px]">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-md border border-border bg-secondary px-2 py-0.5 text-xs text-foreground outline-none focus:border-primary cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        {/* First Page button */}
        {!compact && totalPages > 5 && (
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            aria-label="First page"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Prev Page button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="flex h-8 items-center justify-center gap-1 rounded-lg border border-border bg-secondary px-2.5 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden xs:inline text-xs font-semibold">Prev</span>
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1 mx-0.5">
          {pageNumbers.map((page, idx) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="flex h-8 w-6 items-center justify-center text-muted-foreground text-xs"
                >
                  …
                </span>
              );
            }

            const isActive = page === currentPage;
            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex h-8 min-w-[32px] px-2 items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-background shadow-xs font-black scale-105'
                    : 'border border-border bg-secondary text-muted-foreground hover:border-primary/50 hover:text-foreground'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Page button */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="flex h-8 items-center justify-center gap-1 rounded-lg border border-border bg-secondary px-2.5 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          <span className="hidden xs:inline text-xs font-semibold">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>

        {/* Last Page button */}
        {!compact && totalPages > 5 && (
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="Last page"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
