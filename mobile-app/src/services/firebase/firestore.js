/**
 * Firebase Firestore Service
 *
 * Provides real-time listeners for vote count documents in the
 * `voteCounts` Firestore collection.  Every public function checks
 * Firebase availability via `isFirebaseInitialized` before accessing
 * Firestore APIs.  When Firebase is unavailable a no-op unsubscribe
 * function is returned so callers do not need to guard against null.
 *
 * Requirements: 8.1, 8.6
 */

import firestore from '@react-native-firebase/firestore';
import { isFirebaseInitialized } from './index';

/** Firestore collection that stores per-product vote counts. */
const VOTE_COUNTS_COLLECTION = 'voteCounts';

/**
 * Maximum number of items allowed in a Firestore `in` query.
 * Lists longer than this are split into batches automatically.
 */
const FIRESTORE_IN_QUERY_LIMIT = 30;

/**
 * No-op function returned when Firebase is unavailable or when the
 * caller provides an empty product list.
 */
const noop = () => {};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Subscribe to real-time vote count updates for a list of products.
 *
 * Listens to documents in the `voteCounts` collection whose document
 * IDs match the supplied `productIds`.  Firestore `in` queries are
 * limited to 30 items, so longer lists are automatically split into
 * batches with one listener per batch.
 *
 * @param {string[]} productIds — product IDs to subscribe to
 * @param {(voteCounts: Map<string, number>) => void} onUpdate
 *   Called with a Map of productId → totalVotes whenever any
 *   subscribed document changes.
 * @param {(error: Error) => void} onError
 *   Called when a listener encounters an error.
 * @returns {() => void} Unsubscribe function — call to stop all listeners.
 */
export function subscribeToVoteCounts(productIds, onUpdate, onError) {
  if (!isFirebaseInitialized()) {
    console.warn('[Firestore] Firebase is not initialized. Returning no-op unsubscribe.');
    return noop;
  }

  if (!Array.isArray(productIds) || productIds.length === 0) {
    return noop;
  }

  // Split productIds into batches of FIRESTORE_IN_QUERY_LIMIT
  const batches = [];
  for (let i = 0; i < productIds.length; i += FIRESTORE_IN_QUERY_LIMIT) {
    batches.push(productIds.slice(i, i + FIRESTORE_IN_QUERY_LIMIT));
  }

  // Accumulate results from all batches into a single Map
  const batchResults = new Map();
  const unsubscribers = [];

  for (const batch of batches) {
    try {
      const unsubscribe = firestore()
        .collection(VOTE_COUNTS_COLLECTION)
        .where(firestore.FieldPath.documentId(), 'in', batch)
        .onSnapshot(
          (snapshot) => {
            snapshot.docs.forEach((doc) => {
              const data = doc.data();
              batchResults.set(doc.id, data.totalVotes ?? 0);
            });

            // Emit a fresh copy so consumers always receive the latest
            // aggregated state across all batches.
            onUpdate(new Map(batchResults));
          },
          (error) => {
            console.warn('[Firestore] Vote counts listener error:', error.message);
            if (onError) {
              onError(error);
            }
          },
        );

      unsubscribers.push(unsubscribe);
    } catch (error) {
      console.warn('[Firestore] Failed to create vote counts listener:', error.message);
      if (onError) {
        onError(error);
      }
    }
  }

  // Return a single unsubscribe function that tears down every batch listener
  return () => {
    unsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch (error) {
        console.warn('[Firestore] Error during unsubscribe:', error.message);
      }
    });
  };
}

/**
 * Subscribe to real-time vote count updates for a single product.
 *
 * Listens to a single document in the `voteCounts` collection whose
 * document ID matches the supplied `productId`.
 *
 * @param {string} productId — the product ID to subscribe to
 * @param {(count: number) => void} onUpdate
 *   Called with the `totalVotes` value whenever the document changes.
 * @param {(error: Error) => void} onError
 *   Called when the listener encounters an error.
 * @returns {() => void} Unsubscribe function — call to stop listening.
 */
export function subscribeToSingleProduct(productId, onUpdate, onError) {
  if (!isFirebaseInitialized()) {
    console.warn('[Firestore] Firebase is not initialized. Returning no-op unsubscribe.');
    return noop;
  }

  if (!productId) {
    return noop;
  }

  try {
    const unsubscribe = firestore()
      .collection(VOTE_COUNTS_COLLECTION)
      .doc(productId)
      .onSnapshot(
        (snapshot) => {
          const data = snapshot.data();
          onUpdate(data?.totalVotes ?? 0);
        },
        (error) => {
          console.warn('[Firestore] Single product listener error:', error.message);
          if (onError) {
            onError(error);
          }
        },
      );

    return unsubscribe;
  } catch (error) {
    console.warn('[Firestore] Failed to create single product listener:', error.message);
    if (onError) {
      onError(error);
    }
    return noop;
  }
}
