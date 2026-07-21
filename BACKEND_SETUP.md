# 3love Production Backend Setup

The application runs as one full-stack Next.js web service on Render. Clerk owns authentication and sessions, MongoDB Atlas stores commerce data, and Stripe owns payment processing.

## 1. Local environment

Copy `.env.example` to `.env.local` and fill in the values:

```env
MONGODB_URI="mongodb+srv://USER:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority"
MONGODB_DB_NAME="3love_development"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SIGNING_SECRET="whsec_..."
RATE_LIMIT_SECRET="generate-a-random-secret-with-at-least-32-characters"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/login"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/create-account"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/account"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/account"

ADMIN_EMAILS="founder@example.com"

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_AUTOMATIC_TAX_ENABLED="false"
SHIPPING_GBP_PENCE="0"
STRIPE_SHIPPING_RATE_ID=""

NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

Generate `RATE_LIMIT_SECRET` with a password manager or:

```bash
openssl rand -base64 48
```

## 2. Clerk

Create separate Clerk development and production instances. In both instances:

1. Require an email address and email verification.
2. Enable the desired sign-in methods (email/password is sufficient; Google or Apple can be added without code changes).
3. Use `/login` and `/create-account` as the application's sign-in and sign-up routes.
4. Add the application origin/domain in Clerk's allowed origins and production domain settings.

Create a webhook endpoint with this production URL:

```text
https://your-domain.com/api/clerk/webhook
```

Subscribe to:

- `user.created`
- `user.updated`
- `user.deleted`

Copy that endpoint's signing secret to `CLERK_WEBHOOK_SIGNING_SECRET`. The handler verifies every signature, synchronizes only customer profile fields, and never accepts an admin role from user-controlled Clerk metadata.

The application uses Clerk IDs (`user_...`) as the ownership key on carts, addresses, orders, and Stripe metadata. Clerk handles password recovery, verification, session rotation, and logout; the old custom password/session endpoints no longer exist.

## 3. MongoDB Atlas

Use a new database name for production (for example, `3love_production`) so development/test records cannot mix with production Clerk IDs. Atlas must provide replica-set transactions because inventory reservation and payment finalization are transactional.

Allow the Render service to connect in Atlas Network Access. If launch constraints require `0.0.0.0/0`, use strong database credentials and tighten network access when fixed egress is available.

Run these commands against the intended database before launch:

```bash
DOTENV_CONFIG_PATH=.env.local npm run db:indexes
DOTENV_CONFIG_PATH=.env.local npm run db:seed
```

To initialize the separate production database from the local environment file,
override the database name for both commands:

```bash
MONGODB_DB_NAME=3love_production DOTENV_CONFIG_PATH=.env.local npm run db:indexes
MONGODB_DB_NAME=3love_production DOTENV_CONFIG_PATH=.env.local npm run db:seed
```

The seed is idempotent and creates the initial Éclat catalog item. Do not run it automatically on every deploy if catalog content will be edited through the admin UI.

## 4. Admin access

Admin access requires both:

- the user's verified email in `ADMIN_EMAILS`; and
- the local MongoDB profile role set to `admin`.

After the administrator signs in once, copy their immutable Clerk user ID from the Clerk Dashboard and run:

```bash
npm run db:promote-admin -- user_ClerkId
```

Admin pages:

- `/admin`
- `/admin/products`
- `/admin/orders`

## 5. Stripe

Create this production webhook endpoint:

```text
https://your-domain.com/api/stripe/webhook
```

Listen for:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `refund.updated`

Each Clerk user receives one idempotently-created Stripe Customer. Checkout and webhook processing verify the Clerk owner, Stripe Customer, Checkout Session, and order before changing payment or inventory state.

For local webhook testing:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Use the reported `whsec_...` value as the local `STRIPE_WEBHOOK_SECRET`. Enable Stripe Tax only after registrations and product tax settings are complete.

## 6. Render

The checked-in `render.yaml` configures:

- one Node web service;
- Node.js 24 LTS;
- `npm ci && npm run build`;
- `npm run start`; and
- `/api/live` as Render's liveness check.

`/api/live` only confirms that the Next.js process can serve requests. `/api/health`
remains the strict integration-readiness check and returns HTTP 200 only after the
database and all required Clerk, Stripe, rate-limit, admin, and site URL settings
are configured. This allows the first Render deployment to start before its public
URL is available for creating the Clerk and Stripe webhook endpoints.

Enter every `sync: false` secret manually in the Render dashboard. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is embedded during the Next.js build, so choose **Save, rebuild, and deploy** after adding or rotating it.

Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS production URL. Add the same custom domain to Render and Clerk, then configure the DNS records shown by those services.

After the first deploy, confirm:

1. `/api/health` returns HTTP 200.
2. Clerk sign-up, verification, sign-in, profile editing, password recovery, and logout work.
3. The Clerk webhook reports successful deliveries.
4. A Stripe test checkout produces one paid order and decrements inventory once.
5. A duplicate Stripe webhook delivery is acknowledged without duplicating the order or inventory change.
