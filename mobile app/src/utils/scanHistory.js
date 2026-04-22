import AsyncStorage from '@react-native-async-storage/async-storage';

export const SCAN_HISTORY_KEY = 'scan_history';
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
 */
export async function clearScanHistory() {
  try {
    await AsyncStorage.removeItem(SCAN_HISTORY_KEY);
  } catch {
    // Silently fail
  }
}
