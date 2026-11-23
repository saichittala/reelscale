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
type UpdateListener = (id: string, patch: Partial<Omit<ToastOptions, "id">>) => void;

const listeners = new Set<ToastListener>();
const dismissListeners = new Set<DismissListener>();
const updateListeners = new Set<UpdateListener>();

let toastIdCounter = 0;

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
      : { ...options };

  if (!opts.id) {
    toastIdCounter += 1;
    opts.id = `toast-${Date.now()}-${toastIdCounter}`;
  }

  listeners.forEach((fn) => fn(opts));
  return opts.id;
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

toast.update = (id: string, patch: Partial<Omit<ToastOptions, "id">>) => {
  updateListeners.forEach((fn) => fn(id, patch));
};

toast.dismiss = (id?: string) => {
  const targetId = id && typeof id === "string" && id.trim() !== "" ? id : undefined;
  dismissListeners.forEach((fn) => fn(targetId));
};

function ToastBridge() {
  const { toast: triggerToast, update: triggerUpdate, dismiss: triggerDismiss } = useToastStack();

  useEffect(() => {
    const handleToast: ToastListener = (opts) => {
      triggerToast(opts);
    };
    const handleUpdate: UpdateListener = (id, patch) => {
      triggerUpdate(id, patch);
    };
    const handleDismiss: DismissListener = (id) => {
      triggerDismiss(id);
    };

    listeners.add(handleToast);
    updateListeners.add(handleUpdate);
    dismissListeners.add(handleDismiss);

    return () => {
      listeners.delete(handleToast);
      updateListeners.delete(handleUpdate);
      dismissListeners.delete(handleDismiss);
    };
  }, [triggerToast, triggerUpdate, triggerDismiss]);

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
