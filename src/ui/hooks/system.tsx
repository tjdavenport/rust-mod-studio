import { useEffect, useState } from 'react';

export const usePlatform = () => {
  const [platform, setPlatform] = useState<string | null>(null);

  useEffect(() => {
    window.system.getPlatform()
      .then(platform => {
        setPlatform(platform);
      });
  }, []);

  return platform;
};
