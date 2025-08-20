// src/config/env.ts
type Env = {
    TEST_ENV_VALUE: string;
};

declare global {
  interface Window { __ENV__?: Env }
}

export const env = window.__ENV__!;