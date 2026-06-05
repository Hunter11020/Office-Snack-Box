// Predefined snack categories. Shared by the admin form (dropdown), the API
// (server-side validation), and the UI (badges). Stored as plain strings on the
// Snack row so the list can be extended without a schema migration.
export const SNACK_CATEGORIES = [
  'ช็อกโกแลต',
  'ขนมขบเคี้ยว',
  'คุกกี้/บิสกิต',
  'ลูกอม/หมากฝรั่ง',
  'ของแห้ง/ถั่ว',
  'เครื่องดื่ม',
  'อื่นๆ',
] as const

export type SnackCategory = (typeof SNACK_CATEGORIES)[number]

export const DEFAULT_CATEGORY: SnackCategory = 'อื่นๆ'

export function isValidCategory(value: unknown): value is SnackCategory {
  return typeof value === 'string' && (SNACK_CATEGORIES as readonly string[]).includes(value)
}
