import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start space-x-3 overflow-hidden rounded-xl border p-4 pr-8 shadow-2xl transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full backdrop-blur-sm",
  {
    variants: {
      variant: {
        // Light mode + Dark mode pour chaque variante
        default: cn(
          // Light mode
          "border-border bg-gradient-to-br from-white to-gray-50 text-foreground",
          // Dark mode
          "dark:border-gray-800 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800 dark:text-gray-100"
        ),
        success: cn(
          // Light mode
          "border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-900",
          // Dark mode
          "dark:border-emerald-800 dark:bg-gradient-to-br dark:from-emerald-950 dark:to-emerald-900 dark:text-emerald-100"
        ),
        destructive: cn(
          // Light mode
          "border-red-200 bg-gradient-to-br from-red-50 to-red-100 text-red-900",
          // Dark mode
          "dark:border-red-800 dark:bg-gradient-to-br dark:from-red-950 dark:to-red-900 dark:text-red-100"
        ),
        warning: cn(
          // Light mode
          "border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 text-amber-900",
          // Dark mode
          "dark:border-amber-800 dark:bg-gradient-to-br dark:from-amber-950 dark:to-amber-900 dark:text-amber-100"
        ),
        info: cn(
          // Light mode
          "border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-900",
          // Dark mode
          "dark:border-blue-800 dark:bg-gradient-to-br dark:from-blue-950 dark:to-blue-900 dark:text-blue-100"
        ),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      // Light mode
      "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border bg-transparent px-3 text-sm font-medium transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      // Dark mode
      "dark:border-gray-700 dark:hover:bg-gray-800 dark:focus:ring-gray-600",
      className
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      // Light mode
      "absolute right-2 top-2 rounded-md p-1 opacity-0 transition-all hover:scale-110 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100",
      // Dark mode
      "dark:text-gray-400 dark:hover:text-gray-100 dark:focus:ring-gray-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastIcon = ({ variant }: { variant?: string }) => {
  const iconClass = "h-5 w-5 mt-0.5";

  switch (variant) {
    case "success":
      return (
        <CheckCircle
          className={cn(iconClass, "text-emerald-600 dark:text-emerald-400")}
        />
      );
    case "destructive":
      return (
        <AlertCircle
          className={cn(iconClass, "text-red-600 dark:text-red-400")}
        />
      );
    case "warning":
      return (
        <AlertTriangle
          className={cn(iconClass, "text-amber-600 dark:text-amber-400")}
        />
      );
    case "info":
      return (
        <Info className={cn(iconClass, "text-blue-600 dark:text-blue-400")} />
      );
    default:
      return (
        <Info className={cn(iconClass, "text-gray-600 dark:text-gray-400")} />
      );
  }
};

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold tracking-tight", className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90 leading-relaxed", className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastIcon,
};
