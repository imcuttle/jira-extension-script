// eslint-disable-next-line max-classes-per-file
import useUncontrolled from '@rcp/use.uncontrolled';
import { isEqual, uniqId } from 'lodash';
import React, { useRef } from 'react';

import usePersistFn from '../use-persist-fn';
import useForceUpdate from '../use-forceupdate';
import {EventEmitter} from "events";

// eslint-disable-next-line max-classes-per-file
export abstract class Storage<V = any> {
  protected abstract _read(key: any): string;

  protected abstract _write(key: any, val: string | null, rawValue?: V): void;

  public abstract readAll(): any;

  protected abstract serializable: ISerializable<V>;

  public initialValue: any;

  public read(key: any): V | undefined {
    try {
      // eslint-disable-next-line no-underscore-dangle
      const value = this.serializable.deserialize(this._read(key));

      if (this.initialValue != null) {
        if (typeof this.initialValue === 'boolean') {
          return !!value as any;
        }
        if (value != null && typeof this.initialValue === 'number') {
          return Number(value) as any;
        }
        if (value != null && typeof this.initialValue === 'string') {
          return String(value) as any;
        }
      }

      return value;
    } catch (err) {
      console.error(err);
    }
  }

  public write(key: any, val: V | null) {
    try {
      if (val == null) {
        // @ts-expect-error
        // eslint-disable-next-line no-underscore-dangle
        return this._write(key, val);
      }

      // eslint-disable-next-line no-underscore-dangle
      this._write(key, this.serializable.serialize(val), val);
    } catch (err) {
      console.error(err);
      return false;
    }
  }
}

export interface ISerializable<V> {
  serialize: (val: V) => string;
  deserialize: (val: string) => V;
}

export const useStorageSync = <T>(
  key: string | undefined,
  initialValue: T,
  {
    disabled,
    storageCreator,
    storageCreatorDeps = [],
    eq = isEqual,
    ...opts
  }: Parameters<typeof useUncontrolled>[0] & {
    storageCreator?: (...arg: any[]) => Storage;
    storageCreatorDeps?: any[];
    disabled?: boolean;
  } = {}
): [T, (newValue: T | ((value: T) => T)) => void] => {
  const eqFn = usePersistFn(eq);
  const condRef = useRef<any>(null);
  /* eslint-disable react-hooks/rules-of-hooks */
  // 以下判断条件只能写死 key || disabled
  if (!key || disabled) {
    if (condRef.current === 'enable') {
      throw new Error('useStorageSync 不能动态关闭');
    }

    condRef.current = 'disable';
    return useUncontrolled<T>({
      // @ts-expect-error
      defaultValue: initialValue,
      eq: eqFn,
      ...opts,
    });
  }

  if (condRef.current === 'disable') {
    throw new Error('useStorageSync 不能动态开启');
  }
  condRef.current = 'enable';
  const storageCreatorFn = usePersistFn(storageCreator);
  const storage = React.useMemo(() => {
    const storage = storageCreatorFn(...storageCreatorDeps);
    storage.initialValue = initialValue;
    return storage;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue, ...storageCreatorDeps]);

  const readValue = React.useMemo(() => storage.read(key), [key, storage]);
  // const remove = usePersistFn(() => {
  //   storage.write(key, null);
  // });
  // 暂时去除该逻辑，会影响微前端跳转
  // React.useLayoutEffect(() => {
  //   return remove;
  // }, [remove]);

  // @ts-ignore
  const [v, setVal] = useUncontrolled<T>({
    ...opts,
    eq: eqFn,
    // defaultValue: storage.read(key) || initialValue,
    value: readValue || initialValue,
  });
  const initRef = React.useRef(false);
  React.useLayoutEffect(() => {
    initRef.current = false;
  }, [readValue]);

  React.useLayoutEffect(() => {
    // if (!initRef.current) {
    if (v !== initialValue && opts.onChange) {
      opts.onChange(v);
    }
    // eslint-disable-next-line
  }, []);

  React.useLayoutEffect(() => {
    // 第一次的时候不进行写
    if (!initRef.current) {
      initRef.current = true;
      return;
    }
    if (!eqFn(storage.read(key), v)) {
      storage.write(key, v);
    }
  }, [eqFn, storage, key, v]);

  return [v, setVal];
};

type RegisteredStateSyncOptions = Parameters<typeof useUncontrolled>[0] & { disabled?: boolean };

export class JSONSerializable<V> implements ISerializable<V> {
  deserialize(val: string): V {
    let result: any = val;
    [
      (v) => JSON.parse(v),
    ].some((getVal) => {
      try {
        result = getVal(val);
        return true;
      } catch (e) {
        return false;
      }
    });
    return result;
  }

  serialize(val: V): string {
    return JSON.stringify(val);
  }
}

export class StorageArea<V> extends Storage<V> {
  public readAll() {
    return { ...this.storageArea };
  }

  // eslint-disable-next-line no-underscore-dangle
  protected _read(key?: any): string | any {
    return this.readAll()[key];
  }

  // eslint-disable-next-line no-underscore-dangle
  protected _write(key: any, str: any): void {
    if (str == null) {
      this.storageArea.removeItem(key);
    } else {
      this.storageArea.setItem(key, str);
    }
  }

  constructor(
    public storageArea: typeof localStorage = localStorage,
    protected serializable: ISerializable<V> = new JSONSerializable<V>()
  ) {
    super();
  }
}

export function useLocalStorageStateSync<T>(
  key: string,
  initialValue: T,
  { storage = window.localStorage, ...opts }: RegisteredStateSyncOptions & { storage?: typeof window.localStorage } = {}
) {
  const [forceUpdate, v] = useForceUpdate();

  React.useEffect(() => {
    const handle = (evt: StorageEvent) => {
      if (evt.key === key && evt.storageArea === storage) {
        forceUpdate();
      }
    };
    window.addEventListener('storage', handle);
    return () => window.removeEventListener('storage', handle);
  }, [key, forceUpdate, storage]);

  return useStorageSync<T>(key, initialValue, {
    ...opts,
    storageCreator: (storage) => new StorageArea(storage),
    // 触发 storageCreator 创建，重新进行 read 赋值
    storageCreatorDeps: [storage, v],
  });
}
