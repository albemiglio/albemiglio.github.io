import '@testing-library/jest-dom/vitest';

class IntersectionObserverStub {
  constructor(private cb: IntersectionObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
  trigger(entries: Partial<IntersectionObserverEntry>[]) {
    this.cb(entries as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
  }
}
Object.defineProperty(globalThis, 'IntersectionObserver', { value: IntersectionObserverStub, writable: true });

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(globalThis, 'ResizeObserver', { value: ResizeObserverStub, writable: true });

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false; },
  }),
});
