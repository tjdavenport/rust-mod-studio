import { DependencyState } from '../../shared';
import { useEffect, useState, useCallback } from 'react';

export const useDependencyState = () => {
  const [dependencyState, setDependencyState] = useState<DependencyState | null>(null);
  const loadState = useCallback(() => {
    window.deps.getState().then((state) => {
      setDependencyState(state);
    });
  }, [setDependencyState]);

  useEffect(() => {
    loadState();
  }, []);

  return { dependencyState, loadState };
};
