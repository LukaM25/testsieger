import { render, screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import AnimateOnView from '../components/AnimateOnView';
import React from 'react';

// Simple mock for IntersectionObserver so component runs without error in jsdom
class MockIO {
  cb: any;
  constructor(cb: any) {
    this.cb = cb;
  }
  observe() {
    // emulate immediate intersection
    this.cb([{ isIntersecting: true }], this);
  }
  unobserve() {}
  disconnect() {}
}

(global as any).IntersectionObserver = function (cb: any) {
  return new MockIO(cb) as any;
};

test('AnimateOnView sets data-revealed when intersecting', async () => {
  render(
    <AnimateOnView>
      <div data-testid="child">Hello</div>
    </AnimateOnView>
  );

  const wrapper = screen.getByTestId('child').parentElement as HTMLElement;
  expect(wrapper.getAttribute('data-revealed')).toBe('true');
});
