import { useSites } from "@/hooks/use-sites";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Wifi } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function Monitoring() {
  const { data: sites, isLoading } = useSites();

  if (isLoading) {
    return (
      <Layout>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight glow-text flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary" />
            Live Monitor
          </h1>
          <p className="text-muted-foreground mt-1">Real-time status of all configured endpoints.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {sites?.map(site => (
            <Card key={site.id} className="glass-card hover:border-primary/50 transition-colors group">
              <CardContent className="p-4 md:p-6">
                <div className="flex justify-between items-start mb-4 md:mb-6">
                  <div className={`p-2 md:p-3 rounded-xl ${
                    site.lastStatus === 'UP' 
                      ? 'bg-green-500/10 text-green-400' 
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    <Wifi className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="text-right">
                    <p className={`text-base md:text-lg font-bold ${
                      site.lastStatus === 'UP' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {site.lastStatus}
                    </p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                      {site.lastChecked ? format(new Date(site.lastChecked), "HH:mm:ss") : "Pending"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 md:space-y-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-base md:text-lg truncate" title={site.name}>{site.name}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground truncate font-mono">{site.url}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 md:gap-4 pt-3 md:pt-4 border-t border-white/5">
                    <div className="min-w-0">
                      <p className="text-[10px] md:text-xs text-muted-foreground">Latency</p>
                      <p className="font-mono text-base md:text-lg truncate">{site.avgResponseTime || 0}ms</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] md:text-xs text-muted-foreground">Uptime</p>
                      <p className="font-mono text-base md:text-lg truncate">{site.uptime || 0}%</p>
                    </div>
                  </div>

                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        site.lastStatus === 'UP' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: '100%' }}
                    >
                      <div className="w-full h-full animate-pulse opacity-50 bg-white" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
