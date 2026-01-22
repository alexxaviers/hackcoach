TestFlight / Internal Testing instructions

Backend
- Deploy the Fastify API to Render (or Fly) with `DATABASE_URL`, `OPENAI_API_KEY`, `JWT_*`, `REVENUECAT_WEBHOOK_SECRET` set.

iOS (TestFlight)
1. Create an Apple App record and configure bundle id matching `expo.manifest`.
2. Configure RevenueCat with iOS API key and products; set `REVENUECAT_IOS_KEY` in EAS build env.
3. Run `eas build --platform ios --profile production` and upload to TestFlight.
4. Use a test Apple ID to install via TestFlight.

Android (Internal Testing)
1. Configure Google Play Console internal testing and add product in RevenueCat.
2. Build with `eas build --platform android` and upload to Play Console.

Testing Pro flows locally
- Use RevenueCat sandbox keys and test purchases from device.
- Alternatively, call backend `/me/entitlement` or the webhook endpoint to emulate pro grant.

Test account
- Create an account via signup at the Auth screen. Use `demo@local.test` if seeded.
