export const STORAGE_VERSION_KEY = 'bandmate-storage-version';
export const STORAGE_VERSION = 'v2';

export type BandLike = { id: string };
export type ScopedRecord = { bandId?: string };

export const validBandIds = (bands: BandLike[]) => new Set(bands.map((band) => band.id));

export const makeEqualSplit = (userIds: string[]) => {
  if (userIds.length === 0) return { system: 100 };
  const share = 100 / userIds.length;
  return userIds.reduce((acc, userId) => ({ ...acc, [userId]: share }), {} as Record<string, number>);
};

export const sanitizeBandScopedList = <T extends ScopedRecord>(items: T[], allowedBandIds: Set<string>): T[] =>
  items.filter((item) => !item.bandId || allowedBandIds.has(item.bandId));

export const resolveValidBandId = (bands: BandLike[], currentBandId: string) => {
  if (bands.length === 0) return '';
  return bands.some((band) => band.id === currentBandId) ? currentBandId : bands[0].id;
};

export const resolveValidUserId = (users: { id: string }[], currentUserId: string) => {
  if (users.length === 0) return '';
  return users.some((user) => user.id === currentUserId) ? currentUserId : users[0].id;
};

export const ensureStorageVersion = () => {
  if (typeof window === 'undefined') return;
  const existing = window.localStorage.getItem(STORAGE_VERSION_KEY);
  if (existing !== STORAGE_VERSION) {
    window.localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
  }
};

export const migrateLegacyStorageShape = <T>(rawState: Record<string, T | undefined>) => {
  const normalized: Record<string, T | undefined> = {};

  Object.entries(rawState).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    normalized[key] = value;
  });

  return normalized;
};
