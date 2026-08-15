/**
 * Natural Language Processing & Fuzzy Matching Utility for Atlas AI
 * Provides typo-tolerance, Levenshtein distance, phonetic similarity, and intent classification.
 */

/**
 * Compute the Levenshtein edit distance between two strings
 */
export function levenshtein(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix: number[][] = [];

  for (let i = 0; i <= bn; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= an; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1,     // deletion
        );
      }
    }
  }

  return matrix[bn][an];
}

/**
 * Check if a word fuzzy-matches a target keyword within a permissible edit distance
 */
export function isFuzzyMatch(word: string, target: string, maxDistance = 2): boolean {
  const cleanWord = word.toLowerCase().trim();
  const cleanTarget = target.toLowerCase().trim();

  if (cleanWord === cleanTarget) return true;

  // Never fuzzy-match tokens with different numbers (e.g. '3days' should NEVER match '7days')
  const wordDigits = cleanWord.match(/\d+/g)?.join('') || '';
  const targetDigits = cleanTarget.match(/\d+/g)?.join('') || '';
  if (wordDigits !== targetDigits) {
    return false;
  }

  // Strict matching for short words (<=4 chars must match exactly to avoid 'how' matching 'hot')
  const allowedDist = cleanTarget.length <= 4 ? 0 : cleanTarget.length <= 6 ? 1 : maxDistance;

  if (Math.abs(cleanWord.length - cleanTarget.length) > allowedDist) return false;

  return levenshtein(cleanWord, cleanTarget) <= allowedDist;
}

/**
 * Tokenize a query string into clean lowercase words without punctuation
 */
export function tokenizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

/**
 * Domain Dictionaries for Restaurant Inquiries
 */
export const VOCABULARY = {
  // Advisory / Growth Strategies
  STRATEGY_GROWTH: [
    'increase',
    'boost',
    'grow',
    'improve',
    'maximize',
    'upsell',
    'advice',
    'tips',
    'strategy',
    'strategies',
    'marketing',
    'more',
    'suggest',
    'recommend',
    'recommendations',
    'idea',
    'ideas',
    'plan',
    'help',
  ],

  // External / Non-restaurant topics
  WEATHER: ['weather', 'rain', 'temperature', 'sunny', 'climate', 'forecast', 'humid', 'cold', 'hot'],
  UNRELATED: ['president', 'joke', 'movie', 'song', 'cricket', 'football', 'politician', 'poem', 'story'],

  SALES: [
    'sales',
    'revenue',
    'income',
    'total',
    'potal', // Common typo for total
    'totl',
    'totall',
    'earning',
    'earnings',
    'earned',
    'profit',
    'gross',
    'turnover',
    'collection',
    'dhandha',
    'kamai',
    'made',
    'spent',
    'billing',
    'takings',
    'intake',
    'inflow',
  ],
  TOP_ITEMS: [
    'item',
    'items',
    'dish',
    'dishes',
    'selling',
    'seller',
    'sold',
    'popular',
    'favorite',
    'fav',
    'hit',
    'hiting',
    'hitting',
    'fastest',
    'food',
    'menu',
    'beverage',
    'ordered',
  ],
  ORDERS: [
    'order',
    'orders',
    'ordr',
    'table',
    'tables',
    'volume',
    'ticket',
    'tickets',
    'covers',
    'bills',
  ],
  CUSTOMERS: [
    'customer',
    'customers',
    'custmr',
    'guest',
    'guests',
    'repeat',
    'loyalty',
    'retention',
    'people',
    'patrons',
    'served',
  ],
  OPERATIONS: [
    'busiest',
    'busy',
    'peak',
    'rush',
    'timing',
    'window',
    'hours',
    'hour',
    'shift',
    'slow',
    'speed',
  ],
  CANCELLATIONS: [
    'cancel',
    'cancels',
    'cancelled',
    'canceled',
    'canceld',
    'cancellation',
    'void',
    'voided',
    'rejected',
    'refund',
    'refunds',
    'wastage',
  ],
  INVENTORY: [
    'inventory',
    'inventry',
    'stock',
    'stocks',
    'ingredient',
    'ingredients',
    'raw',
    'material',
    'reorder',
    'threshold',
    'spoilage',
    'recipe',
    'recipes',
    'valuation',
    'supplies',
    'supply',
  ],
};

export type AiIntent =
  | 'STRATEGY_GROWTH'
  | 'WEATHER_QUERY'
  | 'UNRELATED_QUERY'
  | 'SALES_REVENUE'
  | 'TOP_ITEMS'
  | 'ORDERS'
  | 'CUSTOMERS'
  | 'OPERATIONS'
  | 'CANCELLATIONS'
  | 'INVENTORY_STOCK'
  | 'GENERAL';

/**
 * Detect primary intent from a natural language query with fuzzy typo resilience
 */
export function detectIntent(query: string): { intent: AiIntent; confidence: number } {
  const tokens = tokenizeQuery(query);
  const queryLower = query.toLowerCase();

  // 1. High priority check: Advisory & Growth Strategies ("how to increase sales", "how to grow revenue", etc.)
  const isGrowthAdvice =
    queryLower.includes('how to') ||
    queryLower.includes('what can i do') ||
    queryLower.includes('how can i') ||
    queryLower.includes('ways to') ||
    queryLower.includes('tips to') ||
    queryLower.includes('strategy') ||
    queryLower.includes('suggest') ||
    queryLower.includes('recommend') ||
    queryLower.includes('increase sales') ||
    queryLower.includes('increase revenue') ||
    queryLower.includes('boost sales') ||
    queryLower.includes('grow sales') ||
    queryLower.includes('improve sales');

  if (isGrowthAdvice) {
    return { intent: 'STRATEGY_GROWTH', confidence: 10 };
  }

  // 2. Weather query
  if (tokens.some((t) => VOCABULARY.WEATHER.some((w) => isFuzzyMatch(t, w)))) {
    return { intent: 'WEATHER_QUERY', confidence: 10 };
  }

  // 3. Unrelated query
  if (tokens.some((t) => VOCABULARY.UNRELATED.some((u) => isFuzzyMatch(t, u)))) {
    return { intent: 'UNRELATED_QUERY', confidence: 10 };
  }

  // 4. Inventory check
  if (tokens.some((t) => VOCABULARY.INVENTORY.some((inv) => isFuzzyMatch(t, inv)))) {
    return { intent: 'INVENTORY_STOCK', confidence: 8 };
  }

  const scores: Record<AiIntent, number> = {
    STRATEGY_GROWTH: 0,
    WEATHER_QUERY: 0,
    UNRELATED_QUERY: 0,
    SALES_REVENUE: 0,
    TOP_ITEMS: 0,
    ORDERS: 0,
    CUSTOMERS: 0,
    OPERATIONS: 0,
    CANCELLATIONS: 0,
    INVENTORY_STOCK: 0,
    GENERAL: 0,
  };

  for (const token of tokens) {
    for (const kw of VOCABULARY.STRATEGY_GROWTH) {
      if (isFuzzyMatch(token, kw)) scores.STRATEGY_GROWTH += 2;
    }
    for (const kw of VOCABULARY.SALES) {
      if (isFuzzyMatch(token, kw)) scores.SALES_REVENUE += 2;
    }
    for (const kw of VOCABULARY.TOP_ITEMS) {
      if (isFuzzyMatch(token, kw)) scores.TOP_ITEMS += 2;
    }
    for (const kw of VOCABULARY.ORDERS) {
      if (isFuzzyMatch(token, kw)) scores.ORDERS += 1.5;
    }
    for (const kw of VOCABULARY.CUSTOMERS) {
      if (isFuzzyMatch(token, kw)) scores.CUSTOMERS += 2;
    }
    for (const kw of VOCABULARY.OPERATIONS) {
      if (isFuzzyMatch(token, kw)) scores.OPERATIONS += 2;
    }
    for (const kw of VOCABULARY.CANCELLATIONS) {
      if (isFuzzyMatch(token, kw)) scores.CANCELLATIONS += 2.5;
    }
  }

  // Find the highest score
  let maxScore = 0;
  let detectedIntent: AiIntent = 'GENERAL';

  for (const [intent, score] of Object.entries(scores) as [AiIntent, number][]) {
    if (score > maxScore) {
      maxScore = score;
      detectedIntent = intent;
    }
  }

  return {
    intent: maxScore > 0 ? detectedIntent : 'GENERAL',
    confidence: maxScore,
  };
}

/**
 * Convert number words (one, two, three...) to digits
 */
function parseNumberWords(text: string): string {
  const numMap: Record<string, string> = {
    one: '1',
    two: '2',
    three: '3',
    four: '4',
    five: '5',
    six: '6',
    seven: '7',
    eight: '8',
    nine: '9',
    ten: '10',
  };

  return text
    .toLowerCase()
    .split(/\s+/)
    .map((w) => numMap[w] || w)
    .join(' ');
}

/**
 * Format a Date object into human-readable label (e.g. "Aug 12, 2026")
 */
function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Parse colloquial and precise date ranges from noisy user queries
 */
export function extractDateRange(queryInput: string): { startDate: Date; endDate: Date; label: string } {
  const query = parseNumberWords(queryInput.toLowerCase());
  const tokens = tokenizeQuery(query);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // 1. Specific N days ago (e.g. "3 days ago", "3days ago", "2 days back", "5 days before")
  const daysAgoMatch = query.match(/(\d+)\s*(?:days?|d)\s*(?:ago|back|before|earlier)/);
  if (daysAgoMatch) {
    const days = parseInt(daysAgoMatch[1], 10);
    const targetDate = new Date(todayStart.getTime() - days * 24 * 60 * 60 * 1000);
    const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
    const end = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
    const label = `${days} days ago (${formatDateLabel(start)})`;
    return { startDate: start, endDate: end, label };
  }

  // 2. Trailing N days (e.g. "last 3 days", "past 5 days", "past 7 days", "last 2 days")
  const lastNDaysMatch = query.match(/(?:last|past|in|over)\s*(\d+)\s*(?:days?|d)/);
  if (lastNDaysMatch) {
    const days = parseInt(lastNDaysMatch[1], 10);
    const start = new Date(todayStart.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    return { startDate: start, endDate: now, label: `the last ${days} days` };
  }

  // 3. Yesterday / Kal / Ystrdy
  const yesterdayTokens = ['yesterday', 'ystrdy', 'yestarday', 'yday', 'kal'];
  if (tokens.some((t) => yesterdayTokens.some((yt) => isFuzzyMatch(t, yt, 2)))) {
    const start = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const end = new Date(todayEnd.getTime() - 24 * 60 * 60 * 1000);
    return { startDate: start, endDate: end, label: `yesterday (${formatDateLabel(start)})` };
  }

  // 4. Week / 7 days / Hafta
  if (
    query.includes('this week') ||
    query.includes('past week') ||
    query.includes('last week') ||
    query.includes('7 days') ||
    query.includes('hafta')
  ) {
    const start = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
    return { startDate: start, endDate: now, label: 'this week' };
  }

  // 5. Month / 30 days / Mahina
  if (
    query.includes('this month') ||
    query.includes('past month') ||
    query.includes('last month') ||
    query.includes('30 days') ||
    query.includes('mahina')
  ) {
    const start = new Date(todayStart.getTime() - 29 * 24 * 60 * 60 * 1000);
    return { startDate: start, endDate: now, label: 'this month' };
  }

  // 6. Specific Days of Week (e.g. "on monday", "last tuesday", "on wednesday")
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  for (let i = 0; i < dayNames.length; i++) {
    const dayName = dayNames[i];
    if (query.includes(dayName)) {
      const currentDay = now.getDay();
      let diff = currentDay - i;
      if (diff <= 0) diff += 7; // Previous occurrence of this day
      const targetDate = new Date(todayStart.getTime() - diff * 24 * 60 * 60 * 1000);
      const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
      const end = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
      const capitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
      return { startDate: start, endDate: end, label: `last ${capitalized} (${formatDateLabel(start)})` };
    }
  }

  // 7. Default to today
  return { startDate: todayStart, endDate: now, label: `today (${formatDateLabel(todayStart)})` };
}
