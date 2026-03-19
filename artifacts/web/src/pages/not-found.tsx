import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground p-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 glass-panel p-12 rounded-3xl max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">404</h1>
          <h2 className="text-xl font-medium text-gray-300">Unrecognized Intent</h2>
        </div>
        
        <p className="text-sm text-muted-foreground font-mono bg-black/50 p-4 rounded-lg border border-white/5 text-left">
          <span className="text-red-400">Error:</span> No tool available for intent.<br/>
          Suggestion: Return to the main registry.
        </p>

        <Link href="/" className="inline-block pt-4">
          <Button variant="default" className="w-full">
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
