"use client";

import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator"; // Removed version number

import { cn } from "./utils";

const Separator = React.forwardRef(
  ({
    className,
    orientation = "horizontal",
    decorative = true,
    ...props
  }, ref) => ( // Removed type annotation
    <SeparatorPrimitive.Root
      ref={ref} // Added ref
      data-slot="separator-root"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className,
      )}
      {...props}
    />
  )
);
Separator.displayName = SeparatorPrimitive.Root.displayName; // Added display name

export { Separator };