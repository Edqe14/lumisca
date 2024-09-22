import { useEffect, useState } from 'react';

export const Time = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    let cleared = false;

    const update = () => {
      setCurrentTime(new Date());

      if (!cleared) setTimeout(update, 1000);
    };

    const initialTimeoutMs = 1000 - new Date().getMilliseconds();

    timeout = setTimeout(() => {
      update();
    }, initialTimeoutMs);

    return () => {
      clearTimeout(timeout);
      cleared = true;
    };
  }, []);

  return currentTime.toLocaleTimeString();
};
