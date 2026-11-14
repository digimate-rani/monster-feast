/**
 * Food catalog for Monster Feast (Section 6).
 * Each item has: { id, baseId, en, plural, article, countable, he, emoji, color, category, tint, plateColor, multiColor }
 */

export const CATEGORIES = {
  fruit: { en: 'fruit', pluralEn: 'fruit', he: 'פירות' },
  vegetables: { en: 'vegetables', pluralEn: 'vegetables', he: 'ירקות' },
  sweets: { en: 'sweets', pluralEn: 'sweets', he: 'ממתקים' },
  drinks: { en: 'drinks', pluralEn: 'drinks', he: 'שתייה' },
  other: { en: 'food', pluralEn: 'food', he: 'אוכל' }
};

export const COLOR_STYLES = {
  red: { label: 'red', hex: '#FF5A5F', soft: '#FFE2E3', ring: '#FF7B7F' },
  green: { label: 'green', hex: '#38C172', soft: '#DCFCE7', ring: '#4ADE80' },
  yellow: { label: 'yellow', hex: '#F59E0B', soft: '#FEF3C7', ring: '#FBBF24' },
  purple: { label: 'purple', hex: '#8B5CF6', soft: '#EDE9FE', ring: '#A78BFA' },
  blue: { label: 'blue', hex: '#3B82F6', soft: '#DBEAFE', ring: '#60A5FA' },
  pink: { label: 'pink', hex: '#EC4899', soft: '#FCE7F3', ring: '#F472B6' },
  orange: { label: 'orange', hex: '#F97316', soft: '#FFEDD5', ring: '#FB923C' },
  white: { label: 'white', hex: '#94A3B8', soft: '#F8FAFC', ring: '#CBD5E1' },
  brown: { label: 'brown', hex: '#92400E', soft: '#F5E6D3', ring: '#B45309' },
  mixed: { label: 'mixed', hex: '#94A3B8', soft: '#FFF8EC', ring: '#E2C9A6' }
};

export const ITEMS = [
  // Multi-color: Apples
  {
    id: 'apple_red',
    baseId: 'apple',
    en: 'apple',
    plural: 'apples',
    article: 'an',
    countable: true,
    he: 'תפוח אדום',
    emoji: '🍎',
    color: 'red',
    category: 'fruit',
    multiColor: true,
    tint: 'none',
    badgeColor: '#FF5A5F'
  },
  {
    id: 'apple_green',
    baseId: 'apple',
    en: 'apple',
    plural: 'apples',
    article: 'an',
    countable: true,
    he: 'תפוח ירוק',
    emoji: '🍏',
    color: 'green',
    category: 'fruit',
    multiColor: true,
    tint: 'none',
    badgeColor: '#38C172'
  },
  {
    id: 'apple_yellow',
    baseId: 'apple',
    en: 'apple',
    plural: 'apples',
    article: 'an',
    countable: true,
    he: 'תפוח צהוב',
    emoji: '🍏',
    color: 'yellow',
    category: 'fruit',
    multiColor: true,
    tint: 'hue-rotate(-45deg) saturate(1.45) brightness(1.16)',
    badgeColor: '#F59E0B'
  },

  // Multi-color: Peppers
  {
    id: 'pepper_red',
    baseId: 'pepper',
    en: 'pepper',
    plural: 'peppers',
    article: 'a',
    countable: true,
    he: 'פלפל אדום',
    emoji: '🫑',
    color: 'red',
    category: 'vegetables',
    multiColor: true,
    tint: 'hue-rotate(-110deg) saturate(1.6) brightness(1.04)',
    badgeColor: '#FF5A5F'
  },
  {
    id: 'pepper_green',
    baseId: 'pepper',
    en: 'pepper',
    plural: 'peppers',
    article: 'a',
    countable: true,
    he: 'פלפל ירוק',
    emoji: '🫑',
    color: 'green',
    category: 'vegetables',
    multiColor: true,
    tint: 'none',
    badgeColor: '#38C172'
  },
  {
    id: 'pepper_yellow',
    baseId: 'pepper',
    en: 'pepper',
    plural: 'peppers',
    article: 'a',
    countable: true,
    he: 'פלפל צהוב',
    emoji: '🫑',
    color: 'yellow',
    category: 'vegetables',
    multiColor: true,
    tint: 'hue-rotate(-55deg) saturate(1.6) brightness(1.18)',
    badgeColor: '#F59E0B'
  },

  // Multi-color: Grapes
  {
    id: 'grapes_green',
    baseId: 'grapes',
    en: 'grapes',
    plural: 'grapes',
    article: '',
    countable: false,
    he: 'ענבים ירוקים',
    emoji: '🍇',
    color: 'green',
    category: 'fruit',
    multiColor: true,
    tint: 'hue-rotate(-175deg) saturate(1.35) brightness(1.16)',
    badgeColor: '#38C172'
  },
  {
    id: 'grapes_purple',
    baseId: 'grapes',
    en: 'grapes',
    plural: 'grapes',
    article: '',
    countable: false,
    he: 'ענבים סגולים',
    emoji: '🍇',
    color: 'purple',
    category: 'fruit',
    multiColor: true,
    tint: 'none',
    badgeColor: '#8B5CF6'
  },

  // Multi-color: Candy
  {
    id: 'candy_red',
    baseId: 'candy',
    en: 'candy',
    plural: 'candies',
    article: 'a',
    countable: true,
    he: 'סוכרייה אדומה',
    emoji: '🍬',
    color: 'red',
    category: 'sweets',
    multiColor: true,
    tint: 'hue-rotate(-30deg) saturate(1.4)',
    badgeColor: '#FF5A5F'
  },
  {
    id: 'candy_blue',
    baseId: 'candy',
    en: 'candy',
    plural: 'candies',
    article: 'a',
    countable: true,
    he: 'סוכרייה כחולה',
    emoji: '🍬',
    color: 'blue',
    category: 'sweets',
    multiColor: true,
    tint: 'hue-rotate(155deg) saturate(1.35)',
    badgeColor: '#3B82F6'
  },
  {
    id: 'candy_pink',
    baseId: 'candy',
    en: 'candy',
    plural: 'candies',
    article: 'a',
    countable: true,
    he: 'סוכרייה ורודה',
    emoji: '🍬',
    color: 'pink',
    category: 'sweets',
    multiColor: true,
    tint: 'hue-rotate(-55deg) saturate(1.25) brightness(1.06)',
    badgeColor: '#EC4899'
  },

  // Multi-color: Juice
  {
    id: 'juice_orange',
    baseId: 'juice',
    en: 'juice',
    plural: 'juice',
    article: '',
    countable: false,
    he: 'מיץ תפוזים',
    emoji: '🧃',
    color: 'orange',
    category: 'drinks',
    multiColor: true,
    tint: 'none',
    badgeColor: '#F97316'
  },
  {
    id: 'juice_purple',
    baseId: 'juice',
    en: 'juice',
    plural: 'juice',
    article: '',
    countable: false,
    he: 'מיץ ענבים',
    emoji: '🧃',
    color: 'purple',
    category: 'drinks',
    multiColor: true,
    tint: 'hue-rotate(235deg) saturate(1.3)',
    badgeColor: '#8B5CF6'
  },

  // Multi-color: Cupcakes
  {
    id: 'cupcake_pink',
    baseId: 'cupcake',
    en: 'cupcake',
    plural: 'cupcakes',
    article: 'a',
    countable: true,
    he: 'קאפקייק ורוד',
    emoji: '🧁',
    color: 'pink',
    category: 'sweets',
    multiColor: true,
    tint: 'none',
    badgeColor: '#EC4899'
  },
  {
    id: 'cupcake_blue',
    baseId: 'cupcake',
    en: 'cupcake',
    plural: 'cupcakes',
    article: 'a',
    countable: true,
    he: 'קאפקייק כחול',
    emoji: '🧁',
    color: 'blue',
    category: 'sweets',
    multiColor: true,
    tint: 'hue-rotate(-135deg) saturate(1.35)',
    badgeColor: '#3B82F6'
  },

  // Single-color foods
  {
    id: 'banana',
    baseId: 'banana',
    en: 'banana',
    plural: 'bananas',
    article: 'a',
    countable: true,
    he: 'בננה',
    emoji: '🍌',
    color: 'yellow',
    category: 'fruit',
    multiColor: false,
    tint: 'none',
    badgeColor: null
  },
  {
    id: 'egg',
    baseId: 'egg',
    en: 'egg',
    plural: 'eggs',
    article: 'an',
    countable: true,
    he: 'ביצה',
    emoji: '🥚',
    color: 'white',
    category: 'other',
    multiColor: false,
    tint: 'none',
    badgeColor: null
  },
  {
    id: 'carrot',
    baseId: 'carrot',
    en: 'carrot',
    plural: 'carrots',
    article: 'a',
    countable: true,
    he: 'גזר',
    emoji: '🥕',
    color: 'orange',
    category: 'vegetables',
    multiColor: false,
    tint: 'none',
    badgeColor: null
  },
  {
    id: 'cheese',
    baseId: 'cheese',
    en: 'cheese',
    plural: 'cheese',
    article: '',
    countable: false,
    he: 'גבינה',
    emoji: '🧀',
    color: 'yellow',
    category: 'other',
    multiColor: false,
    tint: 'none',
    badgeColor: null
  },
  {
    id: 'cookie',
    baseId: 'cookie',
    en: 'cookie',
    plural: 'cookies',
    article: 'a',
    countable: true,
    he: 'עוגייה',
    emoji: '🍪',
    color: 'brown',
    category: 'sweets',
    multiColor: false,
    tint: 'none',
    badgeColor: null
  },
  {
    id: 'pizza',
    baseId: 'pizza',
    en: 'pizza',
    plural: 'pizzas',
    article: 'a',
    countable: true,
    he: 'פיצה',
    emoji: '🍕',
    color: 'mixed',
    category: 'other',
    multiColor: false,
    tint: 'none',
    badgeColor: null
  },
  {
    id: 'strawberry',
    baseId: 'strawberry',
    en: 'strawberry',
    plural: 'strawberries',
    article: 'a',
    countable: true,
    he: 'תות',
    emoji: '🍓',
    color: 'red',
    category: 'fruit',
    multiColor: false,
    tint: 'none',
    badgeColor: null
  },
  {
    id: 'watermelon',
    baseId: 'watermelon',
    en: 'watermelon',
    plural: 'watermelons',
    article: 'a',
    countable: true,
    he: 'אבטיח',
    emoji: '🍉',
    color: 'mixed',
    category: 'fruit',
    multiColor: false,
    tint: 'none',
    badgeColor: null
  },
  {
    id: 'bread',
    baseId: 'bread',
    en: 'bread',
    plural: 'bread',
    article: '',
    countable: false,
    he: 'לחם',
    emoji: '🍞',
    color: 'brown',
    category: 'other',
    multiColor: false,
    tint: 'none',
    badgeColor: null
  },
  {
    id: 'milk',
    baseId: 'milk',
    en: 'milk',
    plural: 'milk',
    article: '',
    countable: false,
    he: 'חלב',
    emoji: '🥛',
    color: 'white',
    category: 'drinks',
    multiColor: false,
    tint: 'none',
    badgeColor: null
  },
  {
    id: 'ice_cream',
    baseId: 'ice_cream',
    en: 'ice cream',
    plural: 'ice cream',
    article: '',
    countable: false,
    he: 'גלידה',
    emoji: '🍨',
    color: 'pink',
    category: 'sweets',
    multiColor: false,
    tint: 'none',
    badgeColor: null
  },
  {
    id: 'cake',
    baseId: 'cake',
    en: 'cake',
    plural: 'cakes',
    article: 'a',
    countable: true,
    he: 'עוגה',
    emoji: '🍰',
    color: 'mixed',
    category: 'sweets',
    multiColor: false,
    tint: 'none',
    badgeColor: null
  },
  {
    id: 'tomato',
    baseId: 'tomato',
    en: 'tomato',
    plural: 'tomatoes',
    article: 'a',
    countable: true,
    he: 'עגבנייה',
    emoji: '🍅',
    color: 'red',
    category: 'vegetables',
    multiColor: false,
    tint: 'none',
    badgeColor: null
  },
  {
    id: 'orange',
    baseId: 'orange',
    en: 'orange',
    plural: 'oranges',
    article: 'an',
    countable: true,
    he: 'תפוז',
    emoji: '🍊',
    color: 'orange',
    category: 'fruit',
    multiColor: false,
    tint: 'none',
    badgeColor: null
  }
];

export const ITEMS_BY_ID = Object.fromEntries(ITEMS.map((item) => [item.id, item]));

export function getItem(id) {
  return ITEMS_BY_ID[id] || null;
}

export function getItemsByBase(baseId) {
  return ITEMS.filter((item) => item.baseId === baseId);
}

export function getMultiColorBases() {
  const seen = new Set();
  for (const item of ITEMS) {
    if (item.multiColor) seen.add(item.baseId);
  }
  return Array.from(seen);
}
