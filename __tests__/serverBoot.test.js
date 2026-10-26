/**
 * Boot smoke test — catches module-load crashes in the startup block.
 *
 * The unit tests set IS_TEST=true, which SKIPS the `if (!IS_TEST && !IS_VERCEL)`
 * startup block (DB connect + setInterval). A TDZ bug in that block
 * (`Cannot access 'DELETION_JOB_INTERVAL_MS' before initialization`) crash-looped
 * production and was invisible to the unit tests. This test runs server.js the
 * way Render does — guard ACTIVE — and asserts it boots and keeps running
 * instead of exiting non-zero at module load.
 */
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const SERVER = path.join(__dirname, '..', 'server.js');

function bootServer() {
  return new Promise((resolve) => {
    const env = {
      ...process.env,
      // Make the startup guard RUN (not a test, not Vercel):
      NODE_ENV: 'production',
      // Dummy config so module-load initialisers (JWT, Razorpay, Mailgun) pass.
      SECRET_KEY: 'boot-test-secret',
      MONGO_URL: 'mongodb://127.0.0.1:65535/boot-test', // unreachable: connect retries in bg, non-fatal
      DB_NAME: 'boot_test',
      PORT: '0', // let the OS pick a free port
      RAZORPAY_KEY_ID: 'rzp_test_boot',
      RAZORPAY_KEY_SECRET: 'boot',
      MAILGUN_API_KEY: 'boot',
      MAILGUN_DOMAIN: 'choosepure.in',
    };
    delete env.JEST_WORKER_ID; // ensure IS_TEST is false in the child
    delete env.VERCEL;

    const child = spawn(process.execPath, [SERVER], { env, cwd: os.tmpdir() });
    let out = '';
    child.stdout.on('data', (d) => { out += d.toString(); });
    child.stderr.on('data', (d) => { out += d.toString(); });

    // If it crashes at module load, it exits within ~1s. Give it 6s to boot.
    const timer = setTimeout(() => {
      const booted = /Server running on port/i.test(out);
      child.kill('SIGKILL');
      resolve({ crashed: false, booted, out });
    }, 6000);

    child.on('exit', (code) => {
      clearTimeout(timer);
      resolve({ crashed: true, code, out });
    });
  });
}

describe('server boots with the startup block active (regression: TDZ crash)', () => {
  jest.setTimeout(20000);

  it('does not exit at module load and starts listening', async () => {
    const res = await bootServer();
    if (res.crashed) {
      throw new Error(`server.js exited at startup (code ${res.code}). Output:\n${res.out}`);
    }
    expect(res.booted).toBe(true);
  });

  it('does not throw a TDZ / ReferenceError during boot', async () => {
    const res = await bootServer();
    expect(res.out).not.toMatch(/ReferenceError|before initialization/);
  });
});
