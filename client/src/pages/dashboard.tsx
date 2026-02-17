import { useSites } from "@/hooks/use-sites";
import { Layout } from "@/components/layout";
import { StatCard } from "@/components/stat-card";
import { AddSiteDialog } from "@/components/add-site-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Server, 
  Activity, 
  AlertTriangle, 
  CheckCircle2,
  Clock 
} from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { type SiteWithStats } from "@shared/schema";

export default function Dashboard() {
  const { data: sites, isLoading } = useSites();

  const totalSites = sites?.length || 0;
  const activeSites = sites?.filter((s: SiteWithStats) => s.lastStatus === "UP").length || 0;
  const downSites = sites?.filter((s: SiteWithStats) => s.lastStatus === "DOWN").length || 0;
  const avgResponse = sites?.reduce((acc: number, s: SiteWithStats) => acc + (s.avgResponseTime || 0), 0) / (totalSites || 1);

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-8 animate-in">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight glow-text">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of your infrastructure status.</p>
          </div>
          <Link href="/sites/add">
            <Button data-testid="button-add-site">
              Ajouter un site
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Sites"
            value={totalSites}
            icon={<Server className="w-4 h-4" />}
            description="Active monitors"
          />
          <StatCard
            title="Operational"
            value={activeSites}
            trend="up"
            trendValue="100%"
            icon={<CheckCircle2 className="w-4 h-4 text-green-500" />}
            className="border-green-500/20"
          />
          <StatCard
            title="Incidents"
            value={downSites}
            trend={downSites > 0 ? "down" : "neutral"}
            icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
            className={downSites > 0 ? "border-red-500/20 bg-red-500/5" : ""}
          />
          <StatCard
            title="Avg Response"
            value={`${Math.round(avgResponse)}ms`}
            icon={<Clock className="w-4 h-4" />}
            description="Global latency"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-1 md:col-span-2 lg:col-span-4 glass-card overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sites?.slice(0, 5).map((site: SiteWithStats) => (
                  <div key={site.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className={`shrink-0 w-2 h-2 rounded-full ${site.lastStatus === 'UP' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{site.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{site.url}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 border-t sm:border-t-0 pt-2 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-mono">{site.avgResponseTime}ms</p>
                        <p className="text-xs text-muted-foreground">Latency</p>
                      </div>
                      <div className="text-left sm:text-right min-w-[60px]">
                        <p className="text-sm font-medium">{site.uptime}%</p>
                        <p className="text-xs text-muted-foreground">Uptime</p>
                      </div>
                      <Link href={`/sites/${site.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                          <Activity className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {sites?.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No sites added yet. Click "Add Site" to start monitoring.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-1 md:col-span-2 lg:col-span-3 glass-card bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Global Uptime</p>
                    <p className="text-xs text-muted-foreground">Last 24 hours</p>
                  </div>
                  <div className="text-2xl font-bold">99.9%</div>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 w-[99.9%]" />
                </div>
                
                <div className="pt-4 border-t border-white/10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Monitoring Active</p>
                      <p className="text-xs text-muted-foreground">Checks synchronized across all sites</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
