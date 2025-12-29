<p align="center">
  <img src="public/next.svg" alt="OPENLLMPIX" width="120" />
</p>

<h1 align="center">OPENLLMPIX</h1>

<p align="center">
  <strong>The open-source AI image generation dashboard that puts you in control.</strong>
</p>

<p align="center">
  <a href="https://openllmpix.com">Live Demo</a> •
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#providers">Providers</a> •
  <a href="#deployment">Deployment</a>
</p>

---

## The Story

Tired of juggling between Midjourney, DALL-E, Fal.ai, and a dozen other AI image services? Each with their own interface, pricing model, and learning curve?

**OPENLLMPIX** was born from a simple frustration: there had to be a better way.

Instead of locking you into a single provider, OPENLLMPIX gives you **one unified dashboard** to access all major AI image generation APIs. Bring your own API keys, switch between providers with a single click, and keep your generation history organized — all without your sensitive credentials ever touching a server.

This is the **open-source community edition**. No accounts, no tracking, no BS. Just clone, configure your API keys, and start creating.

> **Want the full experience?** Check out [openllmpix.com](https://openllmpix.com) for the hosted version with cloud sync, team collaboration, and optional managed API access.

---

## Features

### Generation Modes

- **Text-to-Image** — Describe what you want, get an image. Simple.
- **Image-to-Image** — Upload reference images and describe how to modify them. Drag & drop, paste from clipboard, or click to upload.

### Image Controls

- **5 Aspect Ratios** — 1:1, 16:9, 9:16, 4:3, 3:4
- **Batch Generation** — Generate 1-4 images per request
- **Multiple Reference Images** — Use several images as input for image-to-image

### Privacy & Security

- **Zero Server Storage** — API keys are encrypted with AES-GCM and stored only in your browser
- **Direct CORS Calls** — Your credentials go straight from browser to provider, never through our server
- **Local History** — All generations saved in localStorage, always accessible, always private

### User Experience

- **Live Model Fetching** — Automatically pulls available models from OpenRouter
- **Image Lightbox** — Full-screen viewer with metadata, keyboard navigation, and download
- **Use as Reference** — Click any generated image to use it as input for image-to-image
- **Keyboard Shortcuts** — `Cmd/Ctrl+Enter` to generate, `ESC` to close modals, arrow keys to navigate

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/nicremo/openllmpix.git
cd openllmpix

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click the **Settings** icon, and add your API keys.

That's it. Start generating.

---

## Providers & Models

| Provider | Models | Modes | Get API Key |
|----------|--------|-------|-------------|
| **OpenRouter** | Gemini 2.0 Flash, Gemini 2.5 Flash Preview | Text-to-Image, Image-to-Image | [openrouter.ai](https://openrouter.ai) |
| **Google AI Studio** | Imagen 3, Imagen 3 Fast, Gemini 2.0 Flash | Text-to-Image, Image-to-Image* | [aistudio.google.com](https://aistudio.google.com) |
| **Fal.ai** | FLUX Pro 1.1, FLUX Schnell, FLUX Dev, FLUX LoRA | Text-to-Image | [fal.ai](https://fal.ai) |

*Imagen models support text-to-image only, Gemini models support both modes.

More providers coming soon. PRs welcome!

---

## How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Your Browser  │────▶│   Provider API  │────▶│  Generated Image│
│                 │     │  (OpenRouter,   │     │                 │
│  API Key stored │     │   Google, Fal)  │     │  Stored locally │
│  encrypted here │     │                 │     │  in browser     │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               │
        │          Server never sees your key           │
        └───────────────────────────────────────────────┘
```

**All API calls happen directly from your browser via CORS.** The Next.js server only serves the static frontend — your credentials and generated images never touch it.

---

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/nicremo/openllmpix)

1. Click the button above
2. Deploy
3. Done — no environment variables needed!

### Self-Hosted

```bash
npm run build
npm start
```

Or use Docker:

```bash
docker build -t openllmpix .
docker run -p 3000:3000 openllmpix
```

---

## OPENLLMPIX vs. The Competition

| Feature | OPENLLMPIX | Fal.ai | Higgsfield | Midjourney |
|---------|------------|--------|------------|------------|
| Open Source | Yes | No | No | No |
| Multi-Provider | Yes | No | No | No |
| Bring Your Own Keys | Yes | No | No | No |
| Text-to-Image | Yes | Yes | Yes | Yes |
| Image-to-Image | Yes | Yes | Limited | Yes |
| Self-Hostable | Yes | No | No | No |
| No Account Required | Yes | No | No | No |
| Client-Side Encryption | Yes | N/A | N/A | N/A |

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, Tailwind CSS 4
- **Language:** TypeScript 5
- **Security:** Web Crypto API (AES-GCM encryption)
- **Storage:** Browser localStorage (encrypted)
- **Deployment:** Vercel, Netlify, Docker

---

## Contributing

Contributions are welcome! Whether it's adding a new provider, fixing bugs, or improving docs — every PR helps.

```bash
# Fork the repo, then:
git checkout -b feature/amazing-feature
git commit -m "Add amazing feature"
git push origin feature/amazing-feature
```

**Ideas for contributions:**
- Add new providers (Replicate, Together.ai, Stability AI)
- Video generation support (Runway, Kling, Pika)
- Image editing tools (inpainting, outpainting)
- Gallery/favorites system

---

## License

MIT License — do whatever you want with it.

---

<p align="center">
  <sub>Built with mass amounts of mass produced mass market coffee by <a href="https://github.com/nicremo">@nicremo</a></sub>
</p>
