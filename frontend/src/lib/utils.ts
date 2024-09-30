import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import axios from 'axios';
import { intervalToDuration } from 'date-fns';
import type { SessionData } from './validators/session';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetcher = axios.create({
  baseURL: '/api',
});

export const toDurationReadable = (duration: number) => {
  const interval = intervalToDuration({
    start: 0,
    end: duration,
  });

  const keys = [];

  if (!interval.minutes) return '0m';

  if (interval.hours) {
    keys.push(`${interval.hours}h`);
  }

  if (interval.minutes) {
    keys.push(`${interval.minutes}m`);
  }

  return keys.join(' ');
};

export const pad = (num: number, len = 2) => {
  return num.toString().padStart(len, '0');
};

// convert to mm:ss or hh:mm:ss
export const toDurationTime = (duration: number) => {
  const interval = intervalToDuration({
    start: 0,
    end: duration,
  });

  if (interval.hours) {
    return `${pad(interval.hours)}:${pad(interval.minutes ?? 0)}:${pad(
      interval.seconds ?? 0
    )}`;
  }

  return `${pad(interval.minutes ?? 0)}:${pad(interval.seconds ?? 0)}`;
};

export const calculateXP = (level: number) => {
  return Math.floor((level / 0.3) ** 2);
};

export const getStatusColor = (
  status: SessionData['status'],
  timerState?: SessionData['timerState']
) => {
  if (timerState === 'stopped') {
    return {
      background: 'bg-teal-500',
      text: 'text-white',
    };
  }

  switch (status) {
    case 'active':
      return {
        background: 'bg-red-500',
        text: 'text-white',
      };

    case 'break':
      return {
        background: 'bg-yellow-500',
        text: 'text-black',
      };

    case 'long-break':
      return {
        background: 'bg-blue-500',
        text: 'text-white',
      };

    case 'finished':
      return {
        background: 'bg-green-500',
        text: 'text-white',
      };
  }
};
