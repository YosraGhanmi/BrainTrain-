# Heroku deployment

This project can run on Heroku as a standard Node.js / Next.js SSR app for
testing. Firebase App Hosting config remains in the repo and is ignored by
Heroku.

## What Heroku needs

- `package.json` at the repo root so Heroku detects Node.js.
- `engines.node` set to `22.x`.
- `Procfile` with a web process that binds to Heroku's `$PORT`.
- Runtime config vars for Firebase, admin auth, SMTP, Stripe, Twilio, and cron.

Heroku automatically runs the `build` script during the Node.js build. The
`Procfile` starts the built app with `npm run start:heroku`.

## Create and deploy

```bash
heroku login
heroku create YOUR_HEROKU_APP_NAME
heroku buildpacks:set heroku/nodejs -a YOUR_HEROKU_APP_NAME
git push heroku main
```

If your branch is not `main`, use:

```bash
git push heroku HEAD:main
```

## Required Heroku config vars

Set these before or immediately after the first deploy:

```bash
heroku config:set \
  ADMIN_EMAIL="admin@example.com" \
  ADMIN_PASSWORD="change-me" \
  ADMIN_SESSION_SECRET="long-random-secret" \
  PORTAL_SESSION_SECRET="another-long-random-secret" \
  NEXT_PUBLIC_SITE_URL="https://YOUR_HEROKU_APP_NAME.herokuapp.com" \
  NEXT_PUBLIC_FIREBASE_API_KEY="..." \
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="ai-wassim.firebaseapp.com" \
  NEXT_PUBLIC_FIREBASE_PROJECT_ID="ai-wassim" \
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="ai-wassim.firebasestorage.app" \
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="727155340357" \
  NEXT_PUBLIC_FIREBASE_APP_ID="1:727155340357:web:88b7ed507de4cfafd91f2c" \
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="G-DKQH2Q6XY4" \
  FIREBASE_PROJECT_ID="ai-wassim" \
  FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@ai-wassim.iam.gserviceaccount.com" \
  FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n" \
  SMTP_HOST="ssl0.ovh.net" \
  SMTP_PORT="465" \
  SMTP_USER="your@ovh-email.com" \
  SMTP_PASS="..." \
  EMAIL_FROM="BrainTrain <your@ovh-email.com>" \
  STRIPE_SECRET_KEY="sk_test_..." \
  STRIPE_WEBHOOK_SECRET="whsec_..." \
  SMS_PROVIDER="twilio" \
  TWILIO_ACCOUNT_SID="..." \
  TWILIO_AUTH_TOKEN="..." \
  TWILIO_FROM_NUMBER="..." \
  CRON_SECRET="long-random-cron-secret" \
  -a YOUR_HEROKU_APP_NAME
```

For `FIREBASE_PRIVATE_KEY`, keep the literal `\n` characters in the value, not
real line breaks. Never commit the service-account JSON file.

## Firebase setup

Heroku still uses your Firebase project for Auth and Firestore. Deploy rules and
indexes separately from your local machine:

```bash
npm run firebase:firestore
```

## Stripe and cron URLs

- Stripe webhook URL:
  `https://YOUR_HEROKU_APP_NAME.herokuapp.com/api/stripe/webhook`
- Payment reminder cron URL:
  `https://YOUR_HEROKU_APP_NAME.herokuapp.com/api/cron/payment-reminders`
  with header `x-cron-secret: <CRON_SECRET>`.

## Heroku testing limitations

Heroku's filesystem is ephemeral. Firestore data persists, but runtime writes to
local files do not survive dyno restarts or redeploys. In this app, that affects:

- admin-edited public content in `data/content.json`
- contact messages in `data/messages.json`
- uploaded files written under `public/uploads`

For production, move those to Firestore and Firebase Storage. For short Heroku
testing, they can work until the dyno restarts.

## Validate

```bash
npm run build
heroku local web
heroku logs --tail -a YOUR_HEROKU_APP_NAME
```
