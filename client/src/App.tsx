// src/App.tsx
import { Suspense, lazy, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

import ProtectedRoute from "@/routes/ProtectedRoute";

const HomePage = lazy(() => import("@/pages/home"));
const MembersPage = lazy(() => import("@/pages/members"));
const ResearchPage = lazy(() => import("@/pages/research"));
const AccessPage = lazy(() => import("@/pages/access"));
const NewsPage = lazy(() => import("@/pages/news"));
const NewsDetailPage = lazy(() => import("@/pages/news-detail"));
const LoginPage = lazy(() => import("@/pages/login"));
const RegisterPage = lazy(() => import("@/pages/register"));
const AdminPage = lazy(() => import("@/pages/admin"));
const SettingsPage = lazy(() => import("@/pages/settings"));
const NotFound = lazy(() => import("@/pages/not-found"));

function Router() {
  return (
    <Switch>
      {/* 공개 라우트 */}
      <Route path="/" component={HomePage} />
      <Route path="/members" component={MembersPage} />
      <Route path="/research" component={ResearchPage} />
      <Route path="/news" component={NewsPage} />
      <Route path="/news/:id" component={NewsDetailPage} />
      <Route path="/access" component={AccessPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />

      {/* 보호 라우트만 가드 */}
      <Route path="/admin" component={() => <ProtectedRoute component={AdminPage} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={SettingsPage} />} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    const load = () => {
      // 첫 페인트에 영향 주지 않게 idle 때 미리 불러오기
      import("@/pages/members");
      import("@/pages/research");
      import("@/pages/news");
    };

    const id =
      "requestIdleCallback" in window
        ? (window as any).requestIdleCallback(load)
        : setTimeout(load, 1500); // 폴백: 1.5초 뒤 프리로드

    return () => {
      if ("cancelIdleCallback" in window) {
        (window as any).cancelIdleCallback(id);
      } else {
        clearTimeout(id as number);
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-lab-gray">
          <Header />
          <main className="pt-16">
            <Suspense fallback={<div className="flex justify-center items-center h-64">Loading...</div>}>
              <Router />
            </Suspense>
          </main>
          <Footer />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
