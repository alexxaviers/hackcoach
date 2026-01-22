Problem:
Builders and creators struggle to turn high-level goals into small, timeboxed next actions and keep consistent progress.

Audience Fit:
Creators, indie hackers, product builders, and students who need quick, actionable coaching.

Core Features:
- Four seeded coaches (Focus, Creator, Builder, Reflection)
- Instant chat powered by OpenAI
- Free tier: Focus coach, 3 replies/day
- Pro via RevenueCat: unlimited chats, all coaches, persistent memory

Monetization:
Subscription via RevenueCat (entitlement: `pro`). Pricing handled in-store.

Tech:
Mobile: Expo + React Native + TypeScript; RevenueCat for purchases.
Backend: Fastify + Node + Prisma (Postgres); OpenAI server-side.

Security & Privacy:
Passwords hashed via argon2; tokens via JWT; user memory stored server-side accessible only to subscribers.
