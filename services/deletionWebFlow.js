/**
 * Web-based account deletion flow (Task 8, Google Play requirement).
 *
 * A public page (no login) collects an email. We DO NOT create a deletion
 * request from that submission — instead we email a signed confirmation link
 * (24h expiry). Only when the user clicks the link do we create the pending
 * request (which the hourly job / admin then processes).
 *
 * Anti-enumeration: the request step ALWAYS returns the same response whether
 * or not an account exists. The confirmation email is only sent when the email
 * matches a real user.
 *
 * Core logic is dependency-injected for unit testing (no Express, no real DB).
 */

const CONFIRM_TOKEN_TTL = '24h';
const CONFIRM_PURPOSE = 'web-account-deletion';

/**
 * Handle a web deletion request (email submitted on the public page).
 * Always resolves to the same public response; emails a confirmation link only
 * if the email belongs to a real user.
 *
 * @returns {Promise<{ emailed: boolean }>} emailed is for tests/logging only;
 *          callers must NOT leak it to the client.
 */
async function requestWebDeletion(email, deps) {
  const { usersCollection, jwt, jwtSecret, buildConfirmUrl, sendConfirmationEmail, logger = console } = deps;
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) {
    return { emailed: false }; // invalid email — same opaque response upstream
  }

  const user = await usersCollection.findOne({ email: normalized, role: 'user' });
  if (!user) {
    // No account — do nothing, but caller returns the identical response.
    return { emailed: false };
  }

  const token = jwt.sign(
    { purpose: CONFIRM_PURPOSE, userId: user._id.toString(), email: normalized },
    jwtSecret,
    { expiresIn: CONFIRM_TOKEN_TTL }
  );
  const confirmUrl = buildConfirmUrl(token);
  try {
    await sendConfirmationEmail({ to: normalized, name: user.name || '', confirmUrl });
    return { emailed: true };
  } catch (e) {
    logger.warn('web deletion confirmation email failed:', e.message);
    return { emailed: false };
  }
}

/**
 * Handle the confirmation link click: verify the signed token, then create a
 * pending deletion request (idempotent — no duplicate if one is already pending).
 *
 * @returns {Promise<{ ok: boolean, created: boolean, reason?: string }>}
 */
async function confirmWebDeletion(token, deps) {
  const { usersCollection, deletionRequestsCollection, jwt, jwtSecret, logger = console } = deps;
  let decoded;
  try {
    decoded = jwt.verify(token, jwtSecret);
  } catch (e) {
    return { ok: false, created: false, reason: 'invalid_or_expired' };
  }
  if (!decoded || decoded.purpose !== CONFIRM_PURPOSE || !decoded.userId) {
    return { ok: false, created: false, reason: 'invalid_purpose' };
  }

  const { ObjectId } = deps;
  let userObjectId = null;
  try { userObjectId = new ObjectId(decoded.userId); } catch (e) { /* malformed */ }
  const user = userObjectId
    ? await usersCollection.findOne({ _id: userObjectId, role: 'user' })
    : null;
  if (!user) {
    // Account already gone — treat as success (idempotent), nothing to create.
    return { ok: true, created: false, reason: 'already_gone' };
  }

  const existing = await deletionRequestsCollection.findOne({ userId: decoded.userId, status: 'pending' });
  if (existing) {
    return { ok: true, created: false, reason: 'already_pending' };
  }

  await deletionRequestsCollection.insertOne({
    userId: decoded.userId,
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    reason: 'web-deletion',
    source: 'web',
    status: 'pending',
    requestedAt: new Date(),
    createdAt: new Date(),
  });
  logger.log(`🗑️ Web deletion confirmed; pending request created for ${user.email}`);
  return { ok: true, created: true };
}

module.exports = {
  requestWebDeletion,
  confirmWebDeletion,
  CONFIRM_TOKEN_TTL,
  CONFIRM_PURPOSE,
};
