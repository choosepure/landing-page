/**
 * Static-file exposure hardening (security).
 *
 * Before the fix, `express.static(__dirname)` served the entire repo root, so
 * source and config files (server.js, package.json, the mobile app tree,
 * .kiro/, .env) were publicly downloadable. These tests lock in the allowlist
 * behavior: only public/ assets and a set of top-level HTML pages are served;
 * everything else 404s. admin.html must NOT be directly downloadable.
 *
 * The app is required in-process (server.js exports `app`, skips app.listen
 * under require.main !== module, and skips the DB connection under a test
 * runner via NODE_ENV==='test' / JEST_WORKER_ID), so no network or MongoDB is
 * needed. admin.html must 404, but admin-login/forgot/reset pages must serve.
 */
// Tests drive the exported app in-process; set a dummy SECRET_KEY so requiring
// server.js never triggers the startup enforcement (which only fires when run
// directly via `node server.js`).
process.env.SECRET_KEY = process.env.SECRET_KEY || 'test-secret-key';
const request = require('supertest');
const app = require('../server');

describe('static file exposure is locked down', () => {
  const mustBlock = [
    '/server.js',
    '/package.json',
    '/mobile-app/package.json',
    '/mobile%20app/google-services.json',
    '/.kiro/steering/mobile-quality.md',
    '/admin.html',
    '/.env',
  ];

  test.each(mustBlock)('404 for sensitive path %s', async (p) => {
    const res = await request(app).get(p);
    expect(res.status).toBe(404);
  });

  const mustServe = [
    '/',
    '/index.html',
    '/purity-wall',
    '/public/favicon.png',
    '/public/choosepure-logo.png',
    '/favicon.png',
    '/akshayakalpa-report.html',
    // Clean legal routes that appear in already-sent emails (must not 404).
    '/privacy-policy',
    '/terms-conditions',
    '/privacy-policy.html',
    '/terms-conditions.html',
    '/contact',
    '/contact-us.html',
    '/happy-hens-eggs-report.html',
    // Admin auth pages stay reachable (only admin.html itself is blocked).
    '/admin-login.html',
    '/admin-forgot-password.html',
    '/admin-reset-password.html',
  ];

  test.each(mustServe)('200 for allowed path %s', async (p) => {
    const res = await request(app).get(p);
    expect(res.status).toBe(200);
  });
});
