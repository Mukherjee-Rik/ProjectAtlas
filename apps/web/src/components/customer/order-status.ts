export interface OrderStatusStyle {
  bg: string;
  text: string;
  border: string;
}

/**
 * Status tones for the diner-facing order screens.
 *
 * Every value resolves to a theme token. CONFIRMED sits on the neutral surface
 * so that it cannot be confused with PREPARING, which is the informational
 * tone: the two are adjacent in the lifecycle and a diner reads this badge more
 * than anything else on the tracker.
 */
export const ORDER_STATUS_STYLE: Record<string, OrderStatusStyle> = {
  PENDING: { bg: 'bg-atlas-warning/15', text: 'text-atlas-warning', border: 'border-atlas-warning/30' },
  CONFIRMED: { bg: 'bg-secondary', text: 'text-subtle', border: 'border-border' },
  PREPARING: { bg: 'bg-atlas-info/15', text: 'text-atlas-info', border: 'border-atlas-info/30' },
  READY: { bg: 'bg-atlas-success/15', text: 'text-atlas-success', border: 'border-atlas-success/30' },
  SERVED: { bg: 'bg-primary/15', text: 'text-primary', border: 'border-primary/30' },
  COMPLETED: { bg: 'bg-muted-foreground/15', text: 'text-muted-foreground', border: 'border-muted-foreground/30' },
  CANCELLED: { bg: 'bg-atlas-error/15', text: 'text-atlas-error', border: 'border-atlas-error/30' },
};

export function orderStatusStyle(status: string): OrderStatusStyle {
  return ORDER_STATUS_STYLE[status] ?? ORDER_STATUS_STYLE.PENDING;
}

/**
 * Label for one order inside a table session.
 *
 * Derived from the position in the session rather than from an "is this the
 * first or the last one" pair of flags: a table on its third round used to show
 * two cards both labelled "Round 2".
 */
export function orderRoundLabel(index: number, total: number): string {
  if (total <= 1 || index < 0) return 'Initial Order';
  return `Round ${index + 1} of ${total}`;
}

/** The same label, shortened for a pill inside the round switcher. */
export function orderRoundShortLabel(index: number, total: number): string {
  if (total <= 1 || index < 0) return 'Order';
  return `Round ${index + 1}`;
}
