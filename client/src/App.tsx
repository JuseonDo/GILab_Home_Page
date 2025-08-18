import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import HomePage from "@/pages/home";
import MembersPage from "@/pages/members";
import ResearchPage from "@/pages/research";
import AccessPage from "@/pages/access";
import NewsPage from "@/pages/news";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import CreatePublicationPage from "@/pages/create-publication";
import AdminPage from "@/pages/admin";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/members" component={MembersPage} />
      <Route path="/research" component={ResearchPage} />
      <Route path="/news" component={NewsPage} />
      <Route path="/access" component={AccessPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/create-publication" component={CreatePublicationPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-lab-gray">
          <Header />
          <main className="pt-16">
            <Router />
          </main>
          <Footer />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
