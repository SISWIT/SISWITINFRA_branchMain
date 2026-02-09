import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
// 1. IMPORT ADMIN ROUTE HERE
import { EmployeeRoute, AdminRoute } from "@/components/auth/ProtectedRoute";

import Index from "./pages/Index";
import Products from "./pages/Products";
import Solutions from "./pages/Solutions";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

import DocumentsDashboard from "./pages/documents/DocumentsDashboard";
import DocumentTemplatesPage from "./pages/documents/DocumentTemplatesPage";
import DocumentHistoryPage from "./pages/documents/DocumentHistoryPage";
import DocumentCreatePage from "./pages/documents/DocumentCreatePage";
import PendingSignaturesPage from "./pages/documents/PendingSignaturesPage";

import CLMDashboard from "./pages/clm/CLMDashboard";
import ContractsPage from "./pages/clm/ContractsPage"; 
import TemplatesPage from "./pages/clm/TemplatesPage"; 

import CRMLayout from "./pages/crm/CRMLayout";
import LeadsPage from "./pages/crm/LeadsPage";
import OpportunitiesPage from "./pages/crm/OpportunitiesPage";
import PipelinePage from "./pages/crm/PipelinePage";
import AccountsPage from "./pages/crm/AccountsPage";
import ContactsPage from "./pages/crm/ContactsPage";
import ActivitiesPage from "./pages/crm/ActivitiesPage";

import CPQDashboard from "./pages/cpq/CPQDashboard";
import ProductsPage from "./pages/cpq/ProductsPage";
import QuoteDetailPage from "./pages/cpq/QuoteDetailPage";
import QuotesListPage from "./pages/cpq/QuotesListPage";
import QuoteBuilderPage from "./pages/cpq/QuoteBuilderPage";

import ERPDashboard from "./pages/erp/ERPDashboard";
import InventoryPage from "./pages/erp/InventoryPage";
import ProcurementPage from "./pages/erp/ProcurementPage";
import ProductionPage from "./pages/erp/ProductionPage";
import FinancePage from "./pages/erp/FinancePage";

import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <Routes>
            {/* Public routes - accessible by everyone */}
            <Route path="/" element={<Index />} />
            <Route path="/products" element={<Products />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* --- ADMIN ROUTES --- */}
            {/* This matches the navigate("/admin") from your login form */}
            <Route path="/admin" element={
              <AdminRoute>
                {/* Replace <Dashboard /> with your specific <AdminDashboard /> component when ready */}
                <AdminDashboard /> 
              </AdminRoute>
            } />

            {/* --- EMPLOYEE ROUTES --- */}
            <Route path="/dashboard" element={
              <EmployeeRoute>
                <Dashboard />
              </EmployeeRoute>
            } />
            <Route path="/dashboard/cpq" element={
              <EmployeeRoute>
                <CPQDashboard />
              </EmployeeRoute>
            } />
            <Route path="/dashboard/cpq/products" element={
              <EmployeeRoute>
                <ProductsPage />
              </EmployeeRoute>
            } />
            <Route path="/dashboard/cpq/quotes" element={
              <EmployeeRoute>
                <QuotesListPage />
              </EmployeeRoute>
            } />
            <Route path="dashboard/cpq/quotes/:id/edit" element={
              <EmployeeRoute>
                <QuoteBuilderPage />
              </EmployeeRoute>}
            />
            <Route path="dashboard/cpq/quotes/:id" element={
              <EmployeeRoute>
                <QuoteDetailPage />
              </EmployeeRoute>}
            />

            <Route path="/dashboard/cpq/quotes/new" element={
              <EmployeeRoute>
                <QuoteBuilderPage />
              </EmployeeRoute>
            } />


            <Route path="/dashboard/clm" element={
              <EmployeeRoute>
                <CLMDashboard />
              </EmployeeRoute>
            } />
            <Route path="/dashboard/crm" element={
              <EmployeeRoute>
                <CRMLayout />
              </EmployeeRoute>
            } />
            <Route path="/dashboard/clm/contracts" element={
              <EmployeeRoute>
                <ContractsPage />
              </EmployeeRoute>
            } />
            <Route path="/dashboard/clm/Templates" element={
              <EmployeeRoute>
                <TemplatesPage />
              </EmployeeRoute>
            } />


            <Route path="/dashboard/crm/leads" element={
              <EmployeeRoute>
                <LeadsPage />
              </EmployeeRoute>
            } />
            <Route path="/dashboard/crm/pipeline" element={
              <EmployeeRoute>
                <PipelinePage />
              </EmployeeRoute>
            } />
            <Route path="/dashboard/crm/accounts" element={
              <EmployeeRoute>
                <AccountsPage />
              </EmployeeRoute>
            } />
            <Route path="/dashboard/crm/contacts" element={
              <EmployeeRoute>
                <ContactsPage />
              </EmployeeRoute>
            } />
            <Route path="/dashboard/crm/opportunities" element={
              <EmployeeRoute>
                <OpportunitiesPage />
              </EmployeeRoute>
            } />
            <Route path="/dashboard/crm/activities" element={
              <EmployeeRoute>
                <ActivitiesPage />
              </EmployeeRoute>
            } />


            <Route path="/dashboard/analytics" element={
              <EmployeeRoute>
                <Dashboard />
              </EmployeeRoute>
            } />
            
            {/* REMOVED the old /dashboard/admin route since we now have the dedicated /admin route above */}

            <Route path="/dashboard/documents" element={
              <EmployeeRoute>
                <DocumentsDashboard />
              </EmployeeRoute>
            } />
            <Route path="/dashboard/documents/create" element={
              <EmployeeRoute>
                <DocumentCreatePage />
              </EmployeeRoute>
            } />
            <Route path="/dashboard/documents/templates" element={
              <EmployeeRoute>
                <DocumentTemplatesPage />
              </EmployeeRoute>
            } />
            <Route path="/dashboard/documents/history" element={
              <EmployeeRoute>
                <DocumentHistoryPage />
              </EmployeeRoute>
            } />
            <Route path="/dashboard/documents/pending" element={
              <EmployeeRoute>
                <PendingSignaturesPage />
              </EmployeeRoute>
            } />

            <Route path="/dashboard/erp" element={
              <EmployeeRoute>
                <ERPDashboard />
              </EmployeeRoute>
            } />
            <Route path="/dashboard/erp/inventory" element={
              <EmployeeRoute>
                <InventoryPage />
              </EmployeeRoute>
            } />
            <Route path="/dashboard/erp/procurement" element={
              <EmployeeRoute>
                <ProcurementPage />
              </EmployeeRoute>
            } />
            <Route path="/dashboard/erp/production" element={
              <EmployeeRoute>
                <ProductionPage />
              </EmployeeRoute>
            } />
            <Route path="/dashboard/erp/finance" element={
              <EmployeeRoute>
                <FinancePage />
              </EmployeeRoute>
            } />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;