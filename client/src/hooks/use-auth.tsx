import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { insertUserSchema, type User, type InsertUser } from "@shared/schema";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type AuthContextType = {
  user: Omit<User, "password"> | null;
  isLoading: boolean;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: InsertUser) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));

  // Helper to sync token
  const updateToken = (newToken: string | null) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
    } else {
      localStorage.removeItem("token");
    }
    setToken(newToken);
  };

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      if (!token) return null;
      const res = await fetch(api.auth.me.path, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401) updateToken(null);
        return null;
      }
      return await res.json();
    },
    enabled: !!token,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      
      if (!res.ok) {
        throw new Error("Invalid credentials");
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      updateToken(data.token);
      queryClient.setQueryData(["/api/auth/me"], data.user);
      toast({ title: "Welcome back!", description: "Successfully logged in." });
    },
    onError: (error) => {
      toast({ 
        title: "Login failed", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await fetch(api.auth.register.path, {
        method: api.auth.register.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Registration failed");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Account created", description: "Please log in with your new account." });
    },
    onError: (error) => {
      toast({ 
        title: "Registration failed", 
        description: error.message, 
        variant: "destructive" 
      });
    },
  });

  const logout = () => {
    updateToken(null);
    queryClient.setQueryData(["/api/auth/me"], null);
    queryClient.clear();
    toast({ title: "Logged out", description: "See you soon!" });
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        login: loginMutation.mutateAsync,
        register: registerMutation.mutateAsync,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
