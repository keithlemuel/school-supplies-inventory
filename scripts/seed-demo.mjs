// Fills a LOCAL database with a demo sign-in and sample stock so the screens
// have something to show. It refuses to run against anything but localhost.
//
//   pnpm db:reset && pnpm seed:demo
//
// Demo sign-in (local only): the email and password are the two constants below.

import { createClient } from "@supabase/supabase-js";

const DEMO_EMAIL = "demo@stockroom.test";
const DEMO_PASSWORD = "stockroom-demo";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !publishable || !secret) {
  console.error("Set the three Supabase variables in .env.local first.");
  process.exit(1);
}
if (!["127.0.0.1", "localhost"].includes(new URL(url).hostname)) {
  console.error(`Refusing to seed ${new URL(url).host}: demo data is for the local database only.`);
  process.exit(1);
}

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, secret, noSession);
const staff = createClient(url, publishable, noSession);

function check(label, { error, data }) {
  if (error) {
    console.error(`${label}: ${error.message}`);
    process.exit(1);
  }
  return data;
}

const daysAgo = (days) => {
  const day = new Date(Date.now() + 8 * 3600_000 - days * 86_400_000);
  return day.toISOString().slice(0, 10);
};

const created = await admin.auth.admin.createUser({
  email: DEMO_EMAIL,
  password: DEMO_PASSWORD,
  email_confirm: true,
  user_metadata: { full_name: "Demo Owner" },
});
if (created.error && !/already/i.test(created.error.message)) check("Create demo user", created);
check("Sign in", await staff.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD }));

const existing = check("Check items", await staff.from("items").select("id").limit(1));
if (existing.length > 0) {
  console.error("The database already has items. Run `pnpm db:reset` first for a clean demo.");
  process.exit(1);
}

const categories = check(
  "Add categories",
  await staff
    .from("categories")
    .insert(["Notebooks", "Pens and pencils", "Paper", "Art supplies", "Bags and cases"].map((name) => ({ name })))
    .select("id, name"),
);
const category = Object.fromEntries(categories.map((row) => [row.name, row.id]));

// name, category, unit, price, warn-at, deliveries [daysAgo, qty, cost, supplier], stock out [daysAgo, qty, reason]
const catalogue = [
  ["Notebook, 80 leaves", "Notebooks", "pc", 28, 40, [[210, 120, 17.5, "Golden Paper Trading"], [45, 200, 18, "Golden Paper Trading"]], [[150, 70, "sold"], [20, 30, "sold"]]],
  ["Notebook, spiral 100 leaves", "Notebooks", "pc", 55, 20, [[95, 60, 36, "Golden Paper Trading"]], [[30, 22, "sold"]]],
  ["Composition notebook", "Notebooks", "pc", 22, 30, [[320, 150, 13, "Samar School Depot"]], [[200, 96, "sold"]]],
  ["Ballpen, black", "Pens and pencils", "pc", 10, 100, [[130, 500, 5.5, "Samar School Depot"], [12, 500, 5.75, "Samar School Depot"]], [[60, 430, "sold"]]],
  ["Ballpen, blue", "Pens and pencils", "pc", 10, 100, [[130, 300, 5.5, "Samar School Depot"]], [[40, 225, "sold"]]],
  ["Pencil No. 2", "Pens and pencils", "pc", 8, 80, [[70, 400, 4, "Samar School Depot"]], [[15, 140, "sold"]]],
  ["Crayons, 16 colors", "Art supplies", "box", 48, 15, [[240, 40, 31, "Bright Kids Supply"], [25, 36, 32, "Bright Kids Supply"]], [[100, 18, "sold"], [90, 2, "damaged"]]],
  ["Watercolor set", "Art supplies", "box", 95, 6, [[400, 24, 62, "Bright Kids Supply"]], [[300, 9, "sold"]]],
  ["Poster paint, 6 jars", "Art supplies", "box", 120, 5, [[8, 12, 84, "Bright Kids Supply"]], []],
  ["Bond paper, short", "Paper", "ream", 240, 10, [[35, 30, 185, "Golden Paper Trading"]], [[10, 23, "sold"]]],
  ["Bond paper, long", "Paper", "ream", 260, 10, [[110, 25, 200, "Golden Paper Trading"], [5, 30, 205, "Golden Paper Trading"]], [[50, 19, "sold"]]],
  ["Manila paper", "Paper", "pc", 9, 50, [[185, 200, 5, "Golden Paper Trading"]], [[120, 60, "sold"]]],
  ["Pencil case, zip", "Bags and cases", "pc", 65, 8, [[260, 30, 40, "Samar School Depot"]], [[180, 11, "sold"]]],
  ["Plastic envelope, long", "Bags and cases", "pc", 18, 30, [[60, 100, 10, "Samar School Depot"]], [[14, 74, "sold"]]],
];

for (const [name, categoryName, unit, price, warnAt, deliveries, outs] of catalogue) {
  const item = check(
    `Add ${name}`,
    await staff
      .from("items")
      .insert({ name, category_id: category[categoryName], unit, selling_price: price, reorder_level: warnAt })
      .select("id")
      .single(),
  );
  for (const [ago, quantity, cost, supplier] of deliveries) {
    check(
      `Stock in ${name}`,
      await staff.rpc("receive_stock", {
        p_item_id: item.id,
        p_quantity: quantity,
        p_received_on: daysAgo(ago),
        p_unit_cost: cost,
        p_supplier: supplier,
      }),
    );
  }
  for (const [ago, quantity, reason] of [...outs].sort((a, b) => b[0] - a[0])) {
    check(
      `Stock out ${name}`,
      await staff.rpc("remove_stock", {
        p_item_id: item.id,
        p_quantity: quantity,
        p_reason: reason,
        p_occurred_on: daysAgo(ago),
      }),
    );
  }
}

console.log(`Seeded ${catalogue.length} items. Sign in with the demo account defined at the top of scripts/seed-demo.mjs.`);
