# ChefMate deployment guide

ChefMate is a **Next.js 16 app using Prisma**. The app reads and writes its data through Prisma, so Supabase is used here as a hosted PostgreSQL database; you do **not** need to create the tables manually in the Supabase table editor.

## Important security step

The Supabase secret key was pasted into chat and should be treated as compromised. Rotate/revoke it in **Supabase → Project Settings → API** before deploying. Do not put that key in GitHub, Vercel, Netlify, browser code, or `NEXT_PUBLIC_*` variables.

The ChefMate code does not need the Supabase API key for its current Prisma-based database access. It needs a PostgreSQL **connection string** instead.

## 1. Get the two Supabase connection strings

In Supabase, open **Project Settings → Database → Connection string**.

Use:

- **Pooler/session or transaction URL** as `DATABASE_URL` for the deployed app. Keep the query parameters Supabase gives you (commonly `pgbouncer=true` and a small `connection_limit`).
- **Direct connection URL** as `DIRECT_URL` for Prisma schema commands such as `db:push`.

The URLs contain the database password, not the Supabase publishable/secret API keys. If you do not know the database password, reset it from the Supabase database settings and copy the new connection strings.

## 2. Configure the local environment

From the project root:

```bash
cp .env.example .env
```

Set at least:

```env
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DATABASE_URL="<Supabase pooled PostgreSQL URL>"
DIRECT_URL="<Supabase direct PostgreSQL URL>"
SESSION_SECRET="<long random value>"
PASSWORD_RESET_SECRET="<different long random value>"
COOKIE_SECURE=false
```

Generate safe secrets with:

```bash
openssl rand -base64 32
```

## 3. Create the Supabase schema and seed recipe data

Run these commands once from the project root:

```bash
npm install
npm run db:generate
npm run db:push
npm run seed
```

What each command does:

- `npm run db:generate`: generates the Prisma client.
- `npm run db:push`: creates/updates all tables and indexes described in `prisma/schema.prisma`.
- `npm run seed`: inserts the ingredients, roles, site settings, navigation, legal placeholders, and recipe catalog. The seed is written to be safe to run again; it uses upserts for its main records.

Then run locally:

```bash
npm run dev
```

Open http://localhost:3000. The health endpoint is http://localhost:3000/api/health.

## 4. Deploy to Vercel (recommended)

1. Push the project to GitHub (instructions below).
2. In Vercel, choose **Add New → Project**, import the GitHub repository, and keep the detected Next.js framework.
3. Add these Environment Variables for **Production**, **Preview**, and **Development** as appropriate:

   ```text
   NODE_ENV=production
   NEXT_PUBLIC_APP_NAME=ChefMate
   NEXT_PUBLIC_SITE_URL=https://your-domain.example
   NEXT_PUBLIC_PRIMARY_DOMAIN=your-domain.example
   DATABASE_URL=<Supabase pooled PostgreSQL URL>
   DIRECT_URL=<Supabase direct PostgreSQL URL>
   SESSION_SECRET=<random production secret>
   PASSWORD_RESET_SECRET=<different random production secret>
   COOKIE_SECURE=true
   VISION_PROVIDER=<zai or empty>
   OWNER_CONTACT_EMAIL=<your contact email>
   ```

4. Deploy.
5. After the first deployment, run the schema and seed commands from a machine with the production variables loaded:

   ```bash
   npm run db:push
   npm run seed
   ```

   Do not put `npm run seed` in the normal Vercel build command: it would re-run the large recipe seed during every deployment. The regular Vercel build is simply:

   ```bash
   npm run build
   ```

6. In Vercel, add the production domain and update `NEXT_PUBLIC_SITE_URL` to that final HTTPS URL, then redeploy.

## 5. Netlify option

Netlify can host the Next.js app too, but Vercel is the simpler fit for this project. If using Netlify:

- Build command: `npm run build`
- Publish directory: `.next`
- Add the same environment variables listed for Vercel.
- Run `npm run db:push` and `npm run seed` separately before testing the deployed site.
- Ensure Netlify's Next.js runtime/plugin is enabled for App Router and API routes.

## 6. Push this project to GitHub

From the project root:

```bash
git init
git add .
git commit -m "Initial ChefMate app"
```

Create an empty repository on GitHub, then connect and push it:

```bash
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repository>.git
git push -u origin main
```

Before `git add .`, verify that `.env` is ignored:

```bash
git status --short
```

You should **not** see `.env`, database passwords, API keys, `.next`, or `node_modules`. If a secret was ever committed, rotating it is not optional; removing the file later does not remove it from Git history.

## Current database model

The project now uses `provider = "postgresql"` in Prisma and supports both `DATABASE_URL` and `DIRECT_URL`. No SQL table-creation script is required. Prisma creates the tables from the schema, including users, sessions, recipes, ingredients, meal plans, grocery lists, favourites, uploads, admin data, and supporting indexes.

For future production schema changes, prefer a reviewed Prisma migration workflow instead of destructive `db:push`:

```bash
npx prisma migrate dev --name describe_the_change
npx prisma migrate deploy
```

Do not use `--accept-data-loss` against production.
