/**
 * Repair two packaging bugs in @splinetool/runtime that stop Next/Turbopack
 * from resolving its assets. Both are upstream issues, present in 2.0.8 and
 * 2.0.10, and both break `next build` AND `next dev`.
 *
 *  1. Missing DRACO decoders. The runtime resolves them as
 *     `new URL('../libs/draco/…', import.meta.url)` from its build/ directory,
 *     i.e. <pkg>/libs/draco/ — a directory absent from the published tarball.
 *     three ships byte-identical decoders, so we copy from there rather than
 *     vendoring binaries into the repo.
 *
 *  2. wasm-bindgen name mismatch. build/boolean.js does
 *     `new URL('boolean_wasm_bg.wasm', import.meta.url)` while the package
 *     ships build/boolean.wasm. The bundler resolves that URL against the
 *     module's own directory, so the fix is to provide a copy under the name
 *     the code asks for. Aliasing in next.config does NOT work here: it
 *     redirects to a package subpath, and this package's `exports` map blocks
 *     build/*.
 *
 * Runs on postinstall so it survives `pnpm install`. Idempotent, and never
 * fails the install — if Spline ever ships these correctly, it quietly no-ops.
 */
import { cp, mkdir, access, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { realpath } from 'node:fs/promises';

const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, '..');

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve a package directory by path, not require.resolve — both packages
 * block './package.json' in their `exports` map, so require.resolve throws
 * ERR_PACKAGE_PATH_NOT_EXPORTED. Follow the pnpm symlink to the real store
 * location so we write actual files rather than through a link.
 */
async function pkgDir(name) {
  const segs = name.split('/');
  for (const base of [webRoot, path.resolve(webRoot, '..', '..')]) {
    const candidate = path.join(base, 'node_modules', ...segs);
    if (await exists(candidate)) return realpath(candidate);
  }
  return null;
}

const runtimeDir = await pkgDir('@splinetool/runtime');
if (!runtimeDir) {
  console.warn('[spline-fix] @splinetool/runtime not found; nothing to do.');
  process.exit(0);
}

/* ── 1. DRACO decoders ──────────────────────────────────────────────────── */
try {
  const target = path.join(runtimeDir, 'libs', 'draco');
  if (!(await exists(path.join(target, 'draco_decoder.wasm')))) {
    const threeDir = await pkgDir('three');
    const source = threeDir
      ? path.join(threeDir, 'examples', 'jsm', 'libs', 'draco')
      : null;
    if (source && (await exists(source))) {
      await mkdir(target, { recursive: true });
      await cp(source, target, { recursive: true });
      console.log('[spline-fix] copied DRACO decoders into libs/draco');
    } else {
      console.warn('[spline-fix] three DRACO decoders not found; skipping.');
    }
  }
} catch (err) {
  console.warn('[spline-fix] draco step skipped:', err?.message ?? err);
}

/* ── 2. wasm-bindgen aliases ────────────────────────────────────────────── */
// Applied to EVERY shipped .wasm, not just boolean: physics, navmesh and
// hana-ui follow the same wasm-bindgen convention and would fail the same way
// once their code paths load.
try {
  const buildDir = path.join(runtimeDir, 'build');
  const files = await readdir(buildDir);
  let made = 0;
  for (const f of files) {
    if (!f.endsWith('.wasm')) continue; // skip .wasm.br / .wasm.gz
    const stem = f.slice(0, -'.wasm'.length);
    if (stem.endsWith('_wasm_bg')) continue; // already the aliased form
    const alias = path.join(buildDir, `${stem}_wasm_bg.wasm`);
    if (!(await exists(alias))) {
      await cp(path.join(buildDir, f), alias);
      made += 1;
    }
  }
  if (made) console.log(`[spline-fix] created ${made} *_wasm_bg.wasm alias file(s)`);
} catch (err) {
  console.warn('[spline-fix] wasm step skipped:', err?.message ?? err);
}
