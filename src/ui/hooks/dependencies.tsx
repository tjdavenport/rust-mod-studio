import { useEffect, useState, useCallback, useRef } from 'react';
import { OxideTags, ProcessStatus, DependencyName } from '../../shared';

export const useOxideRustUpdater = () => {
  const [failed, setFailed] = useState<boolean>(false);
  const [working, setWorking] = useState<boolean>(false);

  const update = useCallback(async () => {
    setWorking(true);

    return window.mainDeps.updateOxide()
      .then((success) => {
        setFailed(!success);
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

export const getLogsEl = () => {
  return window.document.getElementById('rust-dedicated-output') as HTMLTextAreaElement;
};
export const useRustDedicatedLogWriter = () => {
  useEffect(() => {
    const off = window.mainDeps.onRustDedicatedStdout((outStr: string) => {
      const logsEl = getLogsEl();
      logsEl.value += outStr;
    });

    return () => {
      off();
    };
  }, []);
};

type RustDedicatedControllerOptions = {
  onRustDedicatedStdout?: (outStr: string) => void;
};
export const useRustDedicatedController = ({ onRustDedicatedStdout }: RustDedicatedControllerOptions) => {
  useEffect(() => {
    if (onRustDedicatedStdout) {
      const off = window.mainDeps.onRustDedicatedStdout(onRustDedicatedStdout);

      return () => {
        off();
      };
    }
  }, []);

  const start = useCallback(() => {
    return window.mainDeps.startRustDedicated();
  }, []);

  const stop = useCallback(() => {
    return window.mainDeps.stopRustDedicated();
  }, []);

  return { start, stop };
};

type Statuses = {
  rustDedicated: ProcessStatus,
  steamCMD: ProcessStatus,
};
export const statuses: Statuses = {
  rustDedicated: ProcessStatus.Stopped,
  steamCMD: ProcessStatus.Stopped,
};

export const useStatusMonitor = (name: DependencyName) => {
  const [status, setStatus] = useState<ProcessStatus>(statuses.rustDedicated);

  useEffect(() => {
    const off = window.mainDeps.onProcessStatus((event) => {
      if (event.name === name) {
        setStatus(event.status);
      }
    });

    window.mainDeps.getProcessStatus(name)
      .then((newStatus: ProcessStatus) => {
        setStatus(newStatus);
      });

    return () => {
      off();
    };
  }, []);

  return status;
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
