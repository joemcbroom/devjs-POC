## Runtime environment injection (POC for ephemeral deploys)

This project demonstrates a simple, framework-agnostic way to inject environment variables at runtime so you can deploy ephemeral environments (e.g., per PR or per commit) without rebuilding the app.

### How it works

- `index.html` loads a small runtime file `env.js` before the app bootstraps:
  - `public/env.js` is the default for local dev.
  - At deploy time, we overwrite `dist/env.js` with environment-specific values.
- `src/config/env.ts` exposes these values to the app as a typed object (`window.__ENV__`).
- `scripts/replaceEnv.js` writes `dist/env.js` from a file named `<environment>.env.js` (e.g., a commit SHA or `pr-123`).

### File layout

- `public/env.js`: default values for local dev.
- `src/config/env.ts`: TypeScript type and accessor for `window.__ENV__`.
- `scripts/replaceEnv.js`: the injector that writes `dist/env.js`.
- `scripts/*.env.js`: example inputs (e.g., `abc.env.js`, `prod.env.js`).

### Local development

1. Start dev server: `yarn dev`.
2. Values come from `public/env.js`:

```js
(function () {
  window.__ENV__ = Object.freeze({ TEST_ENV_VALUE: 'test_build' });
})();
```

### Build + inject for a specific environment

1. Build once: `yarn build` (produces `dist/`).
2. Provide an input file named `<environment>.env.js` either in project root or `scripts/`.
   - Format (ESM):

```js
export default {
  TEST_ENV_VALUE: 'value-for-this-env',
};
```

3. Inject: `node scripts/replaceEnv.js <environment>`
   - The script looks for `<environment>.env.js` in the repo root, then `scripts/`.
   - It writes `dist/env.js` with `window.__ENV__` frozen at those values.
4. Serve the built app (e.g., `yarn preview` or your static host/CDN). No rebuild is needed to change environments—just rewrite `dist/env.js`.

### Using env in code

```ts
// src/config/env.ts already exports a typed env
import { env } from './config/env';

console.log(env.TEST_ENV_VALUE);
```

Adding new keys:
- Extend the `Env` type in `src/config/env.ts`.
- Include the new key in each `<environment>.env.js` and in `public/env.js`.

### CI/CD recipe (GitHub Actions example)

Use a unique identifier per deploy (commit SHA, PR number, branch). Example step to inject runtime config just before upload/serve:

```yaml
- name: Build
  run: yarn install --frozen-lockfile && yarn build

- name: Generate env for this deploy
  env:
    API_BASE_URL: ${{ secrets.API_BASE_URL }}
  run: |
    cat > "${GITHUB_SHA}.env.js" <<'EOF'
    export default {
      TEST_ENV_VALUE: '${API_BASE_URL}',
    };
    EOF

- name: Inject runtime env
  run: node scripts/replaceEnv.js "${GITHUB_SHA}"

# Upload or serve the contents of dist/ afterwards
```

Notes:
- You can use any `<environment>` token (e.g., `pr-123`). Just name the file `pr-123.env.js` and pass `pr-123` to the script.
- For static hosting/CDNs, ensure `dist/env.js` is uploaded and not overly cached. Consider short TTL or cache-busting when changing environments.

### Why this instead of `import.meta.env`?

Vite’s `import.meta.env` is compile-time. This POC defers configuration to runtime, enabling a *single build artifact to be re-used across environments, including ephemeral ones.*

### Guarantees and caveats

- `window.__ENV__` must exist before the app starts. `index.html` includes `env.js` first, and `src/config/env.ts` uses a non-null assertion.
- Values must be JSON-serializable. They are embedded via `JSON.stringify` into `dist/env.js`.
- Do not import `public/env.js` directly in code; it is loaded as a plain script.

# devjs-POC
