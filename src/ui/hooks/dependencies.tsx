import { useEffect, useState, useCallback } from 'react';

export type Check = {
  checked: boolean;
  has: boolean;
  recheck: Function;
};
export type Gateway = {
  allChecksPassed: boolean;
};
type CheckName = 'hasDotnet' | 'hasSteamCmd' | 'hasOmniSharp';


export const useDependencyGateway = (checks: Check[]): Gateway => {
  return {
    allChecksPassed: checks.every(check => check.checked && check.has),
  };
};

export const useDependencyCheck = (name: CheckName): Check => {
  const [checked, setChecked] = useState<boolean>(false);
  const [has, setHas] = useState<boolean>(false);

  const check = useCallback(() => {
    window.electronAPI[name]()
      .then(result => {
        setHas(result);
      }).catch(() => {
        setChecked(true);
      }).finally(() => {
        setChecked(true);
      });
  }, [window.electronAPI]);

  useEffect(() => {
    if (!checked) {
      check();
    }
  }, [check, checked]);

  if (checked) {
    console.info(`${name}: ${has}`)
  }

  return { checked, has, recheck: check };
};
