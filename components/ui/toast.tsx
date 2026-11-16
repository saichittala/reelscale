"use client";

import React, { useCallback, useEffect } from "react";
import {
  ToastStack,
  ToastStackProvider,
  useToastStack,
  type ToastOptions,
  type ToastType,
} from "@/components/arc/toast-stack/toast-stack";

type ToastListener = (options: ToastOptions) => void;
type DismissListener = (id?: string) => void;

const listeners = new Set<ToastListener>();
const dismissListeners = new Set<DismissListener>();

/**
 * Imperative global toast API callable anywhere in the application (even outside React render tree).
 */
export function toast(options: ToastOptions | string, type?: ToastType): string {
  const opts: ToastOptions =
    typeof options === "string"
      ? {
          title: options,
          type: type || "info",
        }
      : options;

  listeners.forEach((fn) => fn(opts));
  return opts.id || "";
}

toast.success = (title: string, description?: string) =>
  toast({ title, description, type: "success" });

toast.error = (title: string, description?: string) =>
  toast({ title, description, type: "error" });

toast.info = (title: string, description?: string) =>
  toast({ title, description, type: "info" });

toast.warning = (title: string, description?: string) =>
  toast({ title, description, type: "warning" });

toast.loading = (title: string, description?: string) =>
  toast({ title, description, type: "loading" });

toast.dismiss = (id?: string) => {
  dismissListeners.forEach((fn) => fn(id));
};

function ToastBridge() {
  const { toast: triggerToast, dismiss } = useToastStack();

  useEffect(() => {
    const handleToast: ToastListener = (opts) => {
      triggerToast(opts);
    };
    const handleDismiss: DismissListener = (id) => {
      dismiss(id);
    };

    listeners.add(handleToast);
    dismissListeners.add(handleDismiss);

    return () => {
      listeners.delete(handleToast);
      dismissListeners.delete(handleDismiss);
    };
  }, [triggerToast, dismiss]);

  return <ToastStack position="top-center" hotkey />;
}

export interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <ToastStackProvider duration={4500} limit={8}>
      {children}
      <ToastBridge />
    </ToastStackProvider>
  );
}

export function useToast() {
  const stack = useToastStack();

  const showToast = useCallback(
    (msg: string, type: ToastType = "info") => {
      return stack.toast({
        title: msg,
        type,
      });
    },
    [stack]
  );

  return {
    ...stack,
    showToast,
    toast,
  };
}

export { ToastStack, ToastStackProvider, useToastStack };
export type { ToastOptions, ToastType };
