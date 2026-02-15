# Vocabulary Learning App

A mobile-optimized Progressive Web App (PWA) for advanced English learners (B2/C1 level) to improve their vocabulary through daily study sessions with AI-powered definitions and spaced repetition.

## Features

- **AI-Powered Dictionary**: Comprehensive word lookups with OpenAI GPT-3.5-turbo
- **Spaced Repetition System (SRS)**: SM-2 algorithm for optimized learning
- **Daily Learning Sessions**: Configurable 15-30 word sessions
- **Offline-First**: Works without internet after initial setup
- **PWA**: Installable on mobile devices
- **Statistics Tracking**: Learning streaks, progress charts, success rates

## Tech Stack

- **React 18** + **TypeScript** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Dexie** - IndexedDB wrapper for local storage
- **Zustand** - State management
- **TanStack React Query** - Server state management
- **OpenAI API** - AI-powered content generation
- **vite-plugin-pwa** - PWA functionality

## Setup Instructions

### 1. Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### 2. Configure OpenAI API Key

1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Edit `.env.local` and replace `your_api_key_here` with your actual API key:

```env
VITE_OPENAI_API_KEY=sk-...your-actual-key
```

⚠️ **Important**: Never commit your `.env.local` file to version control!

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

## What's Been Implemented ✅

### Foundation (Phase 1 - Partial)

1. **Project Setup**
   - Vite + React + TypeScript initialized
   - All dependencies installed
   - Project folder structure created

2. **Configuration**
   - Tailwind CSS configured with black/white theme
   - PWA plugin configured
   - TypeScript paths configured (`@/` alias)

3. **Core Infrastructure**
   - Database Schema [src/lib/db/schema.ts](src/lib/db/schema.ts)
   - OpenAI Integration [src/lib/openai/](src/lib/openai/)
   - Type Definitions [src/types/](src/types/)
   - UI Components [src/components/ui/](src/components/ui/)

## What's Next 🔲

### Immediate Next Steps

1. **Storage Services** - Create vocabularyStorage.ts
2. **State Management** - Set up Zustand stores
3. **Layout Components** - BottomNav, AppLayout
4. **Dictionary Components** - Search, WordCard, WordDetails
5. **App Entry** - Update App.tsx with routing

See [.claude/plans/bubbly-forging-mitten.md](.claude/plans/bubbly-forging-mitten.md) for the complete implementation plan.

## Documentation

- **Implementation Plan**: [.claude/plans/bubbly-forging-mitten.md](.claude/plans/bubbly-forging-mitten.md)
- **Icons Setup**: [public/icons/README.md](public/icons/README.md)
