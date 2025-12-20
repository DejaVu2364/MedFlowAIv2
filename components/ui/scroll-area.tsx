import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import { cn } from "../../lib/utils"

const ScrollArea = React.forwardRef<
    React.ElementRef<typeof ScrollAreaPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
    <ScrollAreaPrimitive.Root
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        {...props}
    >
        <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit] scroll-smooth">
            {children}
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar />
        <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

const ScrollBar = React.forwardRef<
    React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
    React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
        ref={ref}
        orientation={orientation}
        className={cn(
            "flex touch-none select-none transition-all duration-300",
            // Thinner, more elegant scrollbar
            orientation === "vertical" &&
            "h-full w-1.5 border-l border-l-transparent p-[1px] hover:w-2 hover:bg-slate-100/50 dark:hover:bg-slate-800/50",
            orientation === "horizontal" &&
            "h-1.5 border-t border-t-transparent p-[1px] hover:h-2 hover:bg-slate-100/50 dark:hover:bg-slate-800/50",
            className
        )}
        {...props}
    >
        <ScrollAreaPrimitive.ScrollAreaThumb
            className={cn(
                "relative flex-1 rounded-full transition-all duration-200",
                // Elegant teal gradient thumb
                "bg-slate-300/60 dark:bg-slate-600/60",
                "hover:bg-teal-500/70 dark:hover:bg-teal-400/70",
                "active:bg-teal-600/80 dark:active:bg-teal-500/80"
            )}
        />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
