#!/usr/bin/env node
/**
 * rescope-pack.mjs — stage a PCF-scoped tarball of @parity/browse-sdk without renaming it in-tree.
 *
 * Why: browse is a fork of paritytech/browse. The SDK is named `@parity/browse-sdk` in-tree and the
 * app references it by that name everywhere (package.json, vite alias, tsconfig, ~12 imports), so we
 * keep the upstream name to stay merge-clean with `git merge upstream/main`. But PCF publishes its own
 * build (it carries PCF's Summit network config) under its scope as
 * `@polkadot-community-foundation/browse-sdk`.
 *
 * Assumes the package is already built (`bun run build`). Runs `npm pack`, rewrites only the `name`
 * (and version stays), and repacks into pack-output/ for the npm-publish-automation to publish.
 * Mirrors contract-dependency-manager/src/lib/env/scripts/rescope-pack.mjs. See
 * summit-deployer-skills/guides/pcf-npm-publishing notes.
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PKG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLISHED_NAME = "@polkadot-community-foundation/browse-sdk";
const OUT_DIR = join(PKG_DIR, "pack-output");

const run = (cmd, cwd) => execSync(cmd, { cwd, stdio: ["ignore", "pipe", "inherit"] }).toString().trim();

const stage = mkdtempSync(join(tmpdir(), "pcf-browse-sdk-"));
run(`npm pack --pack-destination ${stage}`, PKG_DIR);
const srcTgz = readdirSync(stage).find((f) => f.endsWith(".tgz"));
if (!srcTgz) throw new Error("npm pack produced no .tgz (build first: bun run build)");
run(`tar -xzf ${join(stage, srcTgz)} -C ${stage}`, stage); // -> ${stage}/package/

const pkgJsonPath = join(stage, "package", "package.json");
const pkg = JSON.parse(readFileSync(pkgJsonPath, "utf8"));
const upstreamName = pkg.name;
pkg.name = PUBLISHED_NAME;
writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + "\n");

if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });
run(`npm pack --pack-destination ${OUT_DIR}`, join(stage, "package"));
rmSync(stage, { recursive: true, force: true });

const outTgz = readdirSync(OUT_DIR).find((f) => f.endsWith(".tgz"));
console.log(`[rescope-pack] ${upstreamName}@${pkg.version} -> ${PUBLISHED_NAME}@${pkg.version}`);
console.log(`[rescope-pack] staged tarball: ${join(OUT_DIR, outTgz)}`);
