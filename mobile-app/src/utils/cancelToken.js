/**
 * A live cancellation token for in-flight async work.
 *
 * Bug #17: passing a boolean `cancelled` flag by value into an async helper
 * freezes it at call time, so flipping the flag after an `await` (e.g. on
 * component unmount) is invisible to the helper — it then runs setState on an
 * unmounted component. Sharing this token object by reference instead lets the
 * helper read `token.cancelled` live, so a mid-flight `cancel()` is observed.
 *
 * Usage:
 *   const token = makeCancelToken();
 *   // ... pass `token` into async helpers; they check `token.cancelled`
 *   // cleanup: token.cancel();
 *
 * @returns {{ cancelled: boolean, cancel: () => void }}
 */
export function makeCancelToken() {
  return {
    cancelled: false,
    cancel() {
      this.cancelled = true;
    },
  };
}
