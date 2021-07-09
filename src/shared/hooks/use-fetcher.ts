/* eslint-disable */
import React from 'react';
// @ts-ignore
import isShallowEqual from 'shallowequal';
import useUncontrolled from '@rcp/use.uncontrolled';
import useForceUpdate from './use-forceupdate';
import { useReplacedValue } from './use-replacer';

type UnControlledOptions = Parameters<typeof useUncontrolled>[0];
export type TFetcher<R = any, T extends any[] = any[]> = R | ((...args: T) => Promise<R> | R);

export type TFetcherEntity<T> = {
  initialized: boolean;
  res: T;
  setResponse?: (value: T) => void;
  loading: boolean;
  error: any;
  fetch: () => Promise<TFetcherEntity<T>>;
  forceUpdate: () => void;
};

export type TFetcherResult<T> = [T, (newVal: T | ((oldValue: T) => T)) => void, TFetcherEntity<T>];
export type TFetcherOptions<T = any> = {
  onChange?: UnControlledOptions['onChange'];
  data?: T;
  defaultData?: T;
  suspense?: boolean;
  key?: any;
  catchError?: boolean;
};

const cache = new Map<any[], Promise<any> | any[]>();

export default function useFetcher<T, ARG extends any>(
    // @ts-ignore
    getter: TFetcher<T, ARG>,
    { data, defaultData, key, catchError = false, onChange, suspense }: TFetcherOptions<T> = {},
    // @ts-ignore
    deps: ARG = []
): TFetcherResult<T> {
  const fetcher = useReplacedValue<any, TFetcher>(key || getter);
  const [val, setVal] = useUncontrolled<T>({
    value: data,
    defaultValue: typeof fetcher !== 'function' ? fetcher : defaultData,
    useEffect: React.useEffect,
    onChange,
  });

  const initializedRef = React.useRef(false);
  const isLoadingRef = React.useRef(!suspense);
  const errorRef = React.useRef(null);
  const fetchRef = React.useRef(() => {});
  const forceUpdateRef = React.useRef(() => {});
  const [_forceUpdate, v] = useForceUpdate();
  const forceUpdate = (forceUpdateRef.current = _forceUpdate);

  const getResult = React.useCallback(
      (overwriteProps?) => {
        const entity = {
          initialized: initializedRef.current,
          res: val,
          setResponse: setVal,
          loading: isLoadingRef.current,
          error: errorRef.current,
          fetch: fetchRef.current,
          forceUpdate,
          ...overwriteProps,
        };
        return [entity.res, entity.setResponse, entity] as TFetcherResult<T>;
      },
      [v, val, forceUpdate, setVal]
  );

  const fetch = React.useCallback(async () => {
    if (typeof fetcher !== 'function') {
      return getResult();
    }

    let updated = false
    try {
      if (!isLoadingRef.current) {
        isLoadingRef.current = true;
        !suspense && forceUpdate();
      }
      // @ts-ignore
      const data = await fetcher(...deps);
      initializedRef.current = true;
      errorRef.current = null;
      isLoadingRef.current = false;
      // trigger update
      !suspense && setVal(data);
      updated = true
      return getResult({ res: data });
    } catch (error) {
      //
      errorRef.current = error;
      if (!catchError) {
        if (suspense) {
          console.error(error);
        }
        throw error;
      }
    } finally {
      isLoadingRef.current = false;
      !updated && !suspense && forceUpdate();
    }

    return getResult();
    // @ts-ignore
  }, [suspense, fetcher, forceUpdate, ...deps, setVal]);
  fetchRef.current = fetch;

  let currentKey = React.useMemo(() => key || [deps, fetcher], [key || deps, deps, fetcher]);

  React.useLayoutEffect(() => {
    return () => {
      if (suspense) {
        cache.delete(currentKey);
      }
    };
  }, [suspense, currentKey, cache]);

  if (suspense) {
    if (!Array.isArray(currentKey)) {
      currentKey = [currentKey];
    }
    // @ts-ignore
    for (let [eachKey, promiseOrEntity] of cache.entries()) {
      if (!Array.isArray(eachKey)) {
        eachKey = [eachKey];
      }
      // @ts-ignore
      const isMatched = eachKey.every((eachK, i) => isShallowEqual(eachK, currentKey[i]));
      if (isMatched) {
        if (promiseOrEntity && typeof (promiseOrEntity as any).then === 'function') {
          throw promiseOrEntity;
        }
        // resolved
        return (promiseOrEntity as any).slice();
      }
    }

    const fetchPromise = fetch().then(result => {
      // suspense 模式下的更新，走的同一份引用
      // todo: 暂不支持 suspense 模式下的更新
      const [v, set, ent] = result;
      const resRef = { current: v };

      Object.defineProperty(ent, 'res', {
        get() {
          return resRef.current;
        },
      });
      Object.defineProperty(ent, 'setResponse', {
        get() {
          return (newV: any) => {
            throw new Error('suspense 模式下，目前不支持 set 更新数据');

            // if (typeof newV === 'function') {
            //   newV = newV(ent.res);
            // }
            // if (ent.res !== newV) {
            //   resRef.current = newV;
            //   forceUpdateRef.current();
            // }
          };
        },
      });

      // let originFetch = ent.fetch;
      ent.fetch = async (...args) => {
        throw new Error('suspense 模式下，目前不支持 fetch 更新数据');
        // const result = (await originFetch(...args)) as any;
        // Object.assign(ent, omit(result[2], 'setResponse', 'res', 'forceUpdate'));
        // ent.setResponse!(result[2].res);
        // return result;
      };

      // @ts-ignore
      cache.set(
          currentKey,
          Object.defineProperty([null, ent.setResponse, ent], '0', {
            get: () => ent.res,
          })
      );
    });
    cache.set(currentKey, fetchPromise);
    throw fetchPromise;
  }

  React.useEffect(() => {
    if (!suspense) {
      fetch();
    }
    // @ts-ignore
  }, [...deps, suspense]);

  return getResult();
}
