import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Calculator from "@/pages/calculator";
import UploadPage from "@/pages/upload";
import NotFound from "@/pages/not-found";
import { Calculator as CalculatorIcon, Upload as UploadIcon } from "lucide-react";

function Navigation() {
  const [location] = useLocation();
  
  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="container mx-auto">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">Data Management</h1>
          <div className="flex gap-2">
            <Link to="/">
              <Button
                variant={location === "/" ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-2"
              >
                <CalculatorIcon className="h-4 w-4" />
                Calculator
              </Button>
            </Link>
            <Link to="/upload">
              <Button
                variant={location === "/upload" ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-2"
              >
                <UploadIcon className="h-4 w-4" />
                Upload Excel
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Router() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="py-6">
        <Switch>
          <Route path="/" component={Calculator} />
          <Route path="/upload" component={UploadPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
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
