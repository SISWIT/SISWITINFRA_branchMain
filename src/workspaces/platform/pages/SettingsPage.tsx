import { Shield, Workflow, Activity, Loader2, Save, Wrench } from "lucide-react";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { Badge } from "@/ui/shadcn/badge";
import { Switch } from "@/ui/shadcn/switch";
import { Input } from "@/ui/shadcn/input";

import { PlatformPageHeader } from "../shared/components/PlatformPageHeader";
import { usePlatformPermissions } from "../shared/auth/usePlatformPermissions";
import { usePlatformSettings } from "../domains/settings/hooks/usePlatformSettings";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { can } = usePlatformPermissions();
  const { 
    settings, 
    featureFlags, 
    isSettingsLoading, 
    isFlagsLoading, 
    updateSetting, 
    toggleFeatureFlag 
  } = usePlatformSettings();

  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    if (settings.length > 0) {
      const init: Record<string, string> = {};
      settings.forEach(s => { init[s.key] = s.value; });
      setLocalSettings(init);
    }
  }, [settings]);

  const handleSettingChange = (key: string, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSetting = (key: string) => {
    const value = localSettings[key];
    if (value === undefined) return;
    updateSetting.mutate({ key, value }, {
      onSuccess: () => toast.success(`Setting '${key}' updated successfully.`),
      onError: () => toast.error(`Failed to update '${key}'.`)
    });
  };

  const handleToggleFlag = (key: string, isEnabled: boolean) => {
    toggleFeatureFlag.mutate({ key, isEnabled }, {
      onSuccess: () => toast.success(`Feature flag '${key}' ${isEnabled ? 'enabled' : 'disabled'}.`),
      onError: () => toast.error(`Failed to toggle '${key}'.`)
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <PlatformPageHeader
        title="Platform Settings & Governance"
        description="Global configuration, system health monitoring, and administrative runbooks."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Global Key-Value Settings */}
        <Card className="col-span-full lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-zinc-500" />
              Global Configuration Variables
            </CardTitle>
            <CardDescription>System-wide parameters affecting all tenant environments.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSettingsLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : settings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No global settings found.</p>
            ) : (
              <div className="space-y-4">
                {settings.map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="space-y-1 flex-1">
                      <p className="text-sm font-medium leading-none">{setting.key}</p>
                      {setting.description && (
                        <p className="text-xs text-muted-foreground">{setting.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={localSettings[setting.key] ?? setting.value}
                        onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                        className="w-32 h-8 text-xs font-mono"
                      />
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        onClick={() => saveSetting(setting.key)}
                        disabled={!can("platform.settings.write") || updateSetting.isPending}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feature Flags */}
        <Card className="col-span-full lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" />
              Feature Flags
            </CardTitle>
            <CardDescription>Toggle experimental platform features dynamically.</CardDescription>
          </CardHeader>
          <CardContent>
            {isFlagsLoading ? (
              <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : featureFlags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No flags defined.</p>
            ) : (
              <div className="space-y-4">
                {featureFlags.map((flag) => (
                  <div key={flag.key} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">{flag.key}</label>
                      <p className="text-xs text-muted-foreground line-clamp-2">{flag.description}</p>
                    </div>
                    <Switch 
                      checked={flag.is_enabled}
                      onCheckedChange={(checked) => handleToggleFlag(flag.key, checked)}
                      disabled={!can("platform.settings.write") || toggleFeatureFlag.isPending}
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Existing Security info for parity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Security Policies
            </CardTitle>
            <CardDescription>Global authentication boundaries.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Impersonation Logging</span>
                <Badge>Mandatory</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>RLS State</span>
                <Badge variant="outline" className="text-green-600 border-green-200">Enforced</Badge>
              </div>
            </div>
            <Button variant="secondary" size="sm" className="w-full" disabled={!can("platform.security.read")}>
              Security Console
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5 text-primary" />
              Async Workers
            </CardTitle>
            <CardDescription>Job queues and edge execution.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Document generation, PDF creation, and automated expiry alerts are processed via background runtimes.
            </p>
            <div className="rounded-md bg-zinc-950 p-3 text-[11px] font-mono text-zinc-50">
              $ npm run jobs:worker
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
