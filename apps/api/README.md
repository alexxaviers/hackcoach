# Simon API

Local backend for Simon AI coaching MVP.

## Quick Start (requires Postgres)

### 1. Install Dependencies

From the root of the monorepo:
```bash
npm install
# or
pnpm install
# or
yarn install
```

Or from the API directory:
```bash
cd apps/api
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in `/apps/api` with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/simon_db"

# JWT Secrets (required for authentication)
JWT_ACCESS_SECRET="your-secret-key-here"
JWT_REFRESH_SECRET="your-refresh-secret-here"

# OpenAI API (required for AI coaching features)
OPENAI_API_KEY="sk-your-openai-api-key"

# Optional: AI Model (defaults to 'gpt-4o-mini')
AI_MODEL="gpt-4o-mini"

# Optional: RevenueCat Webhook Secret (for production)
REVENUECAT_WEBHOOK_SECRET="your-webhook-secret"

# Optional: Server Port (defaults to 4000)
PORT=4000
```

**Note:** For local development, you can use simple secrets like `dev` and `dev_refresh` (these are the defaults), but use strong secrets in production.

### 3. Set Up PostgreSQL Database

Make sure PostgreSQL is running and create a database:

```bash
# Using psql
createdb simon_db

# Or using SQL
psql -U postgres
CREATE DATABASE simon_db;
```

### 4. Generate Prisma Client

```bash
cd apps/api
npm run prisma:generate
# or
pnpm prisma:generate
```

### 5. Run Database Migrations

```bash
npm run prisma:migrate
# or
pnpm prisma:migrate
# or
npx prisma migrate dev --name init
```

### 6. (Optional) Seed the Database

```bash
npx prisma db seed
# or
npx ts-node prisma/seed.ts
```

### 7. Start the Development Server

```bash
npm run dev
# or
pnpm dev
```

The server will start on `http://localhost:4000` (or the port specified in `PORT`).

### 8. Verify It's Running

Visit `http://localhost:4000` in your browser or run:
```bash
curl http://localhost:4000
```

You should see: `{"status":"ok"}`

## Running the Mobile App

See `/apps/mobile/README.md` for mobile app setup instructions.

## Endpoints

Endpoints listed in the creator brief are implemented in `src/routes`:
- `/auth/*` - Authentication (signup, login, refresh)
- `/coaches/*` - Coach library endpoints
- `/sessions/*` - Chat session management
- `/revenuecat/*` - RevenueCat webhook integration
- `/user/*` - User profile and settings
