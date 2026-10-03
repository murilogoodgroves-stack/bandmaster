export const removeClientStoredSecrets = (payload: Record<string, unknown>) => {
  const sanitized = { ...payload };
  const settingsMap = sanitized.bandSettingsMap;
  if (settingsMap && typeof settingsMap === 'object' && !Array.isArray(settingsMap)) {
    sanitized.bandSettingsMap = Object.fromEntries(
      Object.entries(settingsMap).map(([bandId, settings]) => {
        if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
          return [bandId, settings];
        }
        const safeSettings: Record<string, unknown> = { ...settings };
        delete safeSettings.mailchimpApiKey;
        return [bandId, safeSettings];
      })
    );
  }
  return sanitized;
};
