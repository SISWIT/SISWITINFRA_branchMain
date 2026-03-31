export interface PlatformSettingRow {
  key: string;
  value: string;
  description: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformFeatureFlagRow {
  key: string;
  is_enabled: boolean;
  description: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}
