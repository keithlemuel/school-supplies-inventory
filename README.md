# Rhum's Variety Store inventory

Inventory for the store's school supplies: what came in, what went out, and which stock is oldest.

Built with Next.js and Supabase, deployed on Vercel.

## How old and new stock are told apart

Every "Stock in" is saved as its own delivery (a batch) with the date it was received.

- Stock out uses up the oldest delivery first, unless you pick a specific delivery.
- Each delivery is marked New, Aging or Old from its age. The defaults are 90 and 180 days; change them in Settings.
- The Old stock page lists the oldest deliveries first, with a "Take out" button to record them as sold or disposed.
- Nothing in the history is edited or deleted. A mistake is fixed with a new entry in the other direction ("Recount found more / less").

## What else it does

- **Categories and subcategories** (Pens > Markers), set up in Settings.
- **Units**: an item is counted in its smallest unit (pc, pack) and can also come in bigger ones (box of 50, ream), each with its own price. Stock in, stock out and orders accept any of them.
- **Price list**: every item and unit with its price, editable in place. "Save as PDF" prints a clean customer copy; "Download spreadsheet" gives a CSV. Stock counts and costs are never on it.
- **Orders**: who it is for and what they are getting. Saving takes the inventory items out of stock and makes the delivery receipt in the store's own format (`src/features/deliveries/components/receipt-sheet.tsx`). Lines that are not inventory items are just written on the receipt.

## Run it on your computer

Needs Node, pnpm and Docker.

```bash
pnpm install
pnpm db:start        # local Supabase, on ports 55321-55329
cp .env.example .env.local   # then fill in from: pnpm exec supabase status -o env
pnpm seed:demo       # optional: sample items and a demo sign-in (local only)
pnpm dev
```

`pnpm db:reset` wipes the local database and re-applies `supabase/migrations`.
After changing the schema, run `pnpm db:types` to refresh `src/lib/database.types.ts`.

## Put it online

1. Create a project at supabase.com.
2. Apply the schema: `pnpm exec supabase link --project-ref <ref>` then `pnpm exec supabase db push`.
3. In Supabase, turn off sign-ups (Authentication -> Sign In / Providers -> "Allow new users to sign up").
4. Import the GitHub repo in Vercel and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. Create a sign-in for each person: put the production URL and secret key in `.env.local`, then
   `pnpm create-user --email someone@example.com --name "Their Name"`.
   (Or add them under Authentication -> Users in the Supabase dashboard.)

There is no public sign-up page. Everyone with a sign-in can do everything.

## Where things are

- `supabase/migrations` - tables, the stock in / stock out rules, and who can read what.
- `src/features/inventory` - queries, server actions and the stock forms.
- `src/features/deliveries` - orders and the delivery receipt.
- `src/app/(app)` - the pages: Overview, Items, Stock in, Stock out, Old stock, History, Settings.
- `src/lib/shop.ts` - the store name shown in the app, and the letterhead on delivery receipts.
