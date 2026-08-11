import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { LocationProvider } from '@/contexts/LocationContext';
import { Shell } from '@/components/layout/Shell';

import Dashboard from '@/pages/Dashboard';
import Planets from '@/pages/Planets';
import Moon from '@/pages/Moon';
import Stars from '@/pages/Stars';
import DeepSky from '@/pages/DeepSky';
import Events from '@/pages/Events';
import ISS from '@/pages/ISS';
import Weather from '@/pages/Weather';
import SkyMap from '@/pages/SkyMap';

const queryClient = new QueryClient();

function Router() {
  return (
    <Shell>
      <RoutedErrorBoundary>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/planets" component={Planets} />
          <Route path="/moon" component={Moon} />
          <Route path="/stars" component={Stars} />
          <Route path="/deep-sky" component={DeepSky} />
          <Route path="/events" component={Events} />
          <Route path="/iss" component={ISS} />
          <Route path="/weather" component={Weather} />
          <Route path="/skymap" component={SkyMap} />
          <Route component={NotFound} />
        </Switch>
      </RoutedErrorBoundary>
    </Shell>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocationProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </LocationProvider>
    </QueryClientProvider>
  );
}

export default App;
