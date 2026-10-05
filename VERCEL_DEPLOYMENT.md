# Deploying ChefMate to Vercel

## Step 1: Login to Vercel CLI

```powershell
cd "C:\Users\HP\OneDrive\Desktop\Chefmate"
npx vercel login
```

A browser window will open. Log in with your Vercel account (create one if needed at https://vercel.com/signup).

## Step 2: Deploy a Preview Version

```powershell
npx vercel
```

Answer the prompts:
- **Set up and deploy?** → `y` (Yes)
- **Which scope?** → Select your account name
- **Link to existing project?** → `n` (No)
- **Project name?** → `chefmate`
- **Directory?** → `./` (press Enter)
- **Override settings?** → `n` (No)

Vercel will create a preview deployment and give you a URL like `https://chefmate-xxx.vercel.app`.

## Step 3: Add Environment Variables in Vercel Dashboard

Once the preview deploys, go to:
**https://vercel.com/dashboard → Select `chefmate` project → Settings → Environment Variables**

### Add these environment variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Required for Next.js |
| `NEXT_PUBLIC_APP_NAME` | `ChefMate` | Public app name |
| `NEXT_PUBLIC_PRIMARY_DOMAIN` | Your Vercel domain (e.g., `chefmate-xxx.vercel.app`) | Update after deployment |
| `NEXT_PUBLIC_SITE_URL` | `https://chefmate-xxx.vercel.app` | Full URL (update to your domain) |
| `DATABASE_URL` | Your Supabase pooler URL (from .env) | Pooled connection for web app |
| `DIRECT_URL` | Your Supabase direct URL (from .env) | Direct connection for scripts |
| `SESSION_SECRET` | Copy from your .env file | Keep secret, don't share |
| `PASSWORD_RESET_SECRET` | Copy from your .env file | Keep secret, don't share |
| `COOKIE_SECURE` | `true` | Enable for production (HTTPS) |
| `ARGON2_MEMORY_KIB` | `19456` | Password hashing memory |
| `ARGON2_ITERATIONS` | `2` | Password hashing iterations |
| `ARGON2_PARALLELISM` | `1` | Password hashing parallelism |
| `RATE_LIMIT_LOGIN_PER_MIN` | `5` | Login attempts per minute |
| `RATE_LIMIT_PASSWORD_RESET_PER_HOUR` | `3` | Password reset attempts per hour |
| `RATE_LIMIT_CONTACT_PER_HOUR` | `5` | Contact form submissions per hour |
| `RATE_LIMIT_REGISTER_PER_HOUR` | `5` | Registration attempts per hour |
| `RATE_LIMIT_API_PER_MIN` | `60` | General API requests per minute |
| `UPLOAD_MAX_BYTES` | `5242880` | Max file upload size in bytes (5MB) |
| `UPLOAD_ALLOWED_TYPES` | `image/jpeg,image/png,image/webp` | Allowed MIME types for uploads |
| `OWNER_CONTACT_EMAIL` | `huchainy2@gmail.com` | Your contact email |
| `AUDIT_LOG_PATH` | `./logs/audit.log` | Audit log file path |

**Optional (if configured):**
| Variable | Value | Notes |
|----------|-------|-------|
| `YOUTUBE_API_KEY` | Your YouTube API key | For recipe videos (optional) |
| `YOUTUBE_SEARCH_BASE_QUERY` | `recipe` | YouTube search query |
| `VISION_PROVIDER` | (e.g., `openai`) | For fridge scanner AI (optional) |
| `VISION_MODEL` | (e.g., `gpt-4-vision`) | AI model for image recognition (optional) |
| `GROCERY_PROVIDER` | (e.g., provider name) | Grocery integration (optional, not yet live) |
| `GROCERY_API_KEY` | Your grocery API key | For grocery integration |
| `GROCERY_API_BASE_URL` | Your grocery API URL | For grocery integration |
| `GROCERY_PARTNER_NAME` | Partner name | For grocery integration |

## Step 4: Important Before Production Deploy

**Before running `npx vercel --prod`:**

1. **Update your custom domain** (if you have one)
   - Go to Vercel Dashboard → ChefMate → Settings → Domains
   - Add your custom domain (e.g., `chefmate.app`)

2. **Update the NEXT_PUBLIC variables** to match your actual domain:
   - Set `NEXT_PUBLIC_PRIMARY_DOMAIN` to your domain
   - Set `NEXT_PUBLIC_SITE_URL` to your full URL with https

3. **Seed the database** (first time only):
   - After deploying, you need to seed recipes and initial data
   - See "Step 5: Seed the Database" below

## Step 5: Deploy to Production

Once all environment variables are set in Vercel:

```powershell
npx vercel --prod
```

Vercel will:
1. Build your app (`npm run build`)
2. Run Prisma migrations (`npx prisma migrate deploy`)
3. Deploy to your production URL

## Step 6: Seed the Database (First Time Only)

After the first production deploy, you need to seed recipes and legal documents:

### Option A: Seed from Vercel CLI (recommended)
```powershell
npx vercel env pull .env.production.local
npx NODE_ENV=production DIRECT_URL="YOUR_DIRECT_URL" npx tsx scripts/seed-fast.ts
npx NODE_ENV=production DIRECT_URL="YOUR_DIRECT_URL" npx tsx scripts/seed-legal.ts
```

Replace `YOUR_DIRECT_URL` with your Supabase DIRECT_URL from .env.

### Option B: Use Supabase UI (if you prefer)
1. Go to Supabase Dashboard
2. Open SQL Editor
3. Run the seeding scripts manually (advanced)

## Troubleshooting

### Build Fails with "DATABASE_URL not set"
- Make sure all environment variables are set in Vercel Dashboard
- Vercel may need a few seconds to apply changes; redeploy with `npx vercel --prod`

### Database Connection Timeout
- Check DATABASE_URL and DIRECT_URL are correct
- Verify Supabase is running and accessible
- Check IP whitelist in Supabase (should be set to allow all or Vercel IPs)

### Site Loads But Shows Errors
- Check Vercel deployment logs: Dashboard → ChefMate → Deployments → Click deployment → Logs
- Look for error messages related to database or environment variables

### HTTPS/Redirect Issues
- Set `COOKIE_SECURE=true` in production
- Make sure `NEXT_PUBLIC_SITE_URL` has `https://`

## FAQ

**Q: Do I need GitHub?**  
A: No, this deployment method doesn't require GitHub. Vercel uploads directly from your computer.

**Q: Can I redeploy without reseeding?**  
A: Yes, once the database is seeded, you only need to run `npx vercel --prod` to deploy code changes. The database data persists.

**Q: How do I update environment variables?**  
A: Edit them in Vercel Dashboard → Settings → Environment Variables. Changes take effect on the next deployment.

**Q: Can I roll back a deployment?**  
A: Yes, go to Vercel Dashboard → Deployments and click "Promote to Production" on an older deployment.

**Q: How do I set up a custom domain?**  
A: Vercel Dashboard → ChefMate → Settings → Domains → Add Domain → Follow the DNS setup instructions.
