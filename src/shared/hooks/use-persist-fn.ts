// @ts-nocheck
import { useRef } from 'react';

type Noop = (...args: any[]) => any;
const noop: Noop = () => {};

function usePersistFn<T extends Noop>(fn?: T = noop): T {
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  const persistFn = useRef<T>();
  if (!persistFn.current) {
    persistFn.current = function (...args) {
      // @ts-expect-error
      return fnRef.current.apply(this, args);
    } as T;
  }

  return persistFn.current;
}

export default usePersistFn;
