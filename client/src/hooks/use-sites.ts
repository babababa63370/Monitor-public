import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { InsertSite } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export function useSites() {
  return useQuery({
    queryKey: [api.sites.list.path],
    queryFn: async () => {
      const res = await fetch(api.sites.list.path, { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to fetch sites");
      return res.json();
    },
    refetchInterval: 30000, // Poll every 30s
  });
}

export function useSite(id: number) {
  return useQuery({
    queryKey: [api.sites.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.sites.get.path, { id });
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to fetch site");
      return res.json();
    },
    refetchInterval: 10000, // Poll faster for detailed view
  });
}

export function useLogs(siteId: number) {
  return useQuery({
    queryKey: [api.logs.list.path, siteId],
    queryFn: async () => {
      const url = buildUrl(api.logs.list.path, { siteId });
      const res = await fetch(url, { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to fetch logs");
      return res.json();
    },
    refetchInterval: 10000,
  });
}

export function useCreateSite() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertSite) => {
      const res = await fetch(api.sites.create.path, {
        method: api.sites.create.method,
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create site");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.sites.list.path] });
      toast({ title: "Site added", description: "Monitoring has started." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not add site.", variant: "destructive" });
    },
  });
}

export function useDeleteSite() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.sites.delete.path, { id });
      const res = await fetch(url, {
        method: api.sites.delete.method,
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete site");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.sites.list.path] });
      toast({ title: "Site deleted", description: "Monitoring stopped." });
    },
  });
}

export function useAnalyzeSite() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (siteId: number) => {
      const url = buildUrl(api.ai.analyze.path, { siteId });
      const res = await fetch(url, {
        method: api.ai.analyze.method,
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Analysis failed");
      return res.json();
    },
    onError: () => {
      toast({ title: "AI Analysis Failed", description: "Please try again later.", variant: "destructive" });
    },
  });
}
