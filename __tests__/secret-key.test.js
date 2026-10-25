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
  // Ensure the child is NOT treated as a test run: strip the jest marker and
  // any NODE_ENV=test, so IS_TEST is false and the startup guard fires.
  delete env.JEST_WORKER_ID;
  if (env.NODE_ENV === 'test') delete env.NODE_ENV;
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

  it('throws at module load when required with IS_TEST false and no SECRET_KEY', () => {
    // Simulate a non-test runtime (Render/Vercel) with SECRET_KEY missing.
    const saved = {
      JEST_WORKER_ID: process.env.JEST_WORKER_ID,
      NODE_ENV: process.env.NODE_ENV,
      SECRET_KEY: process.env.SECRET_KEY,
    };
    delete process.env.JEST_WORKER_ID;
    process.env.NODE_ENV = 'production';
    delete process.env.SECRET_KEY;
    try {
      expect(() => {
        jest.isolateModules(() => {
          // Neutralize dotenv so it can't reload SECRET_KEY from the repo's
          // .env, and mock mongodb so that even if module load proceeded it
          // could never open a real connection. The SECRET_KEY guard runs
          // before either is used, so requiring the app must throw.
          jest.doMock('dotenv', () => ({ config: () => ({ parsed: {} }) }));
          jest.doMock('mongodb', () => ({
            MongoClient: class { connect() { return Promise.resolve(); } db() { return {}; } },
            ObjectId: class {},
          }));
          require('../server');
        });
      }).toThrow(/SECRET_KEY/);
    } finally {
      jest.dontMock('dotenv');
      jest.dontMock('mongodb');
      if (saved.JEST_WORKER_ID === undefined) delete process.env.JEST_WORKER_ID;
      else process.env.JEST_WORKER_ID = saved.JEST_WORKER_ID;
      if (saved.NODE_ENV === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = saved.NODE_ENV;
      if (saved.SECRET_KEY === undefined) delete process.env.SECRET_KEY;
      else process.env.SECRET_KEY = saved.SECRET_KEY;
    }
  });
});
