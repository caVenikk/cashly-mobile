# Cashly

Personal finance iOS app with iOS 26 Liquid Glass aesthetic. Tracks expenses, income, subscriptions, planned spends, and uses an envelope budgeting system with liquid-fill glass cards. Russian primary, English fallback.

Built with Expo (React Native), TypeScript, Supabase. Target: sideload to iPhone via AltStore (single-user, no auth).

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project**
   - Go to https://supabase.com, create a new project.
   - In the SQL editor, run the contents of `supabase/migrations/0001_init.sql`. This creates the six tables (`categories`, `envelopes`, `expenses`, `recurring_payments`, `planned_expenses`, `incomes`), two RPCs (`allocate_envelope`, `adjust_envelope`), and seeds the 10 default categories plus one "Основной счёт" envelope.
   - RLS is **off** by default — the anon key is the only access key the app uses. Do not open the project to external access.

3. **Configure `.env`**

   Copy the example file and fill in your project credentials:

   ```bash
   cp .env.example .env
   ```

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_...
   ```

4. **Run the app**

   ```bash
   npm run ios
   # or
   npx expo start --ios
   ```

## Architecture

```
app/                     expo-router routes (5 tabs + root layout)
src/
  lib/                   supabase client, theme tokens, format helpers, icon map
  types/                 row types for each table
  services/              supabase CRUD modules (one per entity)
  hooks/                 React hooks wrapping services
  stores/                ui state (sheet open/close)
  components/            shared components
    glass/               GlassCard, CategoryBadge, EmojiBadge, IOSwitch, LiquidFill, SegmentedControl, ProgressRing, GlassIconBtn
    home/                BalanceCard, IncomeWidget, QuickActions, UpcomingWidget, TxList, HomeHeader
    sheets/              bottom-sheet modals (Add expense / income / recurring / planned / envelope, Income list, Allocate)
  screens/               one per tab (HomeScreen, RecurringScreen, PlansScreen, EnvelopesScreen, CategoriesScreen)
  i18n/                  ru.ts, en.ts, index.ts (useT hook)
supabase/migrations/     SQL migration you apply by hand in the Supabase dashboard
```

No Supabase calls live in components — they go through `src/services/*.ts`, exposed via hooks.

## Features

- **Home** — balance hero card with month spending chart, income widget with 3 next incoming, quick actions, upcoming recurring preview, recent transactions with swipe-to-delete.
- **Подписки (Bills)** — 14-day calendar strip, active/paused segmented, list with toggle + swipe-to-delete.
- **Планы (Plans)** — merged calendar of active recurring payments and planned one-off spends, bucketed into "This week" / "Later".
- **Конверты (Envelopes)** — the signature feature. Envelope types: `main` (pinned), `safety` (open savings), `bill` (recurring allocations), `limit` (monthly caps; goes coral at ≥85% full), `goal` (target + deadline). Each card renders with an animated liquid-fill wave. Allocate sheet moves money from main to any envelope.
- **Категории (Categories)** — donut chart of last 30 days by category, searchable 3-column grid, add/remove custom categories. Default categories cannot be deleted; categories with expenses block deletion.

## Interactions

- FAB (green bubble next to tab bar) always opens **Add expense**.
- Dark/light and RU/EN toggles live in the Home header.
- Swipe any transaction or subscription row to the left to reveal delete.
- Expense can draw from a specific envelope (selector row in Add expense sheet); its balance is decremented via an `adjust_envelope` RPC.
- Envelope-to-envelope transfers call `allocate_envelope` which does both updates in one PostgreSQL function.

## Development notes

- Typecheck: `npm run typecheck`
- iOS target only (AltStore sideload). Web/Android entries are removed from `package.json` but the code is cross-platform except for `DateTimePicker` display differences and iOS-specific `Alert.prompt` in categories.
- Reanimated 4 + `react-native-worklets` babel plugin is configured in `babel.config.js`.
