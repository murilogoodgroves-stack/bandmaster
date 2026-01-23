import React, { useState, useEffect, useRef, useCallback } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Use a ref to store initialValue so it doesn't trigger re-renders/effects if passed inline as a new object
  const initialValueRef = useRef(initialValue);
  
  // Update ref if initialValue changes, ensuring we have the latest if key changes later
  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  // Helper to read from local storage safely
  // Depends only on key to avoid unnecessary recreations when initialValue is unstable
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValueRef.current;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValueRef.current;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValueRef.current;
    }
  }, [key]);

  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(readValue);

  // Use a ref to track if the update came from this hook instance
  const isUpdateFromWithin = useRef(false);

  // Return a wrapped version of useState's setter function
  const setValue: React.Dispatch<React.SetStateAction<T>> = useCallback(
    (value) => {
      try {
        // Use functional update to access current state without adding it to dependencies
        setStoredValue((currentValue) => {
            const valueToStore = value instanceof Function ? value(currentValue) : value;
            
            // Persist to LocalStorage
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));
                
                // Dispatch Event for other components
                isUpdateFromWithin.current = true;
                window.dispatchEvent(new StorageEvent('storage', { 
                    key, 
                    newValue: JSON.stringify(valueToStore),
                    storageArea: window.localStorage
                }));
                isUpdateFromWithin.current = false;
            }
            return valueToStore;
        });
      } catch (error) {
        console.error(`Error setting localStorage key “${key}”:`, error);
      }
    },
    [key] // Stable dependency
  );

  // Effect to listen for changes from other components/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        if (isUpdateFromWithin.current) return;

        try {
          const newValue = JSON.parse(event.newValue);
          setStoredValue(newValue);
        } catch (error) {
          console.error(`Error parsing storage change for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  // Sync state if the key changes. 
  // This only runs when 'key' changes because readValue is now stable for a given key.
  useEffect(() => {
    setStoredValue(readValue());
  }, [key, readValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;