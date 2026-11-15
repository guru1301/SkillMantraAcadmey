import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SRC_DIR = path.resolve(process.cwd(), 'src');

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'next/cache' || specifier === 'next/headers') {
    return {
      shortCircuit: true,
      url: `mock-next:${specifier}`,
    };
  }
  if (specifier.startsWith('@/')) {
    const sub = specifier.slice(2);
    return nextResolve(pathToFileURL(path.join(SRC_DIR, sub)).href, context);
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url === 'mock-next:next/cache') {
    return {
      shortCircuit: true,
      format: 'module',
      source: `
        export function revalidatePath() {}
        export function revalidateTag() {}
        export function unstable_cache(fn) { return fn; }
      `,
    };
  }

  if (url === 'mock-next:next/headers') {
    return {
      shortCircuit: true,
      format: 'module',
      source: `
        export async function cookies() {
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
        }
        export async function headers() {
          return new Headers();
        }
      `,
    };
  }

  return nextLoad(url, context);
}

