// @ts-nocheck
import React, { useEffect, useMemo, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PageWrapper } from "./components/ui/page-wrapper";
import { routers } from "./configs/routers";
import { createBrowserHistory } from "history";

const history = createBrowserHistory();
window._WEAPPS_HISTORY = history;
// Create a client
const queryClient = new QueryClient();

const App: React.FC = () => {
  const homeId = useMemo(
    () => routers.find((item) => item.isHome)?.id || routers[0].id,
    []
  );
  const [path, setPath] = useState<string>(window.location.pathname);

  useEffect(() => {
    const handlePop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePop);
    window.addEventListener("app:navigate", handlePop as any);

    if (window.location.pathname === "/") {
      const url = `/${homeId}`;
      history.replace(url);
      setPath(url);
    }
    return () => {
      window.removeEventListener("popstate", handlePop);
      window.removeEventListener("app:navigate", handlePop as any);
    };
  }, [homeId]);

  const activeRoute = useMemo(() => {
    const id = path.replace(/^\/+/, "");
    return routers.find((r) => r.id === id) || routers.find((r) => r.id === homeId)!;
  }, [path, homeId]);

  return (
    <React.StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner position="top-center" />
            <PageWrapper id={activeRoute.id} Page={activeRoute.component} />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
};

export default App;
