import AsyncStorage from '@react-native-async-storage/async-storage';

export const SCAN_HISTORY_KEY = 'scan_history';
// Bug #16: scan history is stored under one global key. We tag it with the
// user who owns it so that if a *different* user signs in on the same device
// (even when the previous session ended via a 401 reset that skipped cleanup),
// we can detect the mismatch at login and clear the stale history.
export const SCAN_HISTORY_OWNER_KEY = 'scan_history_owner';
export const MAX_RECORDS = 50;

/**
 * Serialize scan history records to JSON string.
 * @param {Array} records - Array of ScanRecord objects
 * @returns {string} JSON string
 */
export function serializeScanHistory(records) {
  return JSON.stringify(records);
}

/**
 * Deserialize JSON string to scan history records.
 * Returns [] for null, invalid JSON, or non-array results.
 * @param {string|null} json - JSON string or null
 * @returns {Array} Array of ScanRecord objects
 */
export function deserializeScanHistory(json) {
  if (json === null || json === undefined) return [];
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

/**
 * Add a record to scan history with deduplication and cap enforcement.
 *
 * If the new record's barcode matches the most recent entry (index 0),
 * update that entry's scannedAt timestamp instead of adding a duplicate.
 * Otherwise, prepend the new record.
 * If length exceeds MAX_RECORDS, remove the last (oldest) entry.
 *
 * @param {Array} history - Current scan history array
 * @param {Object} newRecord - New ScanRecord to add
 * @returns {Array} Updated scan history array
 */
export function addRecord(history, newRecord) {
  let updated;

  if (history.length > 0 && history[0].barcode === newRecord.barcode) {
    // Deduplicate: update the most recent entry's timestamp
    updated = [{ ...history[0], scannedAt: newRecord.scannedAt }, ...history.slice(1)];
  } else {
    // Prepend new record
    updated = [newRecord, ...history];
  }

  // Cap at MAX_RECORDS
  if (updated.length > MAX_RECORDS) {
    updated = updated.slice(0, MAX_RECORDS);
  }

  return updated;
}

/**
 * Create a ScanRecord from a barcode and OFF product data.
 * The hasChoosePureReport field defaults to false (updated later by ResultCardScreen).
 *
 * @param {string} barcode - 13-digit EAN-13 barcode
 * @param {Object} product - OFF product object
 * @returns {Object} ScanRecord object
 */
export function createScanRecord(barcode, product) {
  return {
    barcode,
    productName: product?.name || '',
    brand: product?.brand || '',
    nutriScore: product?.nutriScore || null,
    novaGroup: product?.novaGroup || null,
    imageUrl: product?.imageUrl || null,
    hasChoosePureReport: false,
    scannedAt: new Date().toISOString(),
  };
}

/**
 * Read scan history from AsyncStorage.
 * @returns {Promise<Array>} Array of ScanRecord objects
 */
export async function getScanHistory() {
  try {
    const json = await AsyncStorage.getItem(SCAN_HISTORY_KEY);
    return deserializeScanHistory(json);
  } catch {
    return [];
  }
}

/**
 * Save a new scan record to history.
 * Reads current history, adds the record (with dedup/cap), writes back.
 *
 * @param {string} barcode - 13-digit EAN-13 barcode
 * @param {Object} product - OFF product object
 */
export async function saveScanRecord(barcode, product) {
  try {
    const history = await getScanHistory();
    const record = createScanRecord(barcode, product);
    const updated = addRecord(history, record);
    await AsyncStorage.setItem(SCAN_HISTORY_KEY, serializeScanHistory(updated));
  } catch {
    // Silently fail — scan still navigates to result, history just not saved
  }
}

/**
 * Clear all scan history from AsyncStorage.
 * Also clears the stored owner so the next login starts clean.
 */
export async function clearScanHistory() {
  try {
    await AsyncStorage.multiRemove([SCAN_HISTORY_KEY, SCAN_HISTORY_OWNER_KEY]);
  } catch {
    // Silently fail
  }
}

/**
 * Read the user id that currently owns the local scan history.
 * @returns {Promise<string|null>} The owner's user id, or null if unset.
 */
export async function getScanHistoryOwner() {
  try {
    return await AsyncStorage.getItem(SCAN_HISTORY_OWNER_KEY);
  } catch {
    return null;
  }
}

/**
 * Record which user owns the local scan history.
 * @param {string} userId - The logged-in user's id.
 */
export async function setScanHistoryOwner(userId) {
  try {
    if (userId) await AsyncStorage.setItem(SCAN_HISTORY_OWNER_KEY, String(userId));
  } catch {
    // Silently fail
  }
}

/**
 * Reconcile local scan history ownership at login.
 *
 * If the stored owner differs from the user logging in, the history belonged
 * to someone else (or an unknown prior session) — clear it so the new user
 * never sees another person's scans. Then stamp the current user as owner.
 *
 * This is the single robust guard that covers every session-end path,
 * including the 401 interceptor reset which does not clear history itself.
 *
 * @param {string} userId - The id of the user who just logged in.
 * @returns {Promise<boolean>} true if stale history was cleared.
 */
export async function reconcileScanHistoryOwner(userId) {
  if (!userId) return false;
  const current = await getScanHistoryOwner();
  let cleared = false;
  if (current !== String(userId)) {
    if (current !== null) {
      // A different (or unknown) owner held the history — wipe it.
      try {
        await AsyncStorage.removeItem(SCAN_HISTORY_KEY);
        cleared = true;
      } catch {
        // Silently fail
      }
    }
    await setScanHistoryOwner(userId);
  }
  return cleared;
}
