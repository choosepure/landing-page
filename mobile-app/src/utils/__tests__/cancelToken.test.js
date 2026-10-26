/**
 * Bug #17 — ResultCardScreen passed its `cancelled` flag BY VALUE into an async
 * helper. When the flag was flipped (on unmount) after an `await`, the helper
 * still saw the stale `false` and ran setState on an unmounted component.
 *
 * The fix is a live cancel token: an object read by reference, so a flip is
 * visible to in-flight async work. These tests first demonstrate the broken
 * by-value pattern, then prove the token fixes it.
 */
import { makeCancelToken } from '../cancelToken';

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('bug #17: boolean passed by value goes stale across an await', () => {
  it('demonstrates the broken pattern — helper sees stale false after flip', async () => {
    let cancelled = false;

    // Mirrors the old crossReferenceReport(bc, isCancelled) signature.
    async function helperByValue(isCancelled) {
      await tick();            // async gap (like the network call)
      return isCancelled;      // frozen at call-time value
    }

    const resultPromise = helperByValue(cancelled); // passes `false` by value
    cancelled = true;                                // unmount flips it mid-flight
    const seen = await resultPromise;

    // The helper still reports NOT cancelled — this is the bug.
    expect(seen).toBe(false);
  });
});

describe('makeCancelToken: live cancellation read by reference', () => {
  it('starts not cancelled', () => {
    const token = makeCancelToken();
    expect(token.cancelled).toBe(false);
  });

  it('a helper holding the token sees cancellation flipped after an await', async () => {
    const token = makeCancelToken();

    async function helperByToken(t) {
      await tick();         // async gap
      return t.cancelled;   // read live, by reference
    }

    const resultPromise = helperByToken(token);
    token.cancel();         // flip mid-flight (like the cleanup on unmount)
    const seen = await resultPromise;

    // Now the helper correctly observes the cancellation.
    expect(seen).toBe(true);
  });

  it('cancel() is idempotent and leaves cancelled true', () => {
    const token = makeCancelToken();
    token.cancel();
    token.cancel();
    expect(token.cancelled).toBe(true);
  });
});
