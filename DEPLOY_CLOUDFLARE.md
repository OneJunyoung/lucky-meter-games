# Lucky Meter Games - Deployment Guide

This repository contains the Next.js source code for Lucky Meter Games. Since the games use dynamic features and need to run on Cloudflare Pages, please follow these updated instructions which reflect Cloudflare's new OpenNext architecture.

## Local Development
To run this project locally:

```bash
npm install
npm run dev
```

The app will be accessible at `http://localhost:3000`.

## Cloudflare Pages Deployment ⚡

This project uses the modern `@opennextjs/cloudflare` adapter to compile Next.js APIs and Server Components into Cloudflare Edge Workers automatically. We have removed the legacy `@cloudflare/next-on-pages` tools which break the build.

**IMPORTANT: Pre-requisite Info:**
We have *removed* all `export const runtime = 'edge'` directives from the code. OpenNext (the underlying build tool for Cloudflare) automatically detects routing and handles the edge deployment for you. Forcing the edge runtime manually causes an `OpenNext requires edge runtime function to be defined in a separate function` build error.

### How to Deploy

1. **Push your code to GitHub.**
2. **Log into Cloudflare Dashboard** -> Navigate to **Workers & Pages**.
3. **Click "Create application"** -> Select **Pages** -> **Connect to Git**.
4. **Select your `lucky-meter-games` repository.**
5. **Configure Build Settings:**
   - **Framework preset:** `Next.js`
   - **Build command:** `npx opennextjs-cloudflare build && npx opennextjs-cloudflare deploy` *(Or simply `npm run build` if Cloudflare's smart detection overrides it)*
   - **Build output directory:** `.open-next`

6. **CRITICAL STEP - Node.js Compatibility:** 
   Scroll down to **Environment variables** (or **Settings > Functions > Compatibility flags** after initial creation) and add the following flag:
   - `nodejs_compat`
   
   *Without this flag, the build will fail because Next.js relies on certain core Node.js modules that Cloudflare only supports via this compatibility flag.*

7. **Save and Deploy!**

Once built, your Lucky Meter dashboard and all 7 Next.js mini-games will be running instantly at edge locations worldwide.
