import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Calculator from "@/pages/calculator";
import MinimumBudgetCalculator from "@/pages/minimum-budget";
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
                variant={location === "/" ? "default" : "ghost"}
                className="text-xs sm:text-sm w-full sm:w-auto px-2 sm:px-4 py-2"
              >
                <span className="hidden sm:inline">Hourly Factor Calculator</span>
                <span className="sm:hidden">Hourly Factor</span>
              </Button>
            </Link>
            <Link href="/minimum-budget">
              <Button 
                variant={location === "/minimum-budget" ? "default" : "ghost"}
                className="text-xs sm:text-sm w-full sm:w-auto px-2 sm:px-4 py-2"
              >
                <span className="hidden sm:inline">Minimum Budget Calculator</span>
                <span className="sm:hidden">Min Budget</span>
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
        <Route path="/" component={Calculator} />
        <Route path="/minimum-budget" component={MinimumBudgetCalculator} />
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
