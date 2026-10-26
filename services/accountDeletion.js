/**
 * Account deletion service (Task 8).
 *
 * Shared logic used by BOTH the admin "delete account" button and the hourly
 * auto-delete job. All external dependencies are injected so this is unit-
 * testable without a real database, Razorpay, Firebase, or mailer.
 *
 * Deletion steps (in order, fail-safe):
 *   1. Load the user; capture razorpaySubscriptionId + firebaseUid BEFORE deleting.
 *   2. Cancel the Razorpay subscription immediately (cancel_at_cycle_end: 0).
 *      - If cancel fails for a reason OTHER than already-cancelled/completed,
 *        ABORT: do not delete. Record lastError + increment attempts, email
 *        support, and leave the request pending for retry. After MAX_ATTEMPTS
 *        failures, stop retrying (leave for admin).
 *   3. Delete the Firebase Auth user (user-not-found == success).
 *   4. Delete the Mongo user document.
 *   5. Cascade: delete rewards, referrals, vote_transactions, label_scans.
 *   6. Anonymize (retain) feedback and payment records (financial retention).
 *   7. Mark the request completed; email the user a confirmation.
 */

const MAX_ATTEMPTS = 3;

// Razorpay errors that mean "already not active" — safe to proceed with deletion.
function isAlreadyCancelled(err) {
  const desc = (err && (err.error?.description || err.description || err.message) || '').toLowerCase();
  return (
    desc.includes('already cancelled') ||
    desc.includes('already canceled') ||
    desc.includes('cancelled') ||
    desc.includes('completed') ||
    desc.includes('not active') ||
    desc.includes('expired')
  );
}

/**
 * @param {object} request  The deletion_requests document.
 * @param {object} deps     Injected dependencies.
 * @param {string} by       Who triggered it: 'auto-job' or `admin:<email>`.
 * @returns {Promise<{status:'completed'|'failed'|'skipped', userDeleted:number, cleanup:object, reason?:string}>}
 */
async function performAccountDeletion(request, deps, by) {
  const {
    ObjectId,
    usersCollection,
    deletionRequestsCollection,
    subscriptionTransactionsCollection,
    paymentAttemptsCollection,
    feedbackCollection,
    rewardsCollection,
    referralsCollection,
    voteTransactionsCollection,
    db,
    razorpay,
    firebaseAuth,   // () => admin.auth()-like with deleteUser(uid)
    sendSupportAlert,       // async ({ subject, text }) => void
    sendDeletionConfirmation, // async ({ to, name }) => void
    logger = console,
  } = deps;

  const requestId = request._id;
  const userIdStr = (request.userId || '').toString();
  let userObjectId = null;
  try { userObjectId = new ObjectId(userIdStr); } catch (e) { /* malformed id */ }

  const user = userObjectId
    ? await usersCollection.findOne({ _id: userObjectId, role: 'user' })
    : null;

  // Shared abort path for external-system failures (Razorpay / Firebase): the
  // Mongo user is NOT deleted, the request stays pending with lastError +
  // attempts, support is alerted, and the job retries next run (stops after
  // MAX_ATTEMPTS). Because we abort BEFORE deleting anything, a later re-run
  // starts clean — the operation is idempotent / safe after a partial failure.
  async function abortWithFailure(stage, detail, extraInfo) {
    const attempts = (request.attempts || 0) + 1;
    const lastError = `${stage}: ${detail}`;
    await deletionRequestsCollection.updateOne(
      { _id: requestId },
      { $set: { status: 'pending', lastError, attempts, lastAttemptAt: new Date() } }
    );
    try {
      await sendSupportAlert({
        subject: `⚠️ Account deletion blocked — ${stage} (attempt ${attempts}/${MAX_ATTEMPTS})`,
        text: `Could not complete account deletion; the account was NOT deleted.\n\n`
          + `User ID: ${userIdStr}\n${extraInfo || ''}`
          + `Stage: ${stage}\nAttempt: ${attempts}/${MAX_ATTEMPTS}\nError: ${detail}\n\n`
          + (attempts >= MAX_ATTEMPTS
            ? 'Max attempts reached — the auto-job will stop retrying. Please resolve manually.'
            : 'Will retry on the next job run.'),
      });
    } catch (mailErr) {
      logger.warn('Support alert email failed:', mailErr.message);
    }
    return { status: 'failed', userDeleted: 0, cleanup: {}, reason: lastError, attempts };
  }

  // -- 2. Cancel Razorpay subscription (immediate) before any destructive step.
  const subId = user && user.razorpaySubscriptionId;
  if (subId && razorpay) {
    try {
      await razorpay.subscriptions.cancel(subId, { cancel_at_cycle_end: 0 });
      logger.log(`✅ Razorpay subscription ${subId} cancelled (immediate) for ${request.email}`);
    } catch (err) {
      if (!isAlreadyCancelled(err)) {
        const detail = (err && (err.error?.description || err.message)) || 'Razorpay cancel failed';
        return abortWithFailure('Razorpay cancel failed', detail, `Subscription ID: ${subId}\n`);
      }
      logger.warn(`Razorpay subscription ${subId} already inactive; proceeding. (${err.message})`);
    }
  }

  // -- 3. Delete Firebase Auth user. user-not-found == success. ANY other error
  // (including firebase-admin not initialised) is a HARD failure: abort, do not
  // delete the Mongo user, retry later. This keeps the two systems consistent.
  const firebaseUid = user && user.firebaseUid;
  if (firebaseUid && firebaseAuth) {
    try {
      await firebaseAuth().deleteUser(firebaseUid);
      logger.log(`✅ Firebase user ${firebaseUid} deleted`);
    } catch (err) {
      if (err && err.code === 'auth/user-not-found') {
        logger.warn(`Firebase user ${firebaseUid} not found; treating as deleted.`);
      } else {
        const detail = (err && err.message) || 'Firebase deleteUser failed';
        return abortWithFailure('Firebase delete failed', detail, `Firebase UID: ${firebaseUid}\n`);
      }
    }
  }

  // -- 4. Delete the Mongo user document.
  let userDeleted = 0;
  if (userObjectId) {
    const del = await usersCollection.deleteOne({ _id: userObjectId, role: 'user' });
    userDeleted = del.deletedCount;
  }

  // -- 5 & 6. Cascade delete + anonymize (best-effort; never block completion).
  const cleanup = {};

  // Delete-everything collections
  try {
    if (rewardsCollection && userObjectId) {
      const r = await rewardsCollection.deleteMany({ user_id: userObjectId });
      cleanup.rewards = r.deletedCount;
    }
  } catch (e) { logger.warn('cleanup rewards failed:', e.message); }
  try {
    if (referralsCollection && userObjectId) {
      const r = await referralsCollection.deleteMany({
        $or: [{ referrer_user_id: userObjectId }, { referee_user_id: userObjectId }],
      });
      cleanup.referrals = r.deletedCount;
    }
  } catch (e) { logger.warn('cleanup referrals failed:', e.message); }
  try {
    if (voteTransactionsCollection && userIdStr) {
      const r = await voteTransactionsCollection.deleteMany({ userId: userIdStr });
      cleanup.voteTransactions = r.deletedCount;
    }
  } catch (e) { logger.warn('cleanup vote_transactions failed:', e.message); }
  try {
    if (db && userIdStr) {
      const r = await db.collection('label_scans').deleteMany({ user_id: userIdStr });
      cleanup.labelScans = r.deletedCount;
    }
  } catch (e) { logger.warn('cleanup label_scans failed:', e.message); }

  // Anonymize-and-retain: feedback (keep message + createdAt)
  try {
    if (feedbackCollection && (userObjectId || userIdStr)) {
      const r = await feedbackCollection.updateMany(
        { $or: [{ userId: userObjectId }, { userId: userIdStr }] },
        { $set: { name: null, email: null, userId: null, anonymizedAt: new Date() } }
      );
      cleanup.feedbackAnonymized = r.modifiedCount;
    }
  } catch (e) { logger.warn('anonymize feedback failed:', e.message); }

  // Anonymize-and-retain: financial records (keep amount/date/status/razorpay IDs)
  const stripPII = {
    userName: null, userEmail: null, userPhone: null, userId: null,
    anonymizedAt: new Date(),
  };
  try {
    if (subscriptionTransactionsCollection && userObjectId) {
      const r = await subscriptionTransactionsCollection.updateMany(
        { userId: userObjectId }, { $set: stripPII }
      );
      cleanup.subscriptionTxnAnonymized = r.modifiedCount;
    }
  } catch (e) { logger.warn('anonymize subscription_transactions failed:', e.message); }
  try {
    if (paymentAttemptsCollection && userObjectId) {
      const r = await paymentAttemptsCollection.updateMany(
        { userId: userObjectId }, { $set: stripPII }
      );
      cleanup.paymentAttemptsAnonymized = r.modifiedCount;
    }
  } catch (e) { logger.warn('anonymize payment_attempts failed:', e.message); }

  // -- 7. Mark the request completed.
  await deletionRequestsCollection.updateOne(
    { _id: requestId },
    { $set: { status: 'completed', deletedAt: new Date(), deletedBy: by, cleanup }, $unset: { lastError: '' } }
  );

  // Confirmation email to the address on file (best-effort).
  if (request.email && sendDeletionConfirmation) {
    try {
      await sendDeletionConfirmation({ to: request.email, name: request.name || '' });
    } catch (mailErr) {
      logger.warn('Deletion confirmation email failed:', mailErr.message);
    }
  }

  logger.log(`🗑️ Account deleted (${by}) for ${request.email} (${userIdStr}). userDeleted=${userDeleted}`, cleanup);
  return { status: 'completed', userDeleted, cleanup };
}

module.exports = { performAccountDeletion, isAlreadyCancelled, MAX_ATTEMPTS };
