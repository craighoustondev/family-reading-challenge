# Family Reading Challenge 📚

A Progressive Web App (PWA) for tracking your family's reading challenge progress. Works on both iPhone and Android - just share the URL and family members can install it to their home screen!

## Features

- ✅ Track books you've read
- ✅ See your reading stats (books & pages)
- ✅ Family leaderboard
- ✅ Works offline
- ✅ Installable on any device
- ✅ No app store fees!

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher)
- npm (comes with Node.js)

### Installation

1. Navigate to the project folder:
   ```bash
   cd family-reading-challenge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

## Adding PWA Icons

For the app to look great when installed, you'll need to add icon images:

1. Create a **192x192 pixel** PNG image named `pwa-192x192.png`
2. Create a **512x512 pixel** PNG image named `pwa-512x512.png`
3. Create a **180x180 pixel** PNG image named `apple-touch-icon.png`
4. Place all images in the `public/` folder

You can use any image editor or online tools like [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator) to create these.

## Deploying for Your Family

### Option 1: Netlify (Recommended - Free)

1. Create a free account at [netlify.com](https://netlify.com)
2. Build your app:
   ```bash
   npm run build
   ```
3. Drag and drop the `dist` folder to Netlify
4. Share the URL with your family!

### Option 2: Vercel (Free)

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory
3. Follow the prompts
4. Share the URL with your family!

### Option 3: GitHub Pages (Free)

1. Push your code to GitHub
2. Enable GitHub Pages in repository settings
3. Set the source to the `dist` folder

## Installing on Mobile Devices

### iPhone/iPad
1. Open the app URL in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

### Android
1. Open the app URL in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home screen" or "Install app"
4. Tap "Add"

## Adding a Backend (For Real Family Sharing)

The current version stores data locally on each device. To share a leaderboard across devices, you'll need to add a backend. Options include:

- **Firebase** - Easy to set up, has a free tier
- **Supabase** - Open source Firebase alternative
- **Your own API** - Python/Node.js server with a database

Let me know if you'd like help setting up a backend!

## Project Structure

```
family-reading-challenge/
├── public/              # Static assets (icons)
├── src/
│   ├── views/           # Page components
│   │   ├── HomeView.vue
│   │   ├── AddBookView.vue
│   │   └── LeaderboardView.vue
│   ├── styles/
│   │   └── main.css     # Global styles
│   ├── App.vue          # Root component
│   └── main.js          # App entry point
├── index.html
├── vite.config.js       # Vite + PWA config
└── package.json
```

## Customization Ideas

- Change the color theme in `src/styles/main.css` (edit the `--primary` color)
- Add reading goals (e.g., "Read 20 books this year")
- Add book categories or genres
- Add book cover images
- Track reading streaks

## License

MIT - Feel free to use and modify for your family!
