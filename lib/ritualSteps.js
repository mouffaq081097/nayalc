import db from './db.js';
import { STEP_SETTINGS } from './ritualRules.js';

/**
 * Admin → Collections → "Ritual step": which step of the Cleanse → Treat →
 * Protect ritual a collection's products belong to (lib/ritualRules.js).
 * NULL = worked out from the names; 'none' = never part of the ritual.
 */
export const RITUAL_STEP_MIGRATION_SQL = `
  ALTER TABLE categories ADD COLUMN IF NOT EXISTS ritual_step TEXT;
`;

let ensured = false;
export async function ensureRitualStepColumn() {
  if (ensured) return;
  await db.query(RITUAL_STEP_MIGRATION_SQL);
  ensured = true;
}

/** True when the column is there (or could be added), so queries may select it. */
export const hasRitualStepColumn = () => ensureRitualStepColumn().then(() => true, () => false);

/** A posted value as stored: one of STEP_SETTINGS, or null for automatic. */
export const parseRitualStep = (value) => (STEP_SETTINGS.includes(value) ? value : null);
