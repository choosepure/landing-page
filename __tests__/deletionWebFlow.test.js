/**
 * Task 8 — web deletion flow unit tests.
 *  - requestWebDeletion: unknown email -> no email, same opaque result; known
 *    email -> confirmation email sent. No request created at this step.
 *  - confirmWebDeletion: invalid/expired token -> no-op; valid token -> creates
 *    a pending request; duplicate pending -> no second request.
 */
const { requestWebDeletion, confirmWebDeletion, CONFIRM_PURPOSE } = require('../services/deletionWebFlow');

// Tiny fake JWT: encode/verify a JSON payload, honor a forced-invalid token.
const fakeJwt = {
  sign: (payload) => 'tok:' + JSON.stringify(payload),
  verify: (token) => {
    if (!token || !token.startsWith('tok:')) throw new Error('invalid');
    return JSON.parse(token.slice(4));
  },
};

class FakeObjectId {
  constructor(id) { this.id = String(id); }
  toString() { return this.id; }
}

function usersCol(user) {
  return { findOne: jest.fn(async () => user) };
}
function reqCol(existing = null) {
  return {
    findOne: jest.fn(async () => existing),
    insertOne: jest.fn(async () => ({ insertedId: 'new' })),
  };
}

describe('requestWebDeletion (no enumeration)', () => {
  it('sends no email and reports not-emailed for an unknown email', async () => {
    const sendConfirmationEmail = jest.fn(async () => {});
    const res = await requestWebDeletion('nobody@example.com', {
      usersCollection: usersCol(null),
      jwt: fakeJwt, jwtSecret: 's',
      buildConfirmUrl: (t) => 'https://x/confirm?token=' + t,
      sendConfirmationEmail,
    });
    expect(sendConfirmationEmail).not.toHaveBeenCalled();
    expect(res.emailed).toBe(false);
  });

  it('sends a confirmation email for a known email (but creates no request yet)', async () => {
    const sendConfirmationEmail = jest.fn(async () => {});
    const reqColInstance = reqCol();
    const res = await requestWebDeletion('u@example.com', {
      usersCollection: usersCol({ _id: new FakeObjectId('user1'), name: 'U' }),
      deletionRequestsCollection: reqColInstance,
      jwt: fakeJwt, jwtSecret: 's',
      buildConfirmUrl: (t) => 'https://x/confirm?token=' + t,
      sendConfirmationEmail,
    });
    expect(sendConfirmationEmail).toHaveBeenCalledTimes(1);
    expect(res.emailed).toBe(true);
    // crucially, no pending request is created at the request step
    expect(reqColInstance.insertOne).not.toHaveBeenCalled();
  });

  it('treats an invalid email as the same opaque no-op', async () => {
    const sendConfirmationEmail = jest.fn(async () => {});
    const res = await requestWebDeletion('not-an-email', {
      usersCollection: usersCol({ _id: new FakeObjectId('user1') }),
      jwt: fakeJwt, jwtSecret: 's',
      buildConfirmUrl: (t) => t, sendConfirmationEmail,
    });
    expect(sendConfirmationEmail).not.toHaveBeenCalled();
    expect(res.emailed).toBe(false);
  });
});

describe('confirmWebDeletion', () => {
  const deps = (user, existing) => ({
    usersCollection: usersCol(user),
    deletionRequestsCollection: reqCol(existing),
    jwt: fakeJwt, jwtSecret: 's',
    ObjectId: FakeObjectId,
  });

  it('does nothing for an invalid/expired token', async () => {
    const d = deps({ _id: new FakeObjectId('user1') }, null);
    const res = await confirmWebDeletion('garbage', d);
    expect(res.ok).toBe(false);
    expect(res.created).toBe(false);
    expect(d.deletionRequestsCollection.insertOne).not.toHaveBeenCalled();
  });

  it('rejects a token with the wrong purpose', async () => {
    const d = deps({ _id: new FakeObjectId('user1') }, null);
    const badToken = fakeJwt.sign({ purpose: 'something-else', userId: 'user1' });
    const res = await confirmWebDeletion(badToken, d);
    expect(res.ok).toBe(false);
    expect(d.deletionRequestsCollection.insertOne).not.toHaveBeenCalled();
  });

  it('creates a pending request for a valid token', async () => {
    const d = deps({ _id: new FakeObjectId('user1'), name: 'U', email: 'u@example.com' }, null);
    const token = fakeJwt.sign({ purpose: CONFIRM_PURPOSE, userId: 'user1', email: 'u@example.com' });
    const res = await confirmWebDeletion(token, d);
    expect(res.ok).toBe(true);
    expect(res.created).toBe(true);
    expect(d.deletionRequestsCollection.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user1', status: 'pending', source: 'web' })
    );
  });

  it('does not create a duplicate when one is already pending', async () => {
    const d = deps({ _id: new FakeObjectId('user1') }, { _id: 'existing', status: 'pending' });
    const token = fakeJwt.sign({ purpose: CONFIRM_PURPOSE, userId: 'user1' });
    const res = await confirmWebDeletion(token, d);
    expect(res.ok).toBe(true);
    expect(res.created).toBe(false);
    expect(d.deletionRequestsCollection.insertOne).not.toHaveBeenCalled();
  });
});
