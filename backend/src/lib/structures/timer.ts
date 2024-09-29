import type { SessionData } from '../validators/session';

export class Timers {
  // POMODORO CONSTANTS (MS)
  public static POMODORO_WORK = 25 * 60 * 1000;
  public static POMODORO_SHORT_BREAK = 5 * 60 * 1000;
  public static POMODORO_LONG_BREAK = 15 * 60 * 1000;

  public static POMODORO_TIME_MAP: Record<SessionData['status'], number> = {
    active: Timers.POMODORO_WORK,
    break: Timers.POMODORO_SHORT_BREAK,
    'long-break': Timers.POMODORO_LONG_BREAK,
    finished: 0,
  };

  // CONSTANTS
  public static ONE_MINUTE = 60 * 1000;

  public static cache = new Map<string, NodeJS.Timer>();

  public static getDurationTimestamp(
    duration: number,
    current: number | null = null
  ) {
    if (!current) {
      current = Date.now();
    }

    return current + duration;
  }

  public static queue(id: string, cb: CallableFunction, time: number) {
    const timer = setTimeout(() => {
      cb();
      this.cache.delete(id);
    }, time);

    this.cache.set(id, timer);

    return timer;
  }

  public static dequeue(id: string) {
    if (this.cache.has(id)) {
      clearTimeout(this.cache.get(id));
      this.cache.delete(id);
    }
  }

  public static countDown(
    id: string,
    duration: number,
    callback: (timeLeft: number) => any
  ) {
    const interval = setInterval(() => {
      duration -= 1;
      callback(duration);

      if (duration <= 0) {
        clearInterval(interval);
        this.cache.delete(id);
      }
    }, 1000);

    this.cache.set(id, interval);

    return () => {
      clearInterval(interval);
      this.cache.delete(id);
    };
  }
}
