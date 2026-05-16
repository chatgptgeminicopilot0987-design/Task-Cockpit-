import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useGetMe } from "@workspace/api-client-react";
type User = { id: number; name: string; email: string; role: "admin" | "member"; createdAt: string };
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // If token is null, we can disable the query
  const { data: user, isLoading: isGetMeLoading, isError } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  const isLoading = token ? isGetMeLoading : false;

  useEffect(() => {
    if (isError) {
      // Token is likely invalid
      logout();
    }
  }, [isError]);

  const login = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    queryClient.clear();
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{ user: user ?? null, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
