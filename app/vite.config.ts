import { resolve } from 'path'

import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import preact from '@preact/preset-vite'

const target = process.env.APP_BUILD_TARGET

const entries = {
  main: resolve(__dirname, 'index.html'),
  widget: resolve(__dirname, 'widget.html')
}

const input: Record<string, string> =
  target === 'spa'
    ? { main: entries.main }
    : target === 'widget'
      ? { widget: entries.widget }
      : entries

export default defineConfig({
  // Relative asset base: these SPAs are served content-addressed from an IPFS
  // gateway SUBPATH (/ipfs/<cid>/) inside the in-app host loader, as well as at a
  // domain root on dev-dot.li. An absolute base ("/") 404s the assets under the
  // subpath (browse showed "Not Found"); "./" resolves correctly in both contexts.
  base: './',
  // Load env from the repo root .env, shared with evm and deploy.
  envDir: resolve(__dirname, '..'),
  // Expose APP_* and NETWORK_* env to the client bundle.
  envPrefix: ['APP_', 'NETWORK_'],
  plugins: [preact(), nodePolyfills()],
  resolve: {
    alias: {
      // The subpath must precede the bare entry. Alias keys match by prefix, so
      // the bare one would otherwise swallow it and resolve to nothing.
      '@parity/browse-sdk/snapshots': resolve(__dirname, '../packages/browse-sdk/src/snapshots.ts'),
      '@parity/browse-sdk': resolve(__dirname, '../packages/browse-sdk/src/index.ts')
    }
  },
  build: {
    target: 'es2022',
    rollupOptions: { input }
  }
})
