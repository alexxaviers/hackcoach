# Simon Mobile (Expo)

React Native mobile app for Simon AI coaching.

## Quick Start

### 1. Install Dependencies

From the root of the monorepo:
```bash
npm install
# or
pnpm install
# or
yarn install
```

Or from the mobile directory:
```bash
cd apps/mobile
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in `/apps/mobile` with:

```env
# API Backend URL (defaults to http://localhost:4000)
API_URL="http://localhost:4000"

# RevenueCat Keys (optional for local development)
REVENUECAT_IOS_KEY="your-ios-key"
REVENUECAT_ANDROID_KEY="your-android-key"
```

**Note:** For local development, you can use `http://localhost:4000` if running the API locally. For physical devices, use your computer's local IP address (e.g., `http://192.168.1.100:4000`).

### 3. Start the Development Server

```bash
cd apps/mobile
npm start
# or
pnpm start
# or
expo start
```

This will start the Metro bundler and open Expo Dev Tools in your browser.

### 4. Run on Device/Simulator

**iOS Simulator:**
```bash
npm run ios
# or
expo start --ios
```

**Android Emulator:**
```bash
npm run android
# or
expo start --android
```

**Physical Device:**
- Install the Expo Go app from the App Store (iOS) or Play Store (Android)
- Scan the QR code shown in the terminal or Expo Dev Tools
- Make sure your device and computer are on the same network

**Web (for testing):**
```bash
npm run web
# or
expo start --web
```

## Production Builds

### iOS (TestFlight)

1. Configure `eas.json` with your build settings
2. Set up RevenueCat with iOS API key and products
3. Set `REVENUECAT_IOS_KEY` in EAS build environment
4. Build:
   ```bash
   eas build --platform ios --profile production
   ```
5. Upload to TestFlight via App Store Connect

### Android (Internal Testing)

1. Configure Google Play Console for internal testing
2. Add products in RevenueCat
3. Build:
   ```bash
   eas build --platform android
   ```
4. Upload to Play Console

## Testing Pro Features Locally

- Use RevenueCat sandbox keys and test purchases from device
- Or call backend `/me/entitlement` or webhook endpoint to emulate pro grant
- Test account: Create via signup at Auth screen, or use `demo@local.test` if seeded
