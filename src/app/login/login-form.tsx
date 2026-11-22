"use client";

import { Field, FormMessage, TextInput } from "@/components/form";
import { Button } from "@/components/ui/button";
import { useFormAction } from "@/components/use-form-action";
import { signIn } from "@/features/auth/actions";

export function LoginForm() {
  const { state, pending, onSubmit } = useFormAction(signIn);

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
      <FormMessage ok={false} message={state.message} />
      <Field label="Email" htmlFor="email">
        <TextInput id="email" name="email" type="email" autoComplete="username" required autoFocus />
      </Field>
      <Field label="Password" htmlFor="password">
        <TextInput id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Button type="submit" size="lg" disabled={pending} className="mt-1">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
