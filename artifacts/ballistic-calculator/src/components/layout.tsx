import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Crosshair, Target, Database, Menu } from "lucide-react";
import { motion } from "framer-motion";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Tactical Background Texture */}
      <div 
        className="fixed inset-0 z-0 opacity-10 pointer-events-none"
        style={{ 
          backgroundImage: `url(${import.meta.env.BASE_URL}images/tactical-bg.png)`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          mixBlendMode: 'overlay'
        }}
      />
      
      {/* Navbar */}
      <header className="relative z-20 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(255,157,0,0.15)]">
              <Crosshair className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display font-bold text-2xl tracking-widest text-primary">
              BALLISTI<span className="text-foreground">CALC</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <Link 
              href="/" 
              className={`px-4 py-2 rounded-md font-display uppercase tracking-widest text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                location === "/" 
                  ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(255,157,0,0.3)]" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Target className="w-4 h-4" />
              Calculator
            </Link>
            <Link 
              href="/profiles" 
              className={`px-4 py-2 rounded-md font-display uppercase tracking-widest text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                location === "/profiles" 
                  ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(255,157,0,0.3)]" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Database className="w-4 h-4" />
              Profiles
            </Link>
          </nav>

          <button className="md:hidden p-2 text-muted-foreground hover:text-foreground">
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col">
        <motion.div 
          key={location}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 container mx-auto px-4 py-6 md:py-8"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
