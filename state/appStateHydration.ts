export const canShowBandSetupPrompt = (bandsLength: number, isHydratingRemoteState: boolean) => {
  return !isHydratingRemoteState && bandsLength === 0;
};
