"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-slate-200/90 bg-white px-3 text-left text-sm text-slate-800 transition-[color,box-shadow,border-color] dark:border-zinc-600/70 dark:bg-zinc-900/50 dark:text-zinc-200",
      "outline-none hover:border-slate-300/90 dark:hover:border-zinc-500/80",
      "focus-visible:border-slate-400/80 focus-visible:ring-2 focus-visible:ring-slate-400/20 dark:focus-visible:border-zinc-500 dark:focus-visible:ring-zinc-500/20",
      "data-[state=open]:border-slate-400/90 data-[state=open]:shadow-sm dark:data-[state=open]:border-zinc-500 dark:data-[state=open]:shadow-[0_1px_0_0_rgba(0,0,0,0.2)]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown
        className="h-3.5 w-3.5 shrink-0 text-slate-500/80 dark:text-zinc-500"
        strokeWidth={2}
        aria-hidden
      />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "z-[100] min-w-[var(--radix-select-trigger-width)] max-h-[min(18rem,var(--radix-select-content-available-height))] overflow-y-auto overflow-x-hidden rounded-lg border border-slate-200/90 bg-white py-1 text-slate-800 shadow-md ring-1 ring-slate-900/5 dark:border-zinc-600/50 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-white/5 dark:shadow-[0_8px_30px_rgba(0,0,0,0.45)]",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      sideOffset={6}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-md py-1.5 pl-7 pr-2.5 text-sm text-slate-700 outline-none",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
      "data-[highlighted]:bg-slate-100/90 data-[highlighted]:text-slate-900",
      "dark:text-zinc-300 dark:data-[highlighted]:bg-zinc-800/80 dark:data-[highlighted]:text-zinc-100",
      "data-[state=checked]:font-medium",
      className
    )}
    {...props}
  >
    <span className="absolute left-1.5 flex h-3.5 w-3.5 items-center justify-center text-slate-500 dark:text-zinc-500">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-3.5 w-3.5" strokeWidth={2.25} />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectTrigger,
};
