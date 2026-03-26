import { supabase, isOnline } from './supabase'

export interface AppConfig {
  cutout_url: string
  default_pet_image: string | null
}

const DEFAULT_CONFIG: AppConfig = {
  cutout_url: 'https://www.remove.bg/zh',
  default_pet_image: null,
}

export async function loadAppConfig(): Promise<AppConfig> {
  if (!isOnline) return { ...DEFAULT_CONFIG }

  try {
    const { data } = await supabase!
      .from('app_config')
      .select('key, value')

    if (!data || data.length === 0) return { ...DEFAULT_CONFIG }

    const config = { ...DEFAULT_CONFIG }
    for (const row of data as { key: string; value: string }[]) {
      if (row.key === 'cutout_url' && row.value) config.cutout_url = row.value
      if (row.key === 'default_pet_image' && row.value) config.default_pet_image = row.value
    }
    return config
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}
