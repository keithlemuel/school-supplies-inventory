// Creates a sign-in from the command line. There is no public sign-up page, so
// this (or Authentication -> Users in the Supabase dashboard) is how people get in.
//
//   pnpm create-user --email you@example.com --name "Your Name"
//
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY from .env.local.
// You are asked for the password; it is never written anywhere.

import { createClient } from "@supabase/supabase-js";
import { createInterface } from "node:readline";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: { email: { type: "string" }, name: { type: "string" } },
});

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local first.");
  process.exit(1);
}
if (!values.email || !values.name) {
  console.error('Usage: pnpm create-user --email <email> --name "<full name>"');
  process.exit(1);
}

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    rl._writeToOutput = (text) => {
      if (text.includes(question)) rl.output.write(question);
    };
  });
}

const password = await askHidden(`Password for ${values.email} (at least 8 characters): `);
if (password.length < 8) {
  console.error("Password too short.");
  process.exit(1);
}

const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const { error } = await supabase.auth.admin.createUser({
  email: values.email,
  password,
  email_confirm: true,
  user_metadata: { full_name: values.name },
});
if (error) {
  console.error(`Could not create the sign-in: ${error.message}`);
  process.exit(1);
}

console.log(`Created an account for ${values.name} on ${new URL(url).host}.`);
