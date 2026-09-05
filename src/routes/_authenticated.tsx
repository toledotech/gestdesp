import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Layout } from "@/components/layout/Layout";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading: authLoading } = useAuth();
  const { loading: profileLoading, profileError } = usePermissions();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login", replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  if (!user) return null;

  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-sm text-center space-y-4 p-8 border rounded-lg bg-card">
          <h2 className="text-lg font-semibold text-foreground">Conta não configurada</h2>
          <p className="text-sm text-muted-foreground">{profileError}</p>
          <button
            className="text-sm text-primary underline"
            onClick={() => navigate({ to: "/login", replace: true })}
          >
            Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}
