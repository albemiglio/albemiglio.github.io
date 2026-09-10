import { layoutRect } from '../src/scene/math';

// jsdom reports 0 for every offset*, so the box is stubbed: the point under test is that
// layoutRect reads LAYOUT geometry (offset*) and never the painted box, which on the device
// frame carries the handoff matrix and would feed the projection its own output.
function stub(el: HTMLElement, box: { left: number; top: number; w: number; h: number }) {
  Object.defineProperties(el, {
    offsetLeft: { value: box.left, configurable: true },
    offsetTop: { value: box.top, configurable: true },
    offsetWidth: { value: box.w, configurable: true },
    offsetHeight: { value: box.h, configurable: true },
  });
}

test('measures the layout box against the offset parent, ignoring the element transform', () => {
  const parent = document.createElement('div');
  const el = document.createElement('div');
  parent.appendChild(el);
  document.body.appendChild(parent);
  Object.defineProperty(el, 'offsetParent', { value: parent, configurable: true });
  parent.getBoundingClientRect = () => ({ x: 100, y: 200, width: 600, height: 400, top: 200, left: 100, right: 700, bottom: 600, toJSON: () => ({}) }) as DOMRect;
  stub(el, { left: 20, top: 30, w: 520, h: 325 });

  // A wild matrix on the element must not move the answer: offset* are layout values.
  el.style.transform = 'matrix3d(1.4,0.3,0,0.0004,0,1.2,0,0,0,0,1,0,80,-40,0,1)';
  expect(layoutRect(el)).toEqual({ x: 120, y: 230, w: 520, h: 325 });

  el.style.transform = '';
  expect(layoutRect(el)).toEqual({ x: 120, y: 230, w: 520, h: 325 });
  parent.remove();
});

test('falls back to the parent element when there is no offset parent', () => {
  const parent = document.createElement('div');
  const el = document.createElement('div');
  parent.appendChild(el);
  Object.defineProperty(el, 'offsetParent', { value: null, configurable: true });
  parent.getBoundingClientRect = () => ({ x: 5, y: 7, width: 0, height: 0, top: 7, left: 5, right: 5, bottom: 7, toJSON: () => ({}) }) as DOMRect;
  stub(el, { left: 1, top: 2, w: 10, h: 20 });
  expect(layoutRect(el)).toEqual({ x: 6, y: 9, w: 10, h: 20 });
});
