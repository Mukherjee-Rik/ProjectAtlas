/**
 * Atlas V2.5 Meal Periods & Channels Constants
 */

export const MEAL_PERIODS = {
  BREAKFAST: {
    id: 'BREAKFAST',
    label: 'Breakfast',
    startHour: 7,
    endHour: 11,
    description: '7:00 AM - 11:00 AM',
  },
  LUNCH: {
    id: 'LUNCH',
    label: 'Lunch Rush',
    startHour: 11,
    endHour: 16,
    description: '11:00 AM - 4:00 PM',
  },
  AFTERNOON: {
    id: 'AFTERNOON',
    label: 'Afternoon Tea / Snacks',
    startHour: 16,
    endHour: 19,
    description: '4:00 PM - 7:00 PM',
  },
  DINNER: {
    id: 'DINNER',
    label: 'Dinner Rush',
    startHour: 19,
    endHour: 23,
    description: '7:00 PM - 11:00 PM',
  },
} as const;

export const ORDER_CHANNELS = {
  DINE_IN: { id: 'DINE_IN', label: 'Dine-In' },
  TAKEOUT: { id: 'TAKEOUT', label: 'Takeaway / Counter' },
  DELIVERY: { id: 'DELIVERY', label: 'Delivery' },
  ONLINE: { id: 'ONLINE', label: 'Online / App' },
} as const;
