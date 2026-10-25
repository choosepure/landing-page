/**
 * Security: server refuses to start without SECRET_KEY.
 *
 * `node server.js` must exit non-zero when SECRET_KEY is unset, rather than
 * falling back to a hardcoded signing secret (which would allow token forgery).
 * The check only fires when run directly, so we spawn the real entrypoint.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const SERVER = path.join(__dirname, '..', 'server.js');

const os = require('os');

function runWithoutSecretKey() {
  const env = { ...process.env };
  delete env.SECRET_KEY;
  // server.js calls dotenv.config(), which loads `.env` from the current
  // working directory. Run from a temp dir (no .env) so SECRET_KEY stays
  // genuinely unset and the startup guard can fire. server.js resolves its
  // own paths via __dirname, so a different cwd is safe for the startup check.
  return spawnSync(process.execPath, [SERVER], {
    env,
    cwd: os.tmpdir(),
    encoding: 'utf8',
    timeout: 15000,
  });
}

describe('SECRET_KEY is required at startup', () => {
  it('exits non-zero when SECRET_KEY is missing', () => {
    const result = runWithoutSecretKey();
    // Should have exited (not timed out) with a non-zero code.
    expect(result.signal).toBeNull();
    expect(result.status).not.toBe(0);
  });

  it('logs a clear fatal error mentioning SECRET_KEY', () => {
    const result = runWithoutSecretKey();
    const output = `${result.stdout || ''}${result.stderr || ''}`;
    expect(output).toMatch(/SECRET_KEY/);
  });
});
