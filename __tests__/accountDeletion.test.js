/**
 * Task 8 — performAccountDeletion unit tests.
 *
 * All deps are mocked: no real Mongo, Razorpay, Firebase, or email. Covers:
 *  - Razorpay cancel success -> account deleted
 *  - Razorpay cancel HARD failure -> NOT deleted, stays pending, attempts++, support alerted
 *  - Razorpay already-cancelled -> proceeds to delete
 *  - no subscription -> deletes without calling Razorpay
 *  - Firebase user-not-found -> treated as success, deletion continues
 *  - payment records anonymised (not deleted); feedback anonymised
 */
const { performAccountDeletion } = require('../services/accountDeletion');

// Minimal ObjectId stand-in: records the id string, compares by value.
class FakeObjectId {
  constructor(id) { this.id = String(id); }
  toString() { return this.id; }
}

function col(initialFindOne = null) {
  return {
    _findOne: initialFindOne,
    deleteOne: jest.fn(async () => ({ deletedCount: 1 })),
    deleteMany: jest.fn(async () => ({ deletedCount: 2 })),
    updateMany: jest.fn(async () => ({ modifiedCount: 3 })),
    updateOne: jest.fn(async () => ({ modifiedCount: 1 })),
    findOne: jest.fn(async function () { return this._findOne; }),
  };
}

function baseDeps(overrides = {}) {
  const usersCollection = col();
  const deletionRequestsCollection = col();
  const subscriptionTransactionsCollection = col();
  const paymentAttemptsCollection = col();
  const feedbackCollection = col();
  const rewardsCollection = col();
  const referralsCollection = col();
  const voteTransactionsCollection = col();
  const labelScans = col();
  const db = { collection: jest.fn(() => labelScans) };
  return {
    ObjectId: FakeObjectId,
    usersCollection,
    deletionRequestsCollection,
    subscriptionTransactionsCollection,
    paymentAttemptsCollection,
    feedbackCollection,
    rewardsCollection,
    referralsCollection,
    voteTransactionsCollection,
    db,
    razorpay: { subscriptions: { cancel: jest.fn(async () => ({})) } },
    firebaseAuth: () => ({ deleteUser: jest.fn(async () => {}) }),
    sendSupportAlert: jest.fn(async () => {}),
    sendDeletionConfirmation: jest.fn(async () => {}),
    logger: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
    ...overrides,
  };
}

const REQUEST = { _id: 'req1', userId: 'user1', email: 'u@example.com', name: 'U' };

function withUser(deps, user) {
  deps.usersCollection._findOne = user;
  return deps;
}

describe('performAccountDeletion', () => {
  it('cancels Razorpay immediately then deletes the account', async () => {
    const deps = withUser(baseDeps(), { _id: new FakeObjectId('user1'), role: 'user', razorpaySubscriptionId: 'sub_123' });
    const result = await performAccountDeletion(REQUEST, deps, 'auto-job');

    expect(deps.razorpay.subscriptions.cancel).toHaveBeenCalledWith('sub_123', { cancel_at_cycle_end: 0 });
    expect(deps.usersCollection.deleteOne).toHaveBeenCalled();
    expect(result.status).toBe('completed');
    expect(result.userDeleted).toBe(1);
    // request marked completed
    expect(deps.deletionRequestsCollection.updateOne).toHaveBeenCalledWith(
      { _id: 'req1' },
      expect.objectContaining({ $set: expect.objectContaining({ status: 'completed' }) })
    );
    expect(deps.sendDeletionConfirmation).toHaveBeenCalledWith({ to: 'u@example.com', name: 'U' });
  });

  it('does NOT delete when Razorpay cancel fails for a real error; stays pending, alerts support', async () => {
    const deps = withUser(baseDeps(), { _id: new FakeObjectId('user1'), role: 'user', razorpaySubscriptionId: 'sub_123' });
    deps.razorpay.subscriptions.cancel = jest.fn(async () => { const e = new Error('network timeout'); throw e; });

    const result = await performAccountDeletion(REQUEST, deps, 'auto-job');

    expect(result.status).toBe('failed');
    expect(deps.usersCollection.deleteOne).not.toHaveBeenCalled();
    expect(deps.sendSupportAlert).toHaveBeenCalledTimes(1);
    // request stays pending with attempts incremented
    expect(deps.deletionRequestsCollection.updateOne).toHaveBeenCalledWith(
      { _id: 'req1' },
      expect.objectContaining({ $set: expect.objectContaining({ status: 'pending', attempts: 1 }) })
    );
  });

  it('proceeds to delete when the subscription is already cancelled', async () => {
    const deps = withUser(baseDeps(), { _id: new FakeObjectId('user1'), role: 'user', razorpaySubscriptionId: 'sub_123' });
    deps.razorpay.subscriptions.cancel = jest.fn(async () => { throw new Error('The subscription is already cancelled'); });

    const result = await performAccountDeletion(REQUEST, deps, 'auto-job');

    expect(result.status).toBe('completed');
    expect(deps.usersCollection.deleteOne).toHaveBeenCalled();
    expect(deps.sendSupportAlert).not.toHaveBeenCalled();
  });

  it('deletes without calling Razorpay when there is no subscription', async () => {
    const deps = withUser(baseDeps(), { _id: new FakeObjectId('user1'), role: 'user' });
    const result = await performAccountDeletion(REQUEST, deps, 'auto-job');

    expect(deps.razorpay.subscriptions.cancel).not.toHaveBeenCalled();
    expect(result.status).toBe('completed');
    expect(deps.usersCollection.deleteOne).toHaveBeenCalled();
  });

  it('treats Firebase user-not-found as success and continues', async () => {
    const deps = withUser(baseDeps(), { _id: new FakeObjectId('user1'), role: 'user', firebaseUid: 'fb_1' });
    deps.firebaseAuth = () => ({
      deleteUser: jest.fn(async () => { const e = new Error('no user'); e.code = 'auth/user-not-found'; throw e; }),
    });
    const result = await performAccountDeletion(REQUEST, deps, 'auto-job');

    expect(result.status).toBe('completed');
    expect(deps.usersCollection.deleteOne).toHaveBeenCalled();
  });

  it('does NOT delete when Firebase deleteUser fails (non user-not-found); stays pending, alerts support', async () => {
    const deps = withUser(baseDeps(), { _id: new FakeObjectId('user1'), role: 'user', firebaseUid: 'fb_1' });
    deps.firebaseAuth = () => ({
      deleteUser: jest.fn(async () => { throw new Error('firebase admin not initialised'); }),
    });
    const result = await performAccountDeletion(REQUEST, deps, 'auto-job');

    expect(result.status).toBe('failed');
    expect(deps.usersCollection.deleteOne).not.toHaveBeenCalled();
    expect(deps.sendSupportAlert).toHaveBeenCalledTimes(1);
    expect(deps.deletionRequestsCollection.updateOne).toHaveBeenCalledWith(
      { _id: 'req1' },
      expect.objectContaining({ $set: expect.objectContaining({ status: 'pending', attempts: 1 }) })
    );
    // confirmation email must NOT be sent on a failed deletion
    expect(deps.sendDeletionConfirmation).not.toHaveBeenCalled();
  });

  it('does not mark completed or email the user on a failed deletion', async () => {
    const deps = withUser(baseDeps(), { _id: new FakeObjectId('user1'), role: 'user', razorpaySubscriptionId: 'sub_x' });
    deps.razorpay.subscriptions.cancel = jest.fn(async () => { throw new Error('boom'); });
    await performAccountDeletion(REQUEST, deps, 'auto-job');
    // the only updateOne call set status pending (never completed)
    const calls = deps.deletionRequestsCollection.updateOne.mock.calls;
    const setCompleted = calls.some(([, upd]) => upd && upd.$set && upd.$set.status === 'completed');
    expect(setCompleted).toBe(false);
    expect(deps.sendDeletionConfirmation).not.toHaveBeenCalled();
  });

  it('anonymises payment records and feedback instead of deleting them', async () => {
    const deps = withUser(baseDeps(), { _id: new FakeObjectId('user1'), role: 'user' });
    await performAccountDeletion(REQUEST, deps, 'auto-job');

    // financial records: updateMany (anonymise), never deleteMany
    expect(deps.subscriptionTransactionsCollection.updateMany).toHaveBeenCalled();
    expect(deps.subscriptionTransactionsCollection.deleteMany).not.toHaveBeenCalled();
    expect(deps.paymentAttemptsCollection.updateMany).toHaveBeenCalled();
    expect(deps.paymentAttemptsCollection.deleteMany).not.toHaveBeenCalled();
    // feedback anonymised
    expect(deps.feedbackCollection.updateMany).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ $set: expect.objectContaining({ name: null, email: null, userId: null }) })
    );
    // rewards/referrals/votes/scans DELETED
    expect(deps.rewardsCollection.deleteMany).toHaveBeenCalled();
    expect(deps.voteTransactionsCollection.deleteMany).toHaveBeenCalled();
  });
});
