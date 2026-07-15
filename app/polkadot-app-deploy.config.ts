// SPDX-License-Identifier: Apache-2.0
//
// Product manifest for `@polkadot-community-foundation/polkadot-app-deploy`
// (the Bulletin app-deploy CLI). The tool auto-discovers this file by name
// (`polkadot-app-deploy.config.{ts,js,mjs}`, walking up from the build dir) and
// reads the default export to publish the product manifest (displayName,
// description, icon) alongside the content upload. A file named anything else is
// silently ignored — manifest publish skipped, no error.
//
// This lives in `app/` (not the repo root): the deploy workflow runs
// `cd app && polkadot-app-deploy dist/spa <domain>`, so the CLI walks up from
// `app/dist/spa` and finds THIS file first. `icon.path` and `executables[].path`
// resolve relative to this file — `./dist/spa` is the SPA build output.
//
// `defineConfig` is vendored as an identity function rather than imported from
// the deploy CLI: the tool is a global/npx CLI, not a package.json dependency,
// so importing from it would make config resolution fragile.
const defineConfig = <T>(config: T): T => config;

declare const process: { env?: Record<string, string | undefined> };

// APP_DOTNS_DOMAIN lets CI/preview deploys override the bare label; defaults to
// the production label. MUST match the domain the CLI is invoked with (the
// deploy workflow exports APP_DOTNS_DOMAIN before running the CLI).
const domain = process.env?.APP_DOTNS_DOMAIN ?? "browse";
const label = domain.toLowerCase().replace(/\.dot$/, "");

export default defineConfig({
  domain: `${label}.dot`,
  displayName: "Browse",
  description:
    "A home for privacy apps on Polkadot — discover, launch, and manage decentralized apps from one directory.",
  icon: { path: "./icon.png", format: "png" },
  executables: [
    {
      kind: "app",
      path: "./dist/spa",
      appVersion: [0, 1, 0],
    },
  ],
});
