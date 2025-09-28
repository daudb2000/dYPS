import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import DataRetention from "@/pages/data-retention";
import ApplicationSubmitted from "@/pages/application-submitted";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminAccepted from "@/pages/admin-accepted";
import AdminBacklog from "@/pages/admin-backlog";
import AdminDatabase from "@/pages/admin-database";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/data-retention" component={DataRetention} />
      <Route path="/application-submitted" component={ApplicationSubmitted} />
      <Route path="/admin" component={() => {
        // Redirect /admin to /admin/login for easier access
        window.location.replace('/admin/login');
        return null;
      }} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/accepted" component={AdminAccepted} />
      <Route path="/admin/backlog" component={AdminBacklog} />
      <Route path="/admin/database" component={AdminDatabase} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
