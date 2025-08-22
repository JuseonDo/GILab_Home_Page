import React from "react";
import { useAuth } from "@/hooks/useAuth";
import LoginPage from "@/pages/login";

export default function ProtectedRoute({ component: Cmp }: { component: React.ComponentType }) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <Cmp />;
}
