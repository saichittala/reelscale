import { useState, useEffect } from "react";

function parseStoredValue<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    // Fallback if saved as raw string without JSON quotes
    return (raw as unknown) as T;
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Initialize with initialValue for SSR consistency
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Read from localStorage immediately after client mount (fixes SSR hydration reset)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(parseStoredValue(item, initialValue));
      }
    } catch (error) {
      console.warn("Error reading localStorage key", key, error);
    }
  }, [key, initialValue]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn("Error setting localStorage key", key, error);
    }
  };

  return [storedValue, setValue];
}
