import { useRootValue } from './root-values';
// eslint-disable-next-line import/no-cycle
import { GetUsersCurrent } from '../../layouts/main';

export function useCurrentUser() {
  return useRootValue(GetUsersCurrent);
}

export function usePhaseSubjectId() {
  const [user] = useCurrentUser();
  return {
    phase: user?.teacher?.phase,
    subjectId: user?.teacher?.subject?.id,
  };
}
