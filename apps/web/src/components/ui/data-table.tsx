'use client';

import { Fragment, useState, type ReactNode } from 'react';
import { Pagination } from './pagination';

export interface Column<T> {
  /** Stable identity for the column. */
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  /**
   * Promoted to the card heading on small screens. Mark exactly one column —
   * typically the record's identifier.
   */
  primary?: boolean;
  /** Omitted from the mobile card to keep it scannable. */
  hideOnMobile?: boolean;
  /** Rendered without a label on mobile (e.g. an action button group). */
  unlabelledOnMobile?: boolean;
  headerClassName?: string;
  cellClassName?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Rendered under the row on both layouts when it returns content. */
  renderExpanded?: (row: T) => ReactNode;
  caption?: string;
  emptyState?: ReactNode;

  /** Enable pagination. Defaults to true. */
  enablePagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  currentPage?: number;
  onPageChange?: (page: number) => void;
  totalItems?: number;
}

/**
 * One data set, two layouts.
 *
 * Below `md` the app previously forced a `min-w-[800px]` table, so every list
 * screen on a phone meant horizontal scrolling. Here the same rows render as
 * stacked cards on small screens and as a real table from `md` up, rather than
 * duplicating markup at each call site.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  renderExpanded,
  caption,
  emptyState,
  enablePagination = true,
  pageSize: initialPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  currentPage,
  onPageChange,
  totalItems,
}: DataTableProps<T>) {
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(initialPageSize);

  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const activePage = currentPage !== undefined ? currentPage : internalPage;
  const activePageSize = initialPageSize !== 10 && !pageSizeOptions.includes(internalPageSize)
    ? initialPageSize
    : internalPageSize;

  const totalCount = totalItems !== undefined ? totalItems : rows.length;
  const totalPages = Math.ceil(totalCount / activePageSize) || 1;

  const handlePageChange = (page: number) => {
    if (currentPage === undefined) {
      setInternalPage(page);
    }
    onPageChange?.(page);
  };

  const handlePageSizeChange = (size: number) => {
    setInternalPageSize(size);
    if (currentPage === undefined) {
      setInternalPage(1);
    }
  };

  // Slice rows for client-side pagination if not already server-paginated
  const visibleRows = !enablePagination
    ? rows
    : totalItems !== undefined
      ? rows
      : rows.slice((activePage - 1) * activePageSize, activePage * activePageSize);

  const mobileColumns = columns.filter((c) => !c.hideOnMobile);
  const primaryColumn = columns.find((c) => c.primary);

  return (
    <div className="space-y-4">
      {/* ---------------- Mobile / small tablet: card list ---------------- */}
      <ul className="flex flex-col gap-3 md:hidden">
        {visibleRows.map((row) => {
          const expanded = renderExpanded?.(row);

          return (
            <li
              key={rowKey(row)}
              className="rounded-xl border border-border bg-card shadow-lg"
            >
              <div
                // Deliberately not role="button": these cards contain their
                // own action buttons, and nesting interactive roles is invalid
                // ARIA. Pointer users can click the card; keyboard and screen
                // reader users get the explicit toggle rendered below.
                {...(onRowClick ? { onClick: () => onRowClick(row) } : {})}
                className={`flex flex-col gap-3 p-4 ${onRowClick ? 'cursor-pointer transition-colors hover:bg-secondary' : ''}`}
              >
                {primaryColumn && (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">{primaryColumn.render(row)}</div>

                    {onRowClick && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowClick(row);
                        }}
                        aria-expanded={Boolean(renderExpanded?.(row))}
                        className="shrink-0 rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        Details
                      </button>
                    )}
                  </div>
                )}

                <dl className="flex flex-col gap-2">
                  {mobileColumns
                    .filter((c) => !c.primary)
                    .map((column) =>
                      column.unlabelledOnMobile ? (
                        <div key={column.key} className="pt-1">
                          {column.render(row)}
                        </div>
                      ) : (
                        <div
                          key={column.key}
                          className="flex items-start justify-between gap-4"
                        >
                          <dt className="shrink-0 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {column.header}
                          </dt>
                          <dd className="min-w-0 text-right text-sm text-foreground">
                            {column.render(row)}
                          </dd>
                        </div>
                      ),
                    )}
                </dl>
              </div>

              {expanded && (
                <div className="border-t border-border p-4">{expanded}</div>
              )}
            </li>
          );
        })}
      </ul>

      {/* ---------------- Desktop: real table ---------------- */}
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
        <table className="w-full text-left">
          {caption && <caption className="sr-only">{caption}</caption>}

          <thead className="border-b border-border bg-secondary">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-4 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:px-6 ${column.headerClassName ?? ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {visibleRows.map((row) => {
              const expanded = renderExpanded?.(row);

              return (
                <Fragment key={rowKey(row)}>
                  <tr
                    // Pointer affordance only — the row contains its own
                    // buttons, so it must not itself be a focusable control.
                    {...(onRowClick ? { onClick: () => onRowClick(row) } : {})}
                    className={
                      onRowClick ? 'cursor-pointer transition-colors hover:bg-secondary' : ''
                    }
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-4 py-4 text-sm lg:px-6 ${column.cellClassName ?? ''}`}
                      >
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>

                  {expanded && (
                    <tr className="bg-secondary">
                      <td colSpan={columns.length} className="px-4 py-4 lg:px-6">
                        {expanded}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {enablePagination && (
        <Pagination
          currentPage={activePage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={totalCount}
          pageSize={activePageSize}
          pageSizeOptions={pageSizeOptions}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}
