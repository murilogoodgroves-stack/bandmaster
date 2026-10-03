let activeUserId: string | null = null;

export const setUserStorageScope = (userId: string | null) => {
  activeUserId = userId;
};

export const getUserStorageKey = (key: string) => userScopedStorageKey(key, activeUserId);

export const getUserScopedItem = (key: string) => localStorage.getItem(getUserStorageKey(key));

export const setUserScopedItem = (key: string, value: string) => {
  const scopedKey = getUserStorageKey(key);
  localStorage.setItem(scopedKey, value);
  window.dispatchEvent(new StorageEvent('storage', {
    key: scopedKey,
    newValue: value,
    storageArea: localStorage,
  }));
};

export const removeUserScopedItem = (key: string) => {
  localStorage.removeItem(getUserStorageKey(key));
};

export const userScopedStorageKey = (key: string, userId: string | null) => (
  userId ? `bandmate:user:${encodeURIComponent(userId)}:${key}` : key
);
