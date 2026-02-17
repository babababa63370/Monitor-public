import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  description, 
  trend, 
  trendValue, 
  icon,
  className 
}: StatCardProps) {
  return (
    <Card className={cn("glass-card overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground/50">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {value}
          </div>
          {trend && (
            <div className={cn(
              "flex items-center text-xs font-medium px-2 py-0.5 rounded-full",
              trend === "up" ? "text-green-400 bg-green-400/10" : 
              trend === "down" ? "text-red-400 bg-red-400/10" : 
              "text-muted-foreground bg-white/5"
            )}>
              {trend === "up" ? <ArrowUpRight className="w-3 h-3 mr-1" /> : 
               trend === "down" ? <ArrowDownRight className="w-3 h-3 mr-1" /> : 
               <Activity className="w-3 h-3 mr-1" />}
              {trendValue}
            </div>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-2">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
