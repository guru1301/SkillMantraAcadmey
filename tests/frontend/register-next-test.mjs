import { createRequire, register } from 'node:module';

register('./loader-hooks.mjs', import.meta.url);

// Also intercept CommonJS require() used by tsx when package.json has no "type": "module"
const require = createRequire(import.meta.url);
const Module = require('node:module');
const origLoad = Module._load;

const mockNextCache = {
  revalidatePath() {},
  revalidateTag() {},
  unstable_cache(fn) {
    return fn;
  },
};

const mockNextHeaders = {
  async cookies() {
    const map = globalThis.__TEST_COOKIES__ || {};
    return {
      get(name) {
        return map[name] !== undefined ? { name, value: map[name] } : undefined;
      },
      getAll() {
        return Object.entries(map).map(([name, value]) => ({ name, value }));
      },
      set() {},
      delete() {},
    };
  },
  async headers() {
    return new Headers();
  },
};

Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'next/cache') return mockNextCache;
  if (request === 'next/headers') return mockNextHeaders;
  return origLoad.apply(this, arguments);
};
