import React from 'react';
import { intersection, uniq } from 'lodash';
import { useRootValue } from './root-values';
import { GrantedAuthority } from '../../services/types/atm-user';
import { GetUsersCurrent } from '../../layouts/main';

const getBackAndWhiteList = (auths?: string | string[]) => {
  let authList = auths || [];
  if (typeof authList === 'string') {
    authList = [authList];
  }
  const blackList = authList.filter((auth) => auth.trim().startsWith('!')).map((role) => role.slice(1));
  const whiteList = authList.filter((role) => !role.trim().startsWith('!'));

  return {
    blackList,
    whiteList,
  };
};

export const hasAuth = (auths: string | string[] = [], authorities: GrantedAuthority[]) => {
  const rules = getBackAndWhiteList(auths);
  if (rules.blackList.length + rules.whiteList.length === 0) {
    return true;
  }

  const myRules = uniq(
    authorities
      .map((x) => x.authority)
      // @ts-expect-error
      .reduce((acc: string[], name: string) => {
        if (name.startsWith('ROLE_')) {
          acc.push(name.slice('ROLE_'.length));
        }
        acc.push(name);
        return acc;
      }, [])
  );

  if (intersection(rules.blackList, myRules).length) {
    return false;
  }
  if (!rules.whiteList.length) {
    return true;
  }

  return !!intersection(rules.whiteList, myRules).length;
};

/**
 * @param auths 允许 ['ROLE_USER', '!ROLE_TEACHER']
 */
export default function useUserAuth(auths?: string | string[]): boolean {
  const [user] = useRootValue(GetUsersCurrent);

  return React.useMemo(() => {
    if (!user || !user?.authorities) {
      return false;
    }
    return hasAuth(auths, user.authorities);
  }, [user, auths]);
}

// @ts-expect-error
export const IfUserAuth: React.FC<{ auths?: string | string[]; fallback?: React.ReactNode }> = ({
  fallback = null,
  auths,
  children,
}) => {
  const passed = useUserAuth(auths);
  return passed ? children : fallback;
};
