<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Nomen Origins — Story Behind the Name

An interactive etymology explorer that reveals the history, cultural significance, and geographic journey of any name. Powered by Google Gemini AI and visualized on a live world map.

## ✨ Features

- **Omnibar** — Single intelligent search bar that auto-detects intent:
  - Type a name (e.g. "Sophia") → etymology map with origin pins
  - Type a question (e.g. "Ancient Greek warrior names") → Discovery Assistant chat
- **Interactive World Map** — Leaflet-powered map with animated fly-to transitions, color-coded pins (Origin, Usage, Cultural), and zoom/pan constraints
- **Guided Tour** — Audio narration with speech synthesis walks through each key region
- **Discovery Assistant** — AI-powered chat for exploring names by meaning, origin, or culture, with clickable name chips and full markdown rendering
- **Responsive Design** — Clean sidebar + map layout with glassmorphism UI

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript |
| Build | Vite |
| AI | Google Gemini API (`gemini-3-flash-preview`) |
| Map | Leaflet + react-leaflet (CartoDB Voyager tiles) |
| Styling | Tailwind CSS (CDN) |
| Icons | Lucide React |

## 🚀 Run Locally

**Prerequisites:** Node.js 18+

1. Clone the repo:
   ```bash
   git clone https://github.com/v7h-lab/Nomen-origins.git
   cd Nomen-origins
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your Gemini API key:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
├── App.tsx                    # Main app with Omnibar, routing, tour logic
├── index.html                 # Entry HTML with Tailwind + Leaflet CSS
├── index.tsx                  # React root mount
├── types.ts                   # TypeScript interfaces
├── services/
│   └── geminiService.ts       # Gemini API (etymology + chat)
├── components/
│   ├── MapVisualizer.tsx      # Leaflet map with pins, legend, bounds
│   ├── InfoPanel.tsx          # Etymology results panel
│   ├── ChatInterface.tsx      # Discovery chat with markdown rendering
│   └── LoadingPanel.tsx       # Skeleton loading UI
└── vite.config.ts             # Vite config (port 3000)
```

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key ([Get one here](https://aistudio.google.com/apikey)) |

## 📄 License

MIT
