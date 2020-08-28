export interface RetryError {
  reason: any
  retry?: boolean
}

/**
 * 
 * @param fn Promise factory to retry.
 * @param maxRetry Maximum number of retry attempts.
 * @param delay Time between attempts.
 * @param isRetry Predicate to test error is retriable.
 */
export default function promiseRetry<T>(
  fn: () => Promise<T>,
  maxRetry: number,
  delay: number,
  isRetry: (reason: any) => boolean
): Promise<T> {
  return fn()
    .catch((err) => {
      if (isRetry(err) && maxRetry > 0) {
        return new Promise((r) => setTimeout(r, delay))
          .then(() => promiseRetry(fn, maxRetry - 1, delay, isRetry));
      }
      return Promise.reject(err);
    });
}