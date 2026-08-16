# Buy Order Tracker — Dashboard

This turns the `buy_tracker_FINAL.xlsx` tracker into a web app.

- **Frontend + backend**: Next.js 15 (App Router), one project for both.
- **Database**: PostgreSQL, accessed through Prisma ORM.
- The **Dashboard** page shows the same numbers as the DASHBOARD sheet (total buys, total qty, status breakdown, active orders per step, items needing attention) plus the full order table from the TRACKER sheet.
- Every order has 6 fixed steps: Active SO & FG Creation, BOM Creation, SMV Update, Plant Ext & Code Change, CR Release, PO — same as the ①–⑥ columns in the sheet.
- There's a **+ New Entry** button that opens a form to add a new buy order. It gets added with all 6 steps set to pending.

## Project structure

```
buy-tracker-dashboard/
  prisma/
    schema.prisma        # database tables (Order, Step)
    seed.ts               # sample data loader
  src/
    app/
      page.tsx             # dashboard (server component, reads DB directly)
      orders/new/page.tsx  # "add new entry" form
      api/orders/route.ts       # GET (list) / POST (create)
      api/orders/[id]/route.ts  # GET / PATCH / DELETE one order
      api/dashboard/route.ts    # summary stats as JSON (for external use)
      layout.tsx
      globals.css
    components/
      OrderTable.tsx   # searchable/filterable table
      StepTrack.tsx     # 6-step progress indicator
      StatusPill.tsx
      StatCard.tsx
    lib/
      prisma.ts    # Prisma client
      steps.ts     # the 6 fixed step names, shared by frontend + seed
```

## 1. Requirements

- Node.js 20 or newer
- A PostgreSQL database — either installed locally, or a free hosted one (e.g. Neon, Supabase, Railway). If you don't have Postgres yet, the easiest path is to create a free Neon project and copy the connection string it gives you.

## 2. Install

Unzip the project, then from inside the folder:

```bash
npm install
```

## 3. Connect the database

```bash
cp .env.example .env
```

Open `.env` and put your real PostgreSQL connection string in `DATABASE_URL`. It looks like:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

## 4. Create the tables

```bash
npx prisma migrate dev --name init
```

This creates the `Order` and `Step` tables in your database and generates the Prisma client.

## 5. (Optional) Load sample data

```bash
npm run seed
```

This adds 3 sample orders so the dashboard isn't empty on first run. Skip this if you'd rather start from your real Excel data (see below).

## 6. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Loading your real data from the Excel file

For a one-time bulk import of everything already in `buy_tracker_FINAL.xlsx`, the simplest approach:

1. Export the TRACKER sheet as CSV from Excel.
2. Write a small script (or ask me for one) that reads the CSV and calls `POST /api/orders` for each row, or inserts directly with Prisma the same way `prisma/seed.ts` does.

I can generate that import script for you if you'd like — just say so and, if possible, share which columns map to which fields (the field names are in `prisma/schema.prisma`).

## Adding a new entry (as a user)

1. Click **+ New Entry** in the top right.
2. Fill in the buy order name (required), responsible person, quantities, deadline, and status.
3. Click **Add entry**. It appears at the top of the dashboard immediately, with all 6 steps marked pending.

To update step progress (mark a step done, blocked, etc.) once an order exists, use the `PATCH /api/orders/:id` endpoint — for example:

```bash
curl -X PATCH http://localhost:3000/api/orders/ORDER_ID \
  -H "Content-Type: application/json" \
  -d '{"steps":[{"stepNumber":1,"status":"DONE"}]}'
```

(A step-editing UI on the order row can be added next if you want it directly in the table instead of via API.)

## Deploying

- **App**: Vercel is the simplest option for a Next.js app — connect the GitHub repo and set `DATABASE_URL` as an environment variable in the project settings.
- **Database**: any managed Postgres works (Neon, Supabase, Railway, RDS). Run `npx prisma migrate deploy` once against the production database before first use.

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the app locally |
| `npm run build` / `npm start` | Production build and run |
| `npx prisma studio` | Visual editor for your database, in the browser |
| `npx prisma migrate dev` | Apply schema changes during development |
