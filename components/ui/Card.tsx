import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  hover?: boolean;
};

export function Card({ className, hover, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-800/70 bg-slate-900/50 backdrop-blur-sm shadow-lg shadow-black/10",
        hover &&
          "transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-700/70 hover:shadow-black/20",
        className,
      )}
      {...props}
    />
  );
}
