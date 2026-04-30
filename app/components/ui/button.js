import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "./utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "[background:linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))] text-white hover:opacity-95 hover:shadow-[0_8px_20px_-4px_rgba(167,139,250,0.3)] rounded-full border-none",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        pillPrimary:
          "rounded-full border-none [background:linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))] text-white shadow-sm hover:opacity-95 hover:shadow-[0_8px_20px_-4px_rgba(167,139,250,0.4)] active:scale-[0.97] transition-all duration-300",
        pillSecondary:
          "rounded-full border-none [background:linear-gradient(135deg,rgb(196,167,254),rgb(126,105,230))] text-white shadow-sm hover:opacity-95 hover:shadow-[0_8px_20px_-4px_rgba(167,139,250,0.4)] active:scale-[0.98]",
        pillGlass:
          "rounded-full border border-black/10 bg-white/70 text-[#1d1d1f] shadow-sm backdrop-blur-md hover:bg-white/90 active:scale-[0.98] focus-visible:ring-black/15 dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20",
        navTab:
          "h-auto min-h-[52px] flex-1 flex-col gap-0.5 rounded-none border-0 bg-transparent py-2 text-[10px] font-semibold tracking-tight text-gray-400 shadow-none hover:bg-black/[0.04] hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-black/10 focus-visible:ring-offset-0 active:bg-black/[0.06] md:min-h-0",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-md",
        pill: "h-11 min-h-[44px] rounded-full px-5 text-xs font-semibold",
        pillIcon:
          "size-11 min-h-[44px] min-w-[44px] rounded-full p-0 [&_svg]:size-[18px]",
        pillSm: "h-9 min-h-[40px] rounded-full px-4 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
    compoundVariants: [
      {
        variant: "navTab",
        size: "default",
        class:
          "!h-auto min-h-[52px] border-0 px-0.5 py-2 font-semibold shadow-none",
      },
    ],
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
