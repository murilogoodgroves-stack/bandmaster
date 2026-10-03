export const bandBackupListKeys = [
  'tasks',
  'events',
  'transactions',
  'memberTransactions',
  'budgets',
  'contacts',
  'merch',
  'releases',
  'tours',
  'setlists',
  'collaborators',
  'lockedDates',
  'fundingApplications',
  'savedFundingOpps',
  'savedResidencies',
  'festivals',
  'goals',
  'media',
  'articles',
  'royalties',
  'productionSongs',
  'productionProjects',
  'gigs',
  'venues',
  'promoters',
  'labelContacts',
  'radioContacts',
  'fanContacts',
  'campaigns',
  'invoices',
  'emailTemplates',
] as const;

export const bandBackupMapKeys = [
  'cashOnHandMap',
  'splitsMap',
  'bandSettingsMap',
  'bandBiosMap',
  'epkPhotoIdsMap',
  'epkVideoIdsMap',
] as const;

export type BandBackup = {
  exportFormatVersion?: 2;
  bandProfile: Record<string, unknown> & { id: string; name: string };
  data: Record<string, unknown>;
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

export const parseBandBackup = (value: unknown): BandBackup => {
  if (!isRecord(value) || !isRecord(value.bandProfile) || !isRecord(value.data)) {
    throw new Error('Invalid backup: band profile and data are required.');
  }

  const { bandProfile, data } = value;
  if (typeof bandProfile.id !== 'string' || !bandProfile.id.trim()
    || typeof bandProfile.name !== 'string' || !bandProfile.name.trim()) {
    throw new Error('Invalid backup: the band profile must include an ID and name.');
  }

  if (value.exportFormatVersion !== undefined && value.exportFormatVersion !== 2) {
    throw new Error('This backup format is not supported.');
  }

  const normalizedData = { ...data };
  if (normalizedData.articles === undefined && Array.isArray(data.publishedArticles)) {
    normalizedData.articles = data.publishedArticles;
  }

  for (const key of bandBackupListKeys) {
    const items = normalizedData[key];
    if (items === undefined) continue;
    if (!Array.isArray(items) || items.length > 10000 || items.some(item => !isRecord(item))) {
      throw new Error(`Invalid backup: "${key}" must be a list of records with at most 10,000 items.`);
    }
  }

  const mapValidators: Record<(typeof bandBackupMapKeys)[number], (item: unknown) => boolean> = {
    cashOnHandMap: item => typeof item === 'number' && Number.isFinite(item),
    splitsMap: item => isRecord(item) && Object.values(item).every(value => typeof value === 'number' && Number.isFinite(value)),
    bandSettingsMap: isRecord,
    bandBiosMap: item => typeof item === 'string',
    epkPhotoIdsMap: item => typeof item === 'string',
    epkVideoIdsMap: item => typeof item === 'string',
  };
  for (const key of bandBackupMapKeys) {
    const item = normalizedData[key];
    if (item !== undefined && !mapValidators[key](item)) {
      throw new Error(`Invalid backup: "${key}" has an unsupported value.`);
    }
  }

  return {
    ...(value.exportFormatVersion === 2 ? { exportFormatVersion: 2 } : {}),
    bandProfile: {
      ...bandProfile,
      id: bandProfile.id,
      name: bandProfile.name,
    },
    data: normalizedData,
  };
};
