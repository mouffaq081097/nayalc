"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "../../lib/utils"

// One thumb per value, so a [min, max] price range gets two handles
const Slider = React.forwardRef(({ className, ...props }, ref) => {
  const thumbs = (props.value || props.defaultValue || [0]).length;
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn("relative flex w-full touch-none select-none items-center py-2", className)}
      {...props}>
      <SliderPrimitive.Track
        className="relative h-[3px] w-full grow overflow-hidden rounded-full bg-[#e5e5e5]">
        <SliderPrimitive.Range className="absolute h-full bg-[#111114]" />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbs }).map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          aria-label={thumbs === 2 ? (i === 0 ? "Minimum" : "Maximum") : undefined}
          className="block h-[18px] w-[18px] rounded-full border-2 border-[#111114] bg-white cursor-grab transition-shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/10 disabled:pointer-events-none disabled:opacity-50" />
      ))}
    </SliderPrimitive.Root>
  );
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
