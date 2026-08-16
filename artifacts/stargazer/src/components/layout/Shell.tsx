import { Link, useLocation } from 'wouter';
import { 
  Telescope, 
  Moon, 
  Orbit, 
  Sparkles, 
  CloudRainWind,
  Satellite,
  Compass,
  Map as MapIcon,
  Sun,
  Aperture,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { ObservatoryClocks } from '@/components/ObservatoryClocks';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: Telescope },
  { path: '/skymap', label: 'Sky Map', icon: MapIcon },
  { path: '/planets', label: 'Planets', icon: Orbit },
  { path: '/moon', label: 'Moon', icon: Moon },
  { path: '/stars', label: 'Stars', icon: Sparkles },
  { path: '/deep-sky', label: 'Deep Sky', icon: Compass },
  { path: '/iss', label: 'ISS Tracker', icon: Satellite },
  { path: '/weather', label: 'Conditions', icon: CloudRainWind },
  { path: '/analemma', label: 'Analemma', icon: Sun },
  { path: '/milkyway', label: 'Milky Way', icon: Aperture },
];

export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-[100dvh] bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col hidden md:flex flex-shrink-0 z-10">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3 text-primary hover:text-primary/80 transition-colors">
            <Telescope className="w-8 h-8" />
            <span className="font-mono font-bold text-xl tracking-tight glow-text">StarGazer</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 text-sm font-medium",
                  isActive 
                    ? "bg-primary/10 text-primary glow-text" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "opacity-70")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Right column */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Clock bar — spans full width, always visible on every tab */}
        <ObservatoryClocks />

        {/* Main Content */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {/* Mobile Header */}
          <header className="h-14 border-b border-border bg-background/80 backdrop-blur-md flex items-center px-4 md:hidden z-20 shrink-0">
            <Telescope className="w-6 h-6 text-primary mr-2" />
            <span className="font-mono font-bold text-lg text-primary glow-text">StarGazer</span>
          </header>
          
          <div className="flex-1 overflow-y-auto w-full relative z-0">
            <div className="max-w-6xl mx-auto p-4 md:p-8 min-h-full flex flex-col">
              {children}
            </div>
          </div>
        </main>
        
        {/* Mobile Bottom Nav — scrollable so all items are reachable */}
        <nav className="h-16 border-t border-border bg-background/95 backdrop-blur-md flex items-center md:hidden z-20 shrink-0 overflow-x-auto scrollbar-none">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.path}
                href={item.path}
                className={cn(
                  "flex flex-col items-center justify-center min-w-[4.25rem] h-full px-1 transition-colors shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-[9px] leading-none font-medium text-center whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
