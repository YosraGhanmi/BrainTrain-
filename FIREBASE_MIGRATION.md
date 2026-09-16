# Firebase Migration — Complete ✅

The application has been fully migrated from Prisma/MySQL to Firebase (Firestore + Firebase Authentication).

## What was migrated

### Authentication
- Parents: Firebase Auth + Firestore `users` collection
- Teachers: Firebase Auth + Firestore `users` collection (with PIN second-factor)
- Secretaries: Firebase Auth + Firestore `users` collection
- Admin: unchanged (env-var HMAC cookie — not portal auth)
- Session cookies: Firebase session cookies (14-day TTL, Admin SDK verified)

### Firestore Collections

| Collection | Description |
|---|---|
| `users` | All portal users (parents, teachers, secretaries) |
| `children` | Children profiles |
| `course_sessions` | Scheduled class groups |
| `time_slots` | Admin-defined weekly time slots |
| `enrollments` | Child ↔ session enrollments |
| `payment_plans` | Payment plan per enrollment |
| `payments` | Individual payment records |
| `pricing_rules` | Age-group and course-specific pricing |
| `expenses` | Secretariat expense ledger |
| `badges` | Teacher-awarded badges |
| `teacher_notes` | Teacher notes on enrolled children |
| `notifications` | Admin bell-feed notifications |
| `sms_notifications` | SMS delivery log |
| `preinscriptions` | Public preinscription form submissions |
| `settings` | Admin-controlled feature flags |

## Setup for new deployments

1. Create a Firebase project.
2. Enable **Email/Password** Authentication.
3. Create a **Firestore** database (production mode).
4. Create a service account and add credentials to your server environment:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
5. Add the web app config from Firebase Console:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
6. Deploy Firestore security rules:
   ```
   firebase deploy --only firestore:rules
   ```
7. Configure OVH SMTP for email delivery:
   - `SMTP_HOST=ssl0.ovh.net`
   - `SMTP_PORT=465`
   - `SMTP_USER=your@ovh-email.com`
   - `SMTP_PASS=...`
   - `EMAIL_FROM="BrainTrain <your@ovh-email.com>"`

## Migrating existing data from MySQL

If you have existing production data in MySQL, run the migration script **once** in maintenance mode:

```bash
# Ensure DATABASE_URL and Firebase Admin SDK env vars are both set
npm run migrate:firebase
```

The script migrates all 14 entity types from MySQL → Firestore and prints a summary.

## Removed dependencies

- `@prisma/client` (dependency)
- `prisma` (devDependency)
- `DATABASE_URL` environment variable
- `prisma/schema.prisma`
- `lib/db/prisma.ts`

## New dependencies

- `nodemailer` — email delivery via OVH SMTP
