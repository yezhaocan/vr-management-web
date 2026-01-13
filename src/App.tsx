// @ts-nocheck
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { PageWrapper } from "./components/ui/page-wrapper";
import { routers } from "./configs/routers";

// Create a client
const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <React.StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner position="top-center" />
            <BrowserRouter>
              <Routes>
                <Route
                  path="/"
                  element={
                    <Navigate
                      to={`/${routers.find((item) => item.isHome)?.id || routers[0].id
                        }`}
                      replace
                    />
                  }
                />
                {routers.map((item) => {
                  return (
                    <Route
                      key={item.id}
                      path={`/${item.id}`}
                      element={<PageWrapper id={item.id} Page={item.component} />}
                    />
                  );
                })}
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
};

export default App;
