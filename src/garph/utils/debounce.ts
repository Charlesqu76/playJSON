/**
 * Creates a debounced version of the provided function.
 *
 * @template T The type of the function to be debounced
 * @param {T} func The function to debounce
 * @param {number} wait The number of milliseconds to wait before invoking the function
 * @param {boolean} [immediate=false] Whether to invoke the function immediately on the first call
 * @returns {T & { cancel(): void }} A debounced version of the function with a cancel method
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): T & { cancel(): void } {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const debounced = function (this: any, ...args: Parameters<T>) {
    const context = this;

    // Clear the previous timeout
    if (timeout !== null) {
      clearTimeout(timeout);
    }

    // If immediate is true and no timeout exists, invoke the function immediately
    if (immediate && timeout === null) {
      func.apply(context, args);
      timeout = setTimeout(() => {
        timeout = null;
      }, wait);
    } else {
      // Otherwise, set a new timeout
      timeout = setTimeout(() => {
        timeout = null;
        func.apply(context, args);
      }, wait);
    }
  } as T & { cancel(): void };

  // Add a cancel method to allow cancelling the debounced function
  debounced.cancel = () => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

export default debounce;
