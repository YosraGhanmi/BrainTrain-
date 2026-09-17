# Next.js Security and Quality Audit

**Repository:** BrainTrain  
**Audit date:** 2026-09-17  
**Scope:** Complete current working tree, including uncommitted Firebase, Firestore, Docker, dependency, and environment-template configuration  
**Method:** Report-only static review plus non-destructive local build, HTTP, dependency, and browser validation

## Executive summary

The application should not be deployed to production in its current state. Two critical issues require immediate action:

1. Firestore lets a signed-in user rewrite every field in their own profile, including `role`, `parentStatus`, ownership identifiers, and freeze state. The server then trusts those same fields when granting secretary access. A newly registered parent can therefore promote themselves to secretary and reach administrative child, enrollment, and payment operations.
2. The project pins Next.js `14.2.5`, which is affected by current critical production advisories, including unauthenticated remote-code-execution conditions. The previously suggested target `14.2.35` no longer covers the latest advisories. As of this audit, use a tested supported line with the relevant fixes: at least `15.5.24` or `16.3.3`, then update to the latest compatible patch in that line.

The account system also contains high-risk defaults and incomplete controls: known fallback admin credentials, parent two-factor authentication that is never enforced at login, a shared teacher password with exposed four-digit codes, unlimited password-reset OTP attempts, and collection-wide payment reads for every Firebase-authenticated user.

### Finding counts

| Severity | Count | Deployment decision |
| --- | ---: | --- |
| Critical | 2 | Block production |
| High | 5 | Fix before production |
| Medium | 3 | Fix before broad external use |
| Low | 0 | Hardening notes are listed separately |
| **Total** | **10** | **Not production-ready** |

## Verification results

| Check | Result | Notes |
| --- | --- | --- |
| `npx tsc --noEmit` | Pass | Exit code 0 |
| `npm run build` | Pass | Next.js 14.2.5; 115 static pages generated |
| `npm run lint` | Fail / not configured | Launches the interactive Next.js ESLint setup prompt instead of enforcing rules |
| `npm audit` | Fail | 12 advisories: 1 critical, 8 high, 3 moderate |
| `npm audit --omit=dev` | Fail | 6 production advisories: 1 critical, 2 high, 3 moderate |
| Tracked-secret scan | Pass with limitation | No credential-shaped value found in tracked source; ignored `.env` content was not copied or inspected |
| Production-browser smoke | Pass | Home, courses, parent login, teacher login, and admin login rendered at 390px, 820px, and 1440px with no console errors |
| Signed-out authorization | Pass | Parent, teacher, and admin protected routes redirect to their login boundaries |
| Cron missing-secret test | Pass | `POST /api/cron/payment-reminders` returned 401 |
| Authenticated Playwright flows | Not run | Existing flows create Firebase users and child records; running them against the configured project would violate the non-destructive audit constraint |

The local audit runtime used Node.js `24.17.0`; CI uses Node.js 20. The repository does not declare a supported Node version in `package.json`.

## Architecture and trust boundaries

| Boundary | Lower-trust side | Privileged side / asset | Main controls reviewed |
| --- | --- | --- | --- |
| Public website | Anonymous visitors and bots | Contact messages, preinscriptions, registrations | Server Actions, field validation, abuse controls |
| Firebase browser client | Any Firebase-authenticated browser | `users`, children, enrollments, payment plans, payments | `firestore.rules` |
| Portal session | Parent or teacher credentials | Child data, notes, badges, enrollments, payments | Firebase session cookie, role and ownership guards |
| Secretary session | Firebase user profile | Administrative workflows | `getAdminSession()`, `requireAdmin()`, `requireAdminOnly()` |
| Admin login | Public login endpoint | Full website and portal administration | HMAC cookie, environment credentials |
| Stripe | Parent checkout and Stripe webhook caller | Payment status and financial integrity | Ownership checks, signed webhook, idempotence |
| Cron | External scheduler | Reminder processing and SMS spend | Shared `x-cron-secret` header |
| Email and SMS | Server-side notification calls | SMTP/Twilio credentials, OTP delivery, provider spend | Environment secrets; currently weak abuse limits |
| Uploads | Parent or admin file input | Image decoder, process memory, public web root | MIME checks, Sharp normalization, local filesystem |
| Data plane | Firebase/Firestore | Children, sessions, enrollments, payments | Server-side Firebase helpers and ownership guards |
| Runtime filesystem | Admin content and public forms | `data/*.json` and uploaded media | Synchronous local writes; no durable shared storage |

## Confirmed security findings

### SEC-01 — Critical — Parent-to-secretary privilege escalation

**CWE:** CWE-269, Improper Privilege Management; CWE-862, Missing Authorization  
**Confidence:** High

**Attack path:** An attacker registers a normal parent account, signs in through the public Firebase client, updates their own `users/{uid}` document to set `role: "SECRETARY"` and favorable security/status fields, obtains a Firebase session cookie through the secretary login, and reaches actions protected by `requireAdmin()`.

**Impact:** Unauthorized access to child and parent records and secretary-permitted enrollment, teacher, parent-approval, and payment-status operations. This crosses from public registration to administrative authority.

**Evidence:**

- `firestore.rules:25-27` allows the owner to read and write the entire user profile without restricting fields.
- `lib/firebase/portal-auth.ts:49-62` creates a public registrant as `PARENT`/`PENDING`, establishing that public users receive writable profile documents.
- `lib/firebase/portal-auth.ts:65-84` maps `role`, `parentStatus`, `parentId`, `teacherId`, and `isFrozen` directly from Firestore.
- `lib/portal-auth/session.ts:95-103` verifies the cookie and returns that Firestore profile, checking only `isFrozen`.
- `lib/admin/guard.ts:15-21` grants an admin-area secretary session solely from `user.role === 'SECRETARY'`.
- Examples of secretary-permitted sensitive operations are in `lib/admin/portal-actions.ts:73-101`, `215-238`, `299-378`.

**Required fix:** Deny client writes to every security-sensitive field. Allowlist specific profile fields such as phone or backup email and require unchanged `role`, approval status, ownership identifiers, freeze state, teacher assignments, factor state, and reset fields. Put authorization in server-managed custom claims or a separate server-only document and validate it on every privileged request.

**Verification test:** Using the Firestore emulator, authenticate as a parent and assert that updates to `role`, `parentStatus`, `isFrozen`, `parentId`, `teacherId`, factor fields, and password-reset fields are denied, while approved non-security profile fields remain writable. Then assert that a parent session cannot call any secretary action.

### SEC-02 — Critical — Unsupported Next.js version with current RCE advisories

**CWE:** CWE-1104, Use of Unmaintained Third-Party Components  
**Confidence:** High for the vulnerable component; exploitability depends on deployment features and operating system

**Attack path:** A remote unauthenticated attacker reaches a vulnerable Next.js server path. Specific prerequisites vary by advisory: the 2026 path-handling RCE affects Windows-hosted servers, while the image-optimization RCE applies when AVIF processing is used. The application uses the App Router, Server Actions, and `next/image`, so the affected surfaces are present even though the final production OS and image formats were not established.

**Impact:** Depending on the advisory and deployment, remote code execution, authorization bypass, SSRF, cache poisoning, sensitive endpoint disclosure, request smuggling, or denial of service.

**Evidence:**

- `package.json:28` pins `next` to `14.2.5`.
- `npm audit --omit=dev` reports `next` as critical and `postcss` as high in the production graph.
- The current official Next.js security release identifies patched supported lines `15.5.24` and `16.3.3`: [Next.js security update](https://nextjs.org/blog/security-update-2025-12-11).
- The Windows-hosted unauthenticated RCE is tracked as [GHSA-p293-qw3h-jr36](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36).
- The image-optimization AVIF RCE is tracked as [GHSA-2xp9-vwfh-vxw4](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4/dependabot).

`npm audit` may propose `14.2.35`, but that release predates the latest critical advisories and is not an adequate final target for this audit date.

**Required fix:** Upgrade in a dedicated, tested change set to at least Next.js `15.5.24` or `16.3.3`, preferably the latest compatible patch in a supported line. Update the matching `eslint-config-next`, React, and React DOM versions as required. Review migration notes, cache semantics, middleware/proxy behavior, and Server Action compatibility.

**Verification test:** Run `npm audit --omit=dev`, type-check, production build, all public smoke tests, authenticated E2E tests against emulators/test tenants, image optimization for accepted formats, and authorization regression tests. Confirm the deployed version from runtime headers/build metadata.

### SEC-03 — High — Known fallback admin credentials and signing secrets

**CWE:** CWE-798, Use of Hard-coded Credentials; CWE-1392, Use of Default Credentials  
**Confidence:** High

**Attack path:** A deployment omits one or more admin environment variables. The application logs a warning but silently activates source-known admin credentials and an HMAC key. An attacker uses the known login or forges tokens protected by the fallback secret.

**Impact:** Full administrative access or forged pending-teacher tokens, depending on the missing variable.

**Evidence:**

- `lib/auth/session.ts:13-46` supplies known fallback values for `ADMIN_SESSION_SECRET`, `ADMIN_PASSWORD`, and `ADMIN_EMAIL`.
- `lib/portal-auth/session.ts:49-55` reuses the known admin-session fallback to sign pending teacher tokens.
- `lib/admin/actions.ts:44-60` exposes the public admin login flow without throttling or account lockout.

The current local environment has values present, which reduces immediate local exposure but does not remove the fail-open deployment behavior.

**Required fix:** Remove every fallback credential. Validate all required production configuration during startup and terminate on missing, placeholder, or weak values. Use a managed identity provider for admin accounts where possible. Apply login rate limits, alerting, and credential rotation.

**Verification test:** Start a production-mode build with each required variable omitted in turn and assert that startup fails before serving requests. Add repeated-failure tests for admin login throttling.

### SEC-04 — High — Parent two-factor authentication is not enforced

**CWE:** CWE-308, Use of Single-factor Authentication  
**Confidence:** High

**Attack path:** A parent enables the advertised email OTP feature. An attacker who obtains the password calls the normal parent login flow; the server creates a full session without checking `twoFactorEnabled` or requesting an OTP.

**Impact:** Parent accounts and their child, enrollment, teacher-note, and payment data remain protected by one factor despite the UI representing two-factor authentication as enabled.

**Evidence:**

- `lib/portal-auth/actions.ts:373-422` verifies an email code and sets `twoFactorEnabled: true`.
- `lib/portal-auth/actions.ts:84-99` performs parent login and creates a session immediately after password and status checks; it never reads or enforces `twoFactorEnabled`.

**Required fix:** Add a pending-login transaction after password verification. When `twoFactorEnabled` is true, issue a fresh short-lived OTP bound to the user, browser challenge, purpose, and expiry; create the real session only after successful verification. Add attempt limits, replay prevention, resend cooldowns, and recovery codes.

**Verification test:** An MFA-enabled user must not receive the portal session cookie after password-only login. Valid OTP completes login once; wrong, expired, replayed, or cross-user codes fail and increment a bounded attempt counter.

### SEC-05 — High — Shared teacher password and weak exposed secret codes

**CWE:** CWE-521, Weak Password Requirements; CWE-307, Improper Restriction of Excessive Authentication Attempts; CWE-312, Cleartext Storage of Sensitive Information  
**Confidence:** High

**Attack path:** The shared teacher password is learned from source, documentation, a former employee, or another teacher. The attacker then guesses a teacher email and brute-forces the four-digit code. Codes are additionally exposed in URLs, retained in plaintext Firestore fields, and shown in the admin panel.

**Impact:** Teacher-account takeover and unauthorized access to assigned student rosters, notes, and badge actions.

**Evidence:**

- `lib/admin/teacher-defaults.ts:4` defines one source-known password for every teacher.
- `lib/admin/portal-actions.ts:84-101` creates a four-digit code, stores both hash and plaintext, and places the code and email in a redirect query string.
- `lib/admin/portal-actions.ts:110-121` repeats the same exposure when regenerating a code.
- `lib/firebase/teachers.ts:55-67` persists `teacherSecretCode` in plaintext alongside its hash.
- `app/admin/(protected)/teachers/page.tsx:174-176` displays retained plaintext codes.
- `lib/portal-auth/actions.ts:139-154` verifies the code without an attempt counter, delay, or lockout.

**Required fix:** Generate a unique high-entropy one-time enrollment link or temporary password per teacher, force password change, and remove the shared default. Never store or return plaintext factors after provisioning. Use at least a six-digit short-lived challenge or, preferably, TOTP/WebAuthn. Rate-limit by account, IP, and pending token; expire and rotate after bounded failures.

**Verification test:** Assert that two newly created teachers have different credentials; no plaintext factor appears in Firestore, rendered HTML, browser history, query strings, or logs; the factor becomes unusable after a small number of failures and after first success.

### SEC-06 — High — Password-reset OTP brute force and SMS abuse

**CWE:** CWE-307, Improper Restriction of Excessive Authentication Attempts; CWE-640, Weak Password Recovery Mechanism  
**Confidence:** High

**Attack path:** An unauthenticated attacker repeatedly requests codes for a phone number to cause SMS spend, then submits unlimited guesses against the six-digit code during its ten-minute validity window. The validation and clear operations are separate writes, so consumption is not transactional.

**Impact:** Parent-account takeover, notification harassment, and unbounded SMS cost. The generic outward redirect reduces account enumeration but does not mitigate brute force or spend.

**Evidence:**

- `lib/portal-auth/actions.ts:458-488` accepts a public phone number, creates an OTP, stores its hash/expiry, and sends SMS without cooldown or rate limit.
- `lib/portal-auth/actions.ts:494-525` checks the code without an attempt counter and clears it only after updating the password.

**Required fix:** Use an opaque reset transaction ID rather than the phone number as the public handle. Apply per-account, per-IP, and global rate limits; resend cooldown; bounded attempts; atomic compare-and-consume; short TTL; provider spend caps; alerting; and a proven reset provider where possible.

**Verification test:** Verify that repeated requests are throttled, incorrect attempts consume a small attempt budget, concurrent reuse permits one success only, expired codes fail, responses do not reveal account existence, and SMS spend alarms trigger.

### SEC-07 — High — Any signed-in user can read all payment records

**CWE:** CWE-862, Missing Authorization; CWE-200, Exposure of Sensitive Information  
**Confidence:** High

**Attack path:** Any authenticated Firebase user, including a pending parent or teacher, queries `payment_plans` and `payments` directly with the public Firebase client.

**Impact:** Cross-account disclosure of payment amounts, methods/plans, states, due dates, enrollment references, and transaction metadata.

**Evidence:**

- `firestore.rules:72-88` describes the collections as parent-read-only but grants `allow read: if isSignedIn()` to both collections.
- By contrast, `firestore.rules:75-78` attempts an ownership predicate for enrollments, demonstrating the missing check on payment collections.

**Required fix:** Authorize payment-plan and payment reads through the enrollment → child → `parentId` relationship. If Firestore rules cannot express the query safely and efficiently, disable direct client reads and expose server-only queries that enforce ownership.

**Verification test:** Emulator tests must prove that parent A can read only A's payment graph, parent B and teachers cannot read it, list queries cannot bypass ownership, and Admin SDK/server workflows remain functional.

### SEC-08 — Medium — Parent can transfer or corrupt child ownership

**CWE:** CWE-639, Authorization Bypass Through User-Controlled Key; CWE-915, Improperly Controlled Modification of Dynamically-Determined Object Attributes  
**Confidence:** High

**Attack path:** A parent updates a child they currently own and changes `parentId` or other server-managed fields. The rule checks only `resource.data.parentId`, not the proposed document.

**Impact:** Unauthorized ownership transfer, child-record integrity loss, and possible disclosure to another account.

**Evidence:** `firestore.rules:33-40` authorizes update/delete from the existing document and does not require `request.resource.data.parentId == resource.data.parentId` or restrict changed keys.

**Required fix:** Require both old and new `parentId` to equal the authenticated UID and allowlist mutable fields with `diff().affectedKeys()`. Keep derived/security fields server-only.

**Verification test:** Emulator tests must reject changes to `parentId` and server-managed fields, including multi-field updates, while allowing only the approved profile fields.

### SEC-09 — Medium — Public actions allow unbounded resource and messaging abuse

**CWE:** CWE-770, Allocation of Resources Without Limits; CWE-400, Uncontrolled Resource Consumption  
**Confidence:** High

**Attack path:** A bot repeatedly submits contact messages, preinscriptions, and parent registrations. Contact submission accepts unbounded strings and rewrites the entire growing JSON array synchronously on every request; the other flows create external records and notifications.

**Impact:** Disk, CPU, memory, database, Firebase Auth, notification, and operational-review exhaustion.

**Evidence:**

- `lib/contact/actions.ts:5-11` validates only non-emptiness.
- `lib/messages/store.ts:22-42` reads, parses, appends, serializes, and synchronously rewrites the entire message file.
- `lib/preinscription/actions.ts:56-88` creates records and notifications without anti-automation controls.
- `firestore.rules:46-49` also permits public direct preinscription creation without schema or size constraints.
- `lib/portal-auth/actions.ts:57-77` exposes public Firebase account registration without an application abuse budget.

**Required fix:** Add strict schemas and length limits, per-IP/device/account limits, global quotas, CAPTCHA or another bot signal for high-abuse flows, duplicate suppression, bounded durable queues/storage, and monitoring. Restrict public Firestore create rules to exact keys, types, and maximum lengths or route all writes through the server.

**Verification test:** Load-test within a test environment and assert 429 responses, stable memory and latency, bounded stored payloads, no duplicate notification storm, and no direct Firestore oversized/extra-field writes.

### SEC-10 — Medium — Image uploads can exhaust server resources

**CWE:** CWE-400, Uncontrolled Resource Consumption; CWE-434, Unrestricted Upload of File with Dangerous Type  
**Confidence:** High

**Attack path:** An authenticated parent uploads a very large or decompression-bomb image while declaring an image MIME type. The server buffers the complete file and asks Sharp to decode it before applying any byte or decoded-pixel limit. Admin uploads also trust MIME/extension and write bytes directly into the public web root.

**Impact:** Process memory/CPU exhaustion, disk growth, instance crashes, and unsafe public file serving for compromised privileged accounts.

**Evidence:**

- `lib/children/actions.ts:94-117` checks only non-empty/image MIME, buffers the file, decodes with Sharp, and writes locally.
- `lib/admin/actions.ts:78-93` trusts the client MIME and filename extension, has no size/signature limit, and writes raw bytes under `public/`.

**Required fix:** Enforce request size before buffering, inspect magic bytes, configure decoded-pixel/page limits, allowlist formats, normalize to a safe output type, generate server-side names, and store media in durable object storage with private staging and controlled public delivery. Add quotas and orphan cleanup.

**Verification test:** Reject oversized bytes, mismatched signatures, polyglots, excessive dimensions/pages, and decompression bombs without material memory growth. Confirm only normalized output is publicly retrievable.

## Dependency risk

### Production graph

`npm audit --omit=dev` reports six vulnerable packages: 1 critical, 2 high, and 3 moderate.

| Package | Relationship | Audit severity | Practical assessment |
| --- | --- | --- | --- |
| `next@14.2.5` | Direct runtime | Critical | Production-exploitable advisory family; immediate upgrade required |
| `postcss@8.4.31` | Runtime transitive through Next.js | High | Upgrade with Next.js; exploitability depends on processing attacker-controlled CSS/source maps |
| `glob` | Runtime transitive through Firebase Admin path | High | Reported CLI command-injection condition; likely not reachable from web requests, but update the parent dependency |
| `gaxios` | Firebase Admin transitive | Moderate | Update Firebase/Google dependency graph; direct vulnerable API use was not found |
| `qs` | Stripe/Twilio transitive | Moderate | Denial-of-service advisories; update parent SDKs and retest request parsing behavior |
| `uuid` | Firebase/Google transitive | Moderate | Affected buffer-output code paths were not found in application code; update the dependency graph |

### Development/tooling graph

The full audit adds six tooling advisories, bringing the total to 12. These flow mainly through the Next.js ESLint stack, TypeScript ESLint, `glob`, `minimatch`, and `js-yaml`. They are not shipped as application runtime code under a production-only install, but they matter on developer machines and CI, especially when untrusted filenames, YAML, or glob patterns are processed.

Do not use `npm audit fix --force` blindly. Upgrade Next.js and its matching lint packages intentionally, then update Firebase Admin, Stripe/Twilio, and remaining transitive dependencies with regression tests.

## Security controls that are working

- Firebase session cookies are `HttpOnly`, `SameSite=Lax`, `Secure` in production, and verified with revocation checking in `lib/portal-auth/session.ts:13-22,95-105`.
- Parent payment initiation resolves the payment through enrollment and child ownership before creating checkout in `lib/payments/actions.ts:19-38`.
- The Stripe webhook uses the raw request body and `stripe.webhooks.constructEvent()` and makes paid delivery idempotent in `app/api/stripe/webhook/route.ts:12-38`.
- Teacher note and badge actions verify that the teacher owns the session and the child is enrolled in it in `lib/teacher/actions.ts:24-59,64-104`.
- Firestore reads and writes use SDK query builders; no raw database-query concatenation sink was found.
- No user-controlled outbound fetch target was found; reviewed `fetch()` calls target fixed Firebase Identity Toolkit endpoints.
- No tracked credential-shaped secrets were found. `.env` is ignored and was not copied into this report.
- Baseline response headers include `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, and `Permissions-Policy`.

## Rejected or limited candidates

- **Logout open redirect:** `logoutPortal(redirectTo)` accepts a string, but the only source use binds a server-supplied `loginHref`; no attacker-controlled reachable path was established. Still replace the parameter with an enum/allowlist.
- **Teacher return redirect:** `lib/teacher/actions.ts:20-33` accepts `returnTo` from form data and should be restricted to known internal routes. Current reachability mainly lets an already authenticated teacher redirect their own browser, so it is recorded as hardening rather than a separate vulnerability.
- **Stripe webhook integrity:** Signature verification and session-ID lookup are present. Defense in depth should also compare `payment_status`, metadata payment ID, amount, currency, livemode, and expected account before marking paid.
- **JSON-LD injection:** Admin-editable content is serialized into inline JSON-LD with `dangerouslySetInnerHTML`. No lower-privilege content writer was established, so it is not counted separately; escape `<` as `\u003c` and add CSP as defense in depth.
- **Live Firestore enforcement:** Source rules were audited, but the deployed ruleset was not modified or dynamically probed. A stale deployed ruleset could differ.

## Critical quality and architecture issues

### 1. Historical split data plane has been removed

Earlier audit evidence showed writes going to Firebase while several protected pages read a legacy SQL data plane. The current tree now uses Firebase helper modules for active parent, teacher, secretary, and admin portal reads/writes.

- Admin pricing, payments, enrollments, children, dispenses, preinscriptions, sessions, and time slots read Firebase-backed helpers.
- Parent dashboard, schedule, payments, course catalog/detail, and child detail pages read Firebase-backed helpers.
- Teacher dashboard, calendar, roster, notes, and badges read Firebase-backed helpers.

Keep this as a regression risk: do not reintroduce a second data plane or per-file fallback behavior. Add emulator-backed integration tests to ensure successful Firebase writes are visible in every portal surface.

### 2. Runtime data depends on local filesystem persistence

Admin-editable content and contact messages use synchronous JSON files (`lib/content/store.ts`, `lib/messages/store.ts`), while uploads are written under `public/`. This fails on read-only/serverless filesystems, is not shared across horizontally scaled instances, can lose data on redeploy, and creates race/lost-update risks.

Move remaining JSON-file structured data to Firestore and media to object storage. Use asynchronous I/O, concurrency control, backups, retention rules, and size quotas.

### 3. Lint and CI do not enforce the intended quality gates

CI runs install, type-check, and build. It should also enforce lint, unit tests, Firestore rules tests, dependency policy, secret scanning, and Playwright.

Add a non-interactive ESLint flat configuration, a direct `eslint .` script, unit/integration tests, Firebase emulator rule tests, production dependency audit policy, secret scanning, and safe E2E against isolated test services.

## Next.js and web best-practice recommendations

### Immediate / before production

- Upgrade Next.js and align React/ESLint versions as described in SEC-02.
- Set `poweredByHeader: false` and add HSTS at the HTTPS edge. Confirm the reverse proxy/CDN does not weaken application headers.
- Add a nonce- or hash-based Content Security Policy after inventorying inline JSON-LD, GSAP/Lenis, analytics, Firebase, Stripe, and image/font origins. Escape `<` in JSON-LD serialized into `<script>` tags.
- Keep authorization inside every Server Action and route handler; do not rely on middleware for security. The current app generally does this correctly.
- Validate `NEXT_PUBLIC_SITE_URL` at startup as an HTTPS origin allowlisted for the deployed environment before using it in Stripe redirect URLs.
- Replace free-form redirect parameters with internal route identifiers.
- Add uniform request schemas with Zod, maximum lengths, normalized phones/emails, and safe error mapping. Avoid returning provider exception text from the Stripe webhook.

### Caching and performance

- Document which pages are static, dynamic, or revalidated. Avoid accidental per-request database work on content that can be cached safely, but never cache user-specific portal responses publicly.
- The home page's reported first-load JavaScript is about 225 kB, higher than the shared baseline. Lazy-load 3D, animation, and below-the-fold effects and verify with bundle analysis and Web Vitals.
- Replace synchronous filesystem calls on request paths. Bound list queries, add pagination, and avoid unbounded fan-out/N+1 notification work in cron handlers.
- Pin the Firebase CLI as a development dependency instead of invoking an unpinned `npx --yes firebase-tools` command.
- Declare supported Node versions in `package.json` and `.nvmrc`/Volta. Match local, CI, and production runtimes.

### Accessibility

The public pages have a language attribute, main landmark, one visible H1, named buttons, and image alt text in the sampled routes. Authentication pages need follow-up:

- Several visual `<label>` elements are not associated through `htmlFor`/`id`, including shared password inputs and parent registration fields.
- Parent login/register renders two H1 elements in the DOM; keep one page-level heading and use lower heading levels inside tabs/panels.
- Add automated axe checks at mobile, tablet, and desktop sizes and keyboard/focus testing for dialogs, nav menus, auth tabs, validation messages, and reduced-motion behavior.

### Observability and operations

- Add structured server logs with request/correlation IDs and redaction. Never log OTPs, teacher codes, tokens, child data, webhook secrets, or reset identifiers.
- Record immutable audit events for role/status changes, parent approval, teacher provisioning, payment status changes, password reset, factor changes, and session revocation.
- Add error tracking, latency/error-rate metrics, auth failure and abuse dashboards, SMS/email spend alerts, webhook delivery alerts, and cron run metrics.
- Back up and test restore for the chosen database and object storage. Define child-data retention/deletion and access-review procedures.
- Validate all required environment variables centrally at startup. Separate public Firebase config from server-only service-account, Stripe, SMTP, Twilio, cron, and signing secrets.

## Phased remediation roadmap

### Immediate — block production

1. Patch Firestore profile rules and move authorization fields to a server-controlled source; add emulator tests.
2. Upgrade Next.js to a supported patched line and rerun the full validation matrix.
3. Remove fallback credentials/secrets and rotate any value that may have been used outside local development.
4. Disable or correctly enforce parent 2FA; do not display it as enabled until login enforcement exists.
5. Replace shared teacher credentials and rotate all existing teacher passwords/codes.
6. Restrict payment and payment-plan reads by ownership.

### Before production

1. Harden password-reset and verification challenges with transactional attempt budgets and rate limits.
2. Rate-limit public forms and registration; add exact Firestore schemas and abuse controls.
3. Harden uploads and move them to object storage.
4. Protect the completed Firebase cutover with emulator integration tests for every portal surface.
5. Move JSON content/messages off local disk and add backups/retention.
6. Establish non-interactive lint, emulator tests, safe E2E, dependency/secret scanning, and CI gates.
7. Add CSP, HSTS at the edge, startup environment validation, and security/audit logging.

### Longer term

1. Replace custom admin authentication with a centrally managed identity provider and phishing-resistant MFA.
2. Introduce a reusable authorization layer with explicit capabilities for admin, secretary, teacher, and parent roles.
3. Add a threat-model review and abuse-case tests to every payment, identity, upload, and child-data change.
4. Add privacy governance for minors' data: retention schedules, export/deletion workflows, least-privilege access reviews, and incident response.
5. Continuously monitor supported framework versions and automate tested dependency update pull requests.

## Required regression suite

- Firestore emulator: immutable roles/status/ownership; cross-parent, teacher, pending-parent, and secretary matrices for every collection.
- Authentication: admin fail-closed config, login throttling, MFA-required login, factor replay/expiry, teacher enrollment rotation, reset OTP attempt/concurrency tests, session revocation.
- IDOR: every child, enrollment, payment, note, badge, and session action with foreign identifiers.
- Payments: ownership, amount/currency/metadata verification, signed/unsigned webhook, duplicate/out-of-order events, already-paid behavior.
- Uploads: byte, signature, dimensions, pages/frames, decompression bomb, quota, filename, and storage failure tests.
- Public abuse: contact, preinscription, registration, forgot-password, and OTP resend rate limits.
- Web: CSP report-only rollout, security headers, internal redirects, error disclosure, cache isolation, accessibility, and responsive routes.
- Data integrity: Firebase emulator coverage, production backup/restore drills, and reconciliation checks for critical collections.

## Limitations

- This was a single-reviewer standard audit; the runtime did not permit an independent delegated baseline, so findings lack independent reviewer corroboration.
- No production Firebase data, user account, payment, SMS, email, or Stripe transaction was created or modified.
- Ignored `.env` values and the supplied Firebase Admin key were intentionally not reproduced or copied into the report. Secret rotation/validity was not tested.
- Authenticated Playwright flows were not run because the existing tests mutate the configured backend. Run them against Firebase emulators or a disposable test tenant.
- The deployed hosting OS, reverse proxy/CDN, Firestore rules release, Stripe account configuration, SMTP/Twilio limits, and production log retention were not available for dynamic verification.
- Dependency conclusions reflect advisories available on 2026-09-17 and should be refreshed immediately before release.
