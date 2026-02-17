import { useSite, useLogs, useAnalyzeSite, useDeleteSite } from "@/hooks/use-sites";
import { Layout } from "@/components/layout";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Trash2, 
  Sparkles, 
  ExternalLink,
  Activity,
  Globe,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { type Log } from "@shared/schema";

export default function SiteDetails() {
  const { id } = useParams();
  const siteId = parseInt(id || "0");
  const [, setLocation] = useLocation();

  const { data: site, isLoading: siteLoading } = useSite(siteId);
  const { data: logs, isLoading: logsLoading } = useLogs(siteId);
  const analyze = useAnalyzeSite();
  const deleteSite = useDeleteSite();

  const handleDeleteClick = async () => {
    try {
      await deleteSite.mutateAsync(siteId);
      setLocation("/");
    } catch (error) {
      // Error handled by hook/toast
    }
  };

  const handleAnalyze = async () => {
    try {
      await analyze.mutateAsync(siteId);
    } catch (error) {
      // Error handled by hook/toast
    }
  };

  if (siteLoading || logsLoading) {
    return (
      <Layout>
        <div className="space-y-8">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </Layout>
    );
  }

  if (!site) return <Layout><div>Site not found</div></Layout>;

  // Prepare chart data
  const chartData = logs?.slice(0, 50).reverse().map((log: Log) => ({
    time: log.createdAt ? format(new Date(log.createdAt), "HH:mm") : "",
    value: log.responseTime,
    status: log.status
  }));

  return (
    <Layout>
      <div className="space-y-8 animate-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="icon" className="h-10 w-10">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                {site.name}
                <span className={`text-xs px-2 py-1 rounded-full border ${
                  site.isActive 
                    ? "bg-green-500/10 text-green-400 border-green-500/20" 
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}>
                  {site.isActive ? "Monitoring" : "Paused"}
                </span>
              </h1>
              <a 
                href={site.url} 
                target="_blank" 
                rel="noreferrer" 
                className="text-sm text-muted-foreground flex items-center gap-1 hover:text-primary transition-colors"
              >
                {site.url} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleAnalyze} 
              disabled={analyze.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/25"
            >
              {analyze.isPending ? (
                "Analyzing..."
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Logs
                </>
              )}
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass-card">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the monitored site and all associated logs.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteClick} className="bg-destructive hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* AI Analysis Result */}
        {analyze.data && (
          <Card className="glass-card border-purple-500/20 bg-purple-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-400">
                <Sparkles className="w-5 h-5" />
                AI Analysis Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-black/20">
                <p className="text-sm leading-relaxed">{analyze.data.analysis}</p>
              </div>
              
              {analyze.data.suggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-purple-200">Suggestions</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {analyze.data.suggestions.map((s: string, i: number) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="col-span-2 glass-card">
            <CardHeader>
              <CardTitle>Response Time History</CardTitle>
              <CardDescription>Latency in milliseconds over the last 50 checks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}ms`} 
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(17, 24, 39, 0.8)', 
                        borderColor: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(12px)',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="hsl(217, 91%, 60%)" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorLatency)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-6">
                  <div className={`
                    w-32 h-32 rounded-full flex items-center justify-center border-8
                    ${site.lastStatus === 'UP' 
                      ? 'border-green-500/20 text-green-500 shadow-[0_0_30px_rgba(34,197,94,0.2)]' 
                      : 'border-red-500/20 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]'}
                  `}>
                    <div className="text-center">
                      <Activity className="w-8 h-8 mx-auto mb-1" />
                      <span className="text-xl font-bold">{site.lastStatus}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Globe className="w-4 h-4" /> URL
                  </span>
                  <span className="text-sm font-mono truncate max-w-[150px]">{site.url}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Interval
                  </span>
                  <span className="text-sm">{site.intervalMinutes} min</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Last Checked
                  </span>
                  <span className="text-sm">
                    {site.lastChecked ? format(new Date(site.lastChecked), "PP p") : "Never"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Logs Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Recent Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-white/5 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 rounded-l-lg">Time</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Latency</th>
                    <th className="px-6 py-3 rounded-r-lg text-right">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {logs?.slice(0, 10).map((log: Log) => (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-mono">
                        {log.createdAt ? format(new Date(log.createdAt), "MMM dd, HH:mm:ss") : ""}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          log.status === 'UP' 
                            ? "bg-green-500/10 text-green-400" 
                            : "bg-red-500/10 text-red-400"
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono">
                        {log.responseTime}ms
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground">
                        {log.status === 'UP' ? 'OK' : 'Connection Timeout'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
