import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getUserStorageKey } from '../state/userStorageScope';

const normalizeStoredValue = <T,>(value: unknown, fallback: T): T => {
  if (value === null || value === undefined) return fallback;

  if (Array.isArray(fallback)) {
    return Array.isArray(value) ? (value as T) : fallback;
  }

  if (typeof fallback === 'object' && fallback !== null) {
    return (value && typeof value === 'object' ? (value as T) : fallback);
  }

  return (value as T) ?? fallback;
};

function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const scopedKey = getUserStorageKey(key);
  const initialValueRef = useRef(initialValue);

  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValueRef.current;
    }

    try {
      const item = window.localStorage.getItem(scopedKey);
      if (!item) {
        return initialValueRef.current;
      }

      const parsed = JSON.parse(item);
      return normalizeStoredValue(parsed, initialValueRef.current);
    } catch (error) {
      console.warn(`Error reading localStorage key "${scopedKey}":`, error);
      return initialValueRef.current;
    }
  }, [scopedKey]);

  const [storedValue, setStoredValue] = useState<T>(readValue);
  const isUpdateFromWithin = useRef(false);

  const setValue: React.Dispatch<React.SetStateAction<T>> = useCallback(
    (value) => {
      try {
        setStoredValue((currentValue) => {
          const valueToStore = value instanceof Function ? value(currentValue) : value;

          if (typeof window !== 'undefined') {
            const safeValue = normalizeStoredValue(valueToStore, initialValueRef.current);
            window.localStorage.setItem(scopedKey, JSON.stringify(safeValue));

            isUpdateFromWithin.current = true;
            window.dispatchEvent(new StorageEvent('storage', {
              key: scopedKey,
              newValue: JSON.stringify(safeValue),
              storageArea: window.localStorage,
            }));
            isUpdateFromWithin.current = false;
          }

          return valueToStore;
        });
      } catch (error) {
        console.error(`Error setting localStorage key "${scopedKey}":`, error);
      }
    },
    [scopedKey]
  );

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === scopedKey && event.newValue) {
        if (isUpdateFromWithin.current) return;

        try {
          const newValue = JSON.parse(event.newValue);
          setStoredValue(normalizeStoredValue(newValue, initialValueRef.current));
        } catch (error) {
          console.error(`Error parsing storage change for key "${scopedKey}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [scopedKey]);

  useEffect(() => {
    setStoredValue(readValue());
  }, [key, readValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;