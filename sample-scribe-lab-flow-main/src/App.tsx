
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import UserStories from "./pages/UserStories";
import ActivityLog from "./pages/ActivityLog";
import SampleGraphPage from "./pages/SampleGraph";
import MermaidGraphPage from "./pages/MermaidGraph";
import GuidedWorkflow from "./pages/GuidedWorkflow";
import WorkflowManagerPage from "./pages/WorkflowManager";
import SampleFinder from "./pages/SampleFinder";
import NotFound from "./pages/NotFound";
import PreparationReportPage from "@/pages/PreparationReport";
import InstrumentBookings from "./pages/InstrumentBookings";
import HPLCSequenceTablePage from "./pages/HPLCSequenceTablePage";
import AuthPage from "@/pages/Auth";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import SolventManagement from "./pages/SolventManagement";
import ColumnManagement from "./pages/ColumnManagement";
import LIMSImport from "./pages/LIMSImport";
import { SupabaseProvider } from "@/providers/SupabaseProvider";
import * as React from "react";

// Helper component to handle conditional sidebar rendering
function MainLayout() {
  const location = useLocation();
  const hideSidebar = location.pathname === "/auth";

  return (
    <div className="flex w-full min-h-screen">
      {!hideSidebar && <AppSidebar />}
      <main className="flex-1 min-w-0 relative">
        {/* Sidebar toggle: pinned to top left, always visible */}
        {!hideSidebar && (
          <div className="absolute top-2 left-2 z-20">
            <SidebarTrigger />
          </div>
        )}
        <div className={hideSidebar ? "" : "pt-12 md:pt-0"}>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* Auth page for signup/login/profile */}
            <Route path="/auth" element={<AuthPage />} />
            {/* <Route path="/user-stories" element={<UserStories />} /> */}
            <Route path="/activity-log" element={<ActivityLog />} />
            <Route path="/sample-graph" element={<SampleGraphPage />} />
            <Route path="/mermaid-graph" element={<MermaidGraphPage />} />
            <Route path="/guided-workflow" element={<GuidedWorkflow />} />
            <Route path="/workflow-manager" element={<WorkflowManagerPage />} />
            <Route path="/sample-finder" element={<SampleFinder />} />
            <Route path="/preparation-report" element={<PreparationReportPage />} />
            <Route path="/instrument-bookings" element={<InstrumentBookings />} />
            <Route path="/hplc-sequence-table" element={<HPLCSequenceTablePage />} />
            {/* NEW ROUTES */}
            <Route path="/solvent-management" element={<SolventManagement />} />
            <Route path="/column-management" element={<ColumnManagement />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="/lims-import" element={<LIMSImport />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SidebarProvider>
            <Router>
              <MainLayout />
            </Router>
          </SidebarProvider>
        </TooltipProvider>
      </SupabaseProvider>
    </QueryClientProvider>
  );
}

export default App;
