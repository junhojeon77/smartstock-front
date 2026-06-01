import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-cyan-500 text-slate-900 font-semibold hover:bg-cyan-400 active:bg-cyan-600 focus-visible:ring-cyan-500/40 shadow-sm shadow-cyan-500/20",
  secondary:
    "bg-slate-800 text-slate-200 border border-slate-700/80 hover:bg-slate-700 hover:border-slate-600 focus-visible:ring-slate-500/30",
  ghost:
    "bg-transparent text-slate-400 hover:bg-slate-800/80 hover:text-slate-200 focus-visible:ring-slate-700",
  danger:
    "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:text-red-300 focus-visible:ring-red-500/30",
};

export function Button({
  variant = "primary",
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
        variants[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    />
  );
}
