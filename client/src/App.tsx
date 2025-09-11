import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Services from "@/pages/services";
import ServiceDetail from "@/pages/service-detail";
import OrderForm from "@/pages/order-form";
import Blog from "@/pages/blog";
import BlogPost from "@/pages/blog-post";
import Portfolio from "@/pages/portfolio";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminServices from "@/pages/admin/services";
import AdminClients from "@/pages/admin/clients";
import AdminPortfolio from "@/pages/admin/portfolio";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import TelegramBanner from "@/components/telegram-banner";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import ChatWidget from "@/components/chat-widget";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/services" component={Services} />
      <Route path="/services/:id" component={ServiceDetail} />
      <Route path="/order" component={OrderForm} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/portfolio" component={Portfolio} />
      
      {/* Admin routes */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/panel" component={AdminDashboard} />
      <Route path="/admin/services" component={AdminServices} />
      <Route path="/admin/clients" component={AdminClients} />
      <Route path="/admin/portfolio" component={AdminPortfolio} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col">
          <TelegramBanner />
          <Header />
          <main className="flex-1">
            <Router />
          </main>
          <Footer />
          <PWAInstallPrompt />
          <ChatWidget />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
