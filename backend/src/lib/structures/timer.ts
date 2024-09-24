export class Timers {
  // POMODORO CONSTANTS (MS)
  public static POMODORO_WORK = 25 * 60 * 1000;
  public static POMODORO_SHORT_BREAK = 5 * 60 * 1000;
  public static POMODORO_LONG_BREAK = 15 * 60 * 1000;

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
}
