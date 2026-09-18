# Firebase App Hosting deployment

This project is prepared for Firebase App Hosting, not static-only Firebase Hosting.
Keep SSR enabled because the admin panel, parent/teacher portals, Stripe webhook,
cron endpoint, Firebase Admin SDK, SMTP, and SMS flows need a server runtime.

## One-time Firebase setup

1. Use the configured project:

   ```bash
   npx firebase-tools use ai-wassim
   ```

2. Deploy Firestore rules and indexes:

   ```bash
   npm run firebase:firestore
   ```

3. Create the App Hosting backend:

   ```bash
   npx firebase-tools apphosting:backends:create --project ai-wassim
   ```

   During setup, connect the GitHub repo and production branch. If Firebase asks
   for a Web App, choose the `ai-wassim` web app so App Hosting provides
   `FIREBASE_WEBAPP_CONFIG` during builds.

## Required App Hosting secrets

Create these secrets before the first rollout. Do not commit real values to git.

```bash
npx firebase-tools apphosting:secrets:set ADMIN_EMAIL --project ai-wassim
npx firebase-tools apphosting:secrets:set ADMIN_PASSWORD --project ai-wassim
npx firebase-tools apphosting:secrets:set ADMIN_SESSION_SECRET --project ai-wassim
npx firebase-tools apphosting:secrets:set PORTAL_SESSION_SECRET --project ai-wassim
npx firebase-tools apphosting:secrets:set SMTP_USER --project ai-wassim
npx firebase-tools apphosting:secrets:set SMTP_PASS --project ai-wassim
npx firebase-tools apphosting:secrets:set EMAIL_FROM --project ai-wassim
npx firebase-tools apphosting:secrets:set STRIPE_SECRET_KEY --project ai-wassim
npx firebase-tools apphosting:secrets:set STRIPE_WEBHOOK_SECRET --project ai-wassim
npx firebase-tools apphosting:secrets:set TWILIO_ACCOUNT_SID --project ai-wassim
npx firebase-tools apphosting:secrets:set TWILIO_AUTH_TOKEN --project ai-wassim
npx firebase-tools apphosting:secrets:set TWILIO_FROM_NUMBER --project ai-wassim
npx firebase-tools apphosting:secrets:set CRON_SECRET --project ai-wassim
```

If you do not want Stripe, SMTP, or SMS at launch, remove those entries from
`apphosting.yaml` before rollout and add them back when the secrets exist.

## After deployment

- Set the Stripe webhook endpoint to:
  `https://YOUR_APP_HOSTING_DOMAIN/api/stripe/webhook`
- Set any external scheduler to POST:
  `https://YOUR_APP_HOSTING_DOMAIN/api/cron/payment-reminders`
  with header `x-cron-secret: <CRON_SECRET>`.
- Do not upload `.env`, `.env.local`, or Firebase service-account JSON files.

## Validation before pushing

Run:

```bash
npm run build
npm run lint
```

App Hosting will build the app from the connected GitHub branch after you push.
