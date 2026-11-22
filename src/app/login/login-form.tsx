"use client";

import { Button } from "@/components/ui/button";
import { useFormAction } from "@/components/use-form-action";
import { signIn } from "@/features/auth/actions";

// An answer line on the paper: no box, just the rule to write on. What you
// type is set in ballpen blue. The inset shadow keeps the browser's autofill
// tint from painting a box over the paper.
const answerLine =
  "h-9 w-full max-w-sm border-b-2 border-foreground/75 bg-transparent px-0.5 text-lg font-medium text-[#1f3f8f] outline-none transition-colors focus-visible:border-link focus-visible:bg-link/6 autofill:shadow-[inset_0_0_0_100px_#fdfdfa] autofill:[-webkit-text-fill-color:#1f3f8f]";

const label = "flex h-9 items-end pb-1 text-[0.95rem] leading-none font-semibold";

export function LoginForm() {
  const { state, pending, onSubmit, action } = useFormAction(signIn);

  return (
    <form action={action} onSubmit={onSubmit}>
      {/* One blank rule above each question, like skipping a line on paper. */}
      <label htmlFor="email" className={`${label} mt-9`}>
        Email
      </label>
      <input id="email" name="email" type="email" autoComplete="username" required autoFocus className={answerLine} />

      <label htmlFor="password" className={label}>
        Password
      </label>
      <input id="password" name="password" type="password" autoComplete="current-password" required className={answerLine} />

      {/* A wrong answer is marked in red pen on the next line. The line is always there so nothing jumps. */}
      <p role="alert" className="flex min-h-9 items-end pb-1.5 leading-none font-semibold text-old">
        {state.message}
      </p>

      <div className="flex h-18 items-center">
        <Button type="submit" size="lg" disabled={pending} className="min-w-36">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </div>
    </form>
  );
}
