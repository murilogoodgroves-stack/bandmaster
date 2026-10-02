export const canShowBandSetupPrompt = (bandsLength: number, isHydratingRemoteState: boolean) => {
  return !isHydratingRemoteState && bandsLength === 0;
};

export const shouldUseRemoteState = (
  hasLocalData: boolean,
  isDatabaseConfigured: boolean,
  remotePayloadExists: boolean
) => {
  if (!isDatabaseConfigured || !remotePayloadExists) {
    return false;
  }

  return true;
};
