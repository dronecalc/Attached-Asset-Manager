import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <AlertCircle className="w-20 h-20 text-destructive/50" />
        <div className="space-y-2">
          <h1 className="text-4xl font-display font-bold uppercase tracking-widest text-foreground">404 - Target Lost</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            The coordinates you provided do not exist in our database. Return to the firing line.
          </p>
        </div>
        <Link 
          href="/" 
          className="mt-8 px-6 py-3 bg-primary text-primary-foreground font-display font-bold uppercase tracking-widest text-sm rounded-md shadow-[0_0_15px_rgba(255,157,0,0.2)] hover:shadow-[0_0_25px_rgba(255,157,0,0.4)] transition-all inline-flex items-center gap-2"
        >
          Return to Calculator
        </Link>
      </div>
    </Layout>
  );
}
