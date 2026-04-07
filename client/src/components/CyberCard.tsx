import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CyberCardProps {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "danger";
}

export function CyberCard({ children, className, variant = "primary" }: CyberCardProps) {
  const borderColor = 
    variant === "secondary" ? "border-secondary/50" : 
    variant === "danger" ? "border-destructive/50" : 
    "border-primary/50";

  const glowClass = 
    variant === "secondary" ? "shadow-[0_0_15px_rgba(0,255,255,0.1)]" :
    variant === "danger" ? "shadow-[0_0_15px_rgba(255,0,0,0.1)]" :
    "shadow-[0_0_15px_rgba(0,255,0,0.1)]";

  return (
    <div className={cn(
      "relative bg-black/80 backdrop-blur-md border border-t-2 border-b-0 border-x-0",
      borderColor,
      glowClass,
      "p-6 overflow-hidden group",
      className
    )}>
      {/* Corner decorations */}
      <div className={cn("absolute top-0 left-0 w-2 h-2 border-t border-l", borderColor.replace("/50", ""))}></div>
      <div className={cn("absolute top-0 right-0 w-2 h-2 border-t border-r", borderColor.replace("/50", ""))}></div>
      <div className={cn("absolute bottom-0 left-0 w-2 h-2 border-b border-l", borderColor.replace("/50", ""))}></div>
      <div className={cn("absolute bottom-0 right-0 w-2 h-2 border-b border-r", borderColor.replace("/50", ""))}></div>

      {/* Scan line effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent -translate-y-full group-hover:translate-y-full transition-transform duration-1000 pointer-events-none" />
      
      {children}
    </div>
  );
}
