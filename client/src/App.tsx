import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Calculator from "@/pages/calculator";
import MinimumBudgetCalculator from "@/pages/minimum-budget";
import FeeMatrix from "@/pages/fee-matrix";
import ProjectDashboard from "@/pages/project-dashboard";
import NotFound from "@/pages/not-found";

function NavBar() {
  const [location] = useLocation();
  
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:justify-between h-auto sm:h-16 py-3 sm:py-0">
          <div className="flex items-center justify-center sm:justify-start mb-3 sm:mb-0">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-scientific-blue rounded-md flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">PC</span>
              </div>
              <span className="text-lg sm:text-xl font-semibold text-gray-900">Project Calculator</span>
            </div>
          </div>
          <nav className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
            <Link href="/">
              <Button 
                variant={(location === "/" || location === "/dashboard") ? "default" : "ghost"}
                className="text-xs sm:text-sm w-full sm:w-auto px-2 sm:px-4 py-2"
              >
                <span className="hidden lg:inline">Project Dashboard</span>
                <span className="lg:hidden">Dashboard</span>
              </Button>
            </Link>
            <Link href="/minimum-budget">
              <Button 
                variant={location === "/minimum-budget" ? "default" : "ghost"}
                className="text-xs sm:text-sm w-full sm:w-auto px-2 sm:px-4 py-2"
              >
                <span className="hidden lg:inline">Budget Calculator</span>
                <span className="lg:hidden">Budget</span>
              </Button>
            </Link>
            <Link href="/fee-matrix">
              <Button 
                variant={location === "/fee-matrix" ? "default" : "ghost"}
                className="text-xs sm:text-sm w-full sm:w-auto px-2 sm:px-4 py-2"
              >
                <span className="hidden lg:inline">Fee Calculator</span>
                <span className="lg:hidden">Fees</span>
              </Button>
            </Link>
            <Link href="/hourly-factor">
              <Button 
                variant={location === "/hourly-factor" ? "default" : "ghost"}
                className="text-xs sm:text-sm w-full sm:w-auto px-2 sm:px-4 py-2"
              >
                <span className="hidden lg:inline">Hourly Factor</span>
                <span className="lg:hidden">HF Calc</span>
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <div>
      <NavBar />
      <Switch>
        <Route path="/" component={ProjectDashboard} />
        <Route path="/dashboard" component={ProjectDashboard} />
        <Route path="/hourly-factor" component={Calculator} />
        <Route path="/minimum-budget" component={MinimumBudgetCalculator} />
        <Route path="/fee-matrix" component={FeeMatrix} />
        <Route component={NotFound} />
      </Switch>
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
