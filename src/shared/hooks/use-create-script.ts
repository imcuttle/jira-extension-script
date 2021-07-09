import { useLayoutEffect, useState } from 'react';

export const createScript = (url: string, otherAttributes?: any) => {
  const script = document.createElement('script');
  if (url) {
    script.src = url;
    if (otherAttributes && Object.keys(otherAttributes).length) {
      Object.keys(otherAttributes).forEach((attribute) => {
        script.setAttribute(attribute, otherAttributes[attribute]);
      });
    }
  }
  document.head.appendChild(script);

  const p = new Promise((resolve, reject) => {
    script.onload = () => {
      resolve(true);
    };
    script.onerror = (error) => {
      reject(error);
    };
  });

  // @ts-expect-error
  p.cancel = () => {
    document.head.removeChild(script);
  };

  return p;
};

/**
 * 动态加载script标签
 * @param url
 * @param otherAttributes
 */
const useCreateScript = (
  url: string | undefined,
  otherAttributes?: { [x: string]: string }
): [boolean, string | Event] => {
  const [loadState, setLoadState] = useState<boolean>(false);

  const [error, setError] = useState<string | Event>('');

  useLayoutEffect(() => {
    if (url) {
      const p = createScript(url, otherAttributes);
      p.then(
        () => {
          setLoadState(true);
        },
        (err) => {
          setError(err);
        }
      );
      // @ts-expect-error
      return p.cancel;
    }
  }, [url, otherAttributes]);

  return [loadState, error];
};

export default useCreateScript;
