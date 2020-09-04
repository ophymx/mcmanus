/**
 * Delay value of the previous promise.
 *
 * @param timeout Delay time in milliseconds.
 */
export function delayValue<T>(timeout: number): (value: T) => Promise<T> {
  return (value: T) => delay(timeout)
    .then(() => value)
}

/**
 * Delay for given time.
 *
 * @param timeout Delay time in milliseconds.
 */
export function delay(timeout: number): Promise<void> {
  return new Promise((r) => setTimeout(r, timeout));
}

/**
 * Retry a promise.
 *
 * @param fn Promise factory to retry.
 * @param maxRetry Maximum number of retry attempts.
 * @param delayTimeout Time between attempts, in milliseconds.
 * @param isRetry Predicate to test error is retriable.
 */
export function retry<T>(
  fn: () => Promise<T>,
  maxRetry: number,
  delayTimeout: number,
  isRetry: (reason: any) => boolean
): Promise<T> {
  return fn()
    .catch((err) => {
      if (isRetry(err) && maxRetry > 0) {
        return delay(delayTimeout)
          .then(() => retry(fn, maxRetry - 1, delayTimeout, isRetry));
      }
      return Promise.reject(err);
    });
}
