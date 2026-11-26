"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { cn } from "cn";

import { controlClass } from "@/components/control-class";
import { Button } from "@/components/ui/button";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  optional,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: React.ReactNode;
  error?: string;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label id={`${htmlFor}-label`} htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
        {label}
        {optional ? <span className="font-normal text-muted-foreground"> (optional)</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(controlClass, "h-10", className)} {...props} />;
}

export function TextArea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn(controlClass, "min-h-20 py-2", className)} {...props} />;
}

export function SubmitButton({
  children,
  pendingLabel,
  ...props
}: React.ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button {...props} type="submit" disabled={pending || props.disabled}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}

export function FormMessage({ ok, message }: { ok: boolean; message?: string }) {
  if (!message) return null;
  return (
    <p
      role={ok ? "status" : "alert"}
      className={cn(
        "rounded-md border px-3 py-2 text-sm font-medium",
        ok ? "border-fresh/30 bg-fresh/8 text-fresh" : "border-destructive/30 bg-destructive/8 text-destructive",
      )}
    >
      {message}
    </p>
  );
}
