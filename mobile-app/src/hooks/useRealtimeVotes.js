/**
 * useRealtimeVotes Hook
 *
 * Subscribes to real-time vote count updates from Firestore for a
 * list of product IDs.  Returns a plain object mapping each product
 * ID to its current vote count, along with a connection status flag.
 *
 * The hook automatically subscribes on mount and unsubscribes when
 * the component unmounts or when the `productIds` array changes.
 *
 * @example
 *   const { voteCounts, isConnected } = useRealtimeVotes(['p1', 'p2']);
 *   // voteCounts => { p1: 42, p2: 17 }
 *   // isConnected => true
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { useState, useEffect, useRef } from 'react';
import { subscribeToVoteCounts } from '../services/firebase/firestore';

/**
 * @param {string[]} productIds — product IDs to subscribe to
 * @returns {{ voteCounts: Record<string, number>, isConnected: boolean }}
 */
export function useRealtimeVotes(productIds) {
  const [voteCounts, setVoteCounts] = useState({});
  const [isConnected, setIsConnected] = useState(false);

  // Keep a ref to the latest productIds so the cleanup function
  // always references the current unsubscribe without needing to
  // add the unsubscribe function itself to the dependency array.
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    // Nothing to subscribe to — reset state and bail out.
    if (!Array.isArray(productIds) || productIds.length === 0) {
      setVoteCounts({});
      setIsConnected(false);
      return;
    }

    const handleUpdate = (voteCountsMap) => {
      // Convert the Map returned by subscribeToVoteCounts to a plain
      // object so React components can consume it directly.
      const obj = {};
      voteCountsMap.forEach((count, id) => {
        obj[id] = count;
      });
      setVoteCounts(obj);
      setIsConnected(true);
    };

    const handleError = () => {
      setIsConnected(false);
    };

    const unsubscribe = subscribeToVoteCounts(productIds, handleUpdate, handleError);
    unsubscribeRef.current = unsubscribe;

    // Cleanup: unsubscribe when productIds change or on unmount.
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [productIds]);

  return { voteCounts, isConnected };
}
