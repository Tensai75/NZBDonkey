import { get as getTargetSettings, Settings, TargetSettings } from './settings'

export const getTargets = async (): Promise<TargetSettings[]> => {
  const settings = await getTargetSettings()
  return settings.targets
}

export const getActiveTargets = async (settings: Settings): Promise<TargetSettings[]> => {
  return settings.targets.filter((target) => target.isActive)
}
