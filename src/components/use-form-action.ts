"use client";

import { startTransition, useActionState, type FormEvent } from "react";

import { idle, type ActionResult } from "@/lib/action-result";

/**
 * Runs a server action from a form without React clearing the fields
 * afterwards, so a rejected entry keeps what the person typed.
 */
export function useFormAction(action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>) {
  const [state, dispatch, pending] = useActionState(async (prev: ActionResult, formData: FormData) => {
    const result = await action(prev, formData);
    // A rejected entry keeps the stamp and remembered values of the last save,
    // so forms keyed on the stamp do not clear themselves on an error.
    return result.ok ? result : { ...result, stamp: prev.stamp, keep: prev.keep };
  }, idle);
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => dispatch(data));
  };
  return { state, pending, onSubmit };
}
