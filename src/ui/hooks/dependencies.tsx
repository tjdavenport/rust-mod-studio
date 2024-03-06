import { OxideTags } from '../../shared';
import { useEffect, useState, useCallback } from 'react';

export const useOxideRustUpdater = () => {
  const [failed, setFailed] = useState<boolean>(false);
  const [working, setWorking] = useState<boolean>(false);

  const update = useCallback(async () => {
    setWorking(true);

    return window.mainDeps.updateOxide()
      .then((success) => {
        if (!success) {
          setFailed(true);
        }
        return setWorking(false);
      }).catch(() => {
        setFailed(true);
        setWorking(false);
      });
  }, []);

  return {
    failed,
    working,
    update,
  };
};

export const useOxideRustTags = () => {
  const [tags, setTags] = useState<OxideTags>({
    latestAsset: '',
    artifact: ''
  });
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const refresh = useCallback(() => {
    setRefreshing(true);
    window.mainDeps.getOxideTags()
      .then((tags: OxideTags) => {
        setTags(tags);
        setRefreshing(false);
      });
  }, []);

  useEffect(() => {
    setInterval(() => {
      refresh();
    }, 1000 * 60 * 5);

    refresh();
  }, []);

  return { tags, refresh, refreshing };
};
