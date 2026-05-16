import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import { Layout } from "@/components/layout";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, adminOnly = false }: { component: React.ComponentType, adminOnly?: boolean }) {
  const { user, isLoading, token } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!token || !user) {
    return <Redirect to="/login" />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Redirect to="/unauthorized" />;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Unauthorized() {
  return (
    <Layout>
      <div className="h-full flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold mb-4">403</h1>
        <p className="text-xl text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    </Layout>
  );
}

import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import ProjectDetail from "@/pages/project-detail";
import TaskDetail from "@/pages/task-detail";
import MyTasks from "@/pages/my-tasks";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/projects"><ProtectedRoute component={Projects} /></Route>
      <Route path="/projects/:id"><ProtectedRoute component={ProjectDetail} /></Route>
      <Route path="/tasks/:id"><ProtectedRoute component={TaskDetail} /></Route>
      <Route path="/my-tasks"><ProtectedRoute component={MyTasks} /></Route>
      
      <Route path="/unauthorized" component={Unauthorized} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
