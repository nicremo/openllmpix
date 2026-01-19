<p align="center">
  <img src="public/next.svg" alt="OPENLLMPIX" width="120" />
</p>

<h1 align="center">OPENLLMPIX</h1>

<p align="center">
  <strong>The open-source AI image generation dashboard that puts you in control.</strong>
</p>

<p align="center">
  <a href="https://github.com/nicremo/openllmpix/actions/workflows/ci.yml"><img src="https://github.com/nicremo/openllmpix/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/nicremo/openllmpix/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="https://github.com/nicremo/openllmpix/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome"></a>
  <a href="https://github.com/nicremo/openllmpix/issues"><img src="https://img.shields.io/github/issues/nicremo/openllmpix" alt="Issues"></a>
</p>

<p align="center">
  <a href="https://openllmpix.com">Live Demo</a> •
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#providers">Providers</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## Why I Built This

I wanted to use **Nano Banana Pro** — Google's insanely good new image model. The problem? Running it through services like Fal.ai or Higgsfield costs money. Not a lot, but it adds up, and it felt unnecessary when Google AI Studio offers free API access.

But Google AI Studio's interface? Not my thing.

So I built **OPENLLMPIX** — a clean, simple dashboard where I can use Nano Banana Pro (and other models) with my own API keys. No middleman fees, no clunky UI. Just prompt, generate, done.

This is the **open-source version** — no accounts, no tracking, no server-side storage. Your API keys stay encrypted in your browser, and requests go directly to the providers.

> **Want the hosted version?** Check out [openllmpix.com](https://openllmpix.com) for cloud sync, team features, and optional managed API access.

---

## Features

### Generation Modes

- **Text-to-Image** — Describe what you want, get an image. Simple.
- **Image-to-Image** — Upload reference images and describe how to modify them. Drag & drop, paste from clipboard, or click to upload.
- **Chat Studio** — Edit images through conversation. Up to 4 context images, HEIC/TIFF support, iterative refinement with Nano Banana Pro.

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
| **Google AI Studio** | Nano Banana Pro, Gemini 2.0 Flash, Imagen 3 | Text-to-Image, Image-to-Image* | [aistudio.google.com](https://aistudio.google.com) |
| **OpenRouter** | Gemini 2.0 Flash, Gemini 2.5 Flash Preview | Text-to-Image, Image-to-Image | [openrouter.ai](https://openrouter.ai) |
| **Fal.ai** | FLUX Pro 1.1, FLUX Schnell, FLUX Dev, FLUX LoRA | Text-to-Image | [fal.ai](https://fal.ai) |

*Imagen models support text-to-image only, Gemini and Nano Banana models support both modes.

More providers coming soon. PRs welcome!

---

## How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Your Browser  │────▶│   Provider API  │────▶│  Generated Image│
│                 │     │  (Google, Fal,  │     │                 │
│  API Key stored │     │   OpenRouter)   │     │  Stored locally │
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

We love contributions! Whether it's adding a new provider, fixing bugs, or improving docs — every PR helps make OPENLLMPIX better.

**Quick Start:**

```bash
# Fork the repo, then:
git clone https://github.com/YOUR_USERNAME/openllmpix.git
cd openllmpix
npm install
npm run dev
```

**Before submitting a PR:**
- Read our [Contributing Guidelines](CONTRIBUTING.md)
- Make sure `npm run build` passes
- Follow the PR template

**Ideas for contributions:**
- Add new providers (Replicate, Together.ai, Stability AI)
- Video generation support (Runway, Kling, Pika)
- Image editing tools (inpainting, outpainting)
- Improve Chat Studio features
- Add tests

**Get Help:**
- Open an [issue](https://github.com/nicremo/openllmpix/issues) for bugs or feature requests
- Tag `@claude` in issues for AI-assisted troubleshooting
- Join [Discussions](https://github.com/nicremo/openllmpix/discussions) for questions

---

## License

MIT License — do whatever you want with it.

---

<p align="center">
  <sub>Built with mass amounts of mass produced mass market coffee by <a href="https://github.com/nicremo">@nicremo</a></sub>
</p>
