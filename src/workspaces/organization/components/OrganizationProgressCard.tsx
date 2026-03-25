import { useOrganization } from "@/workspaces/organization/hooks/useOrganization";

interface OrganizationProgressCardProps {
  value: number;
  label: string;
  caption: string;
}

export function OrganizationProgressCard({ value, label, caption }: OrganizationProgressCardProps) {
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || "var(--primary)";
  const percent = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <section className="h-full">
      <div className="mb-8">
        <h3 className="text-xl font-bold tracking-tight">{label}</h3>
        <p className="text-sm text-muted-foreground font-medium mt-1">{caption}</p>
      </div>

      <div className="mx-auto w-full max-w-[240px] py-4">
        <div
          className="relative mx-auto h-48 w-48 rounded-full shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] transition-transform hover:scale-105 duration-500"
          style={{
            background: `conic-gradient(${primaryColor} ${percent * 3.6}deg, rgba(255,255,255,0.05) ${percent * 3.6}deg 360deg)`,
          }}
          aria-hidden
        >
          {/* Inner Circle for Glass Effect */}
          <div className="absolute inset-[20px] flex items-center justify-center rounded-full bg-card/90 backdrop-blur-md border border-white/5 shadow-inner">
            <div className="text-center">
              <p className="font-black text-5xl tracking-tighter" style={{ color: primaryColor }}>{percent}%</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Verified</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
          <span>Approved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-muted/30" />
          <span>Pending</span>
        </div>
      </div>
    </section>
  );
}
