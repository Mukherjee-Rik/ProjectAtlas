import type { DietaryType } from '@/types/menu';

const MARK_TONE: Record<string, string> = {
  VEG: 'text-atlas-success',
  VEGAN: 'text-atlas-success',
  EGG: 'text-atlas-warning',
  NON_VEG: 'text-atlas-error',
};

const MARK_LABEL: Record<string, string> = {
  VEG: 'Vegetarian',
  VEGAN: 'Vegan',
  EGG: 'Contains egg',
  NON_VEG: 'Non-vegetarian',
};

/**
 * The familiar Indian veg / non-veg mark: a filled dot inside a square outline
 * of the same colour.
 *
 * The meaning is carried by an accessible label as well as by the colour —
 * "is this vegetarian" is not a decorative distinction, and a colour-blind
 * diner or a device in a forced-colours mode would otherwise be told nothing.
 */
export function DietaryMark({
  type,
  className = '',
}: {
  type: DietaryType | string;
  className?: string;
}) {
  const tone = MARK_TONE[type] ?? 'text-muted-foreground';
  const label = MARK_LABEL[type] ?? 'Dietary information unavailable';

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border border-current ${tone} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
    </span>
  );
}
