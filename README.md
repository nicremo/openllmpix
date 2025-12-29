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

- **One Dashboard, All Providers** — Access FLUX, Stable Diffusion, Imagen, and more from a single interface
- **Privacy First** — API keys stay in your browser's localStorage and are sent directly to providers. Zero server-side storage.
- **Instant Switching** — Compare outputs across different models with one prompt
- **Local History** — Your generations are saved locally, always accessible, always private
- **Modern Stack** — Built with Next.js 15, React 19, Tailwind CSS 4, and TypeScript
- **Self-Hostable** — Deploy to Vercel, Netlify, or your own server in minutes

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

## Providers

| Provider | Models | Get API Key |
|----------|--------|-------------|
| **OpenRouter** | FLUX Pro, FLUX Schnell, Stable Diffusion XL, and 20+ more | [openrouter.ai](https://openrouter.ai) |
| **Google AI Studio** | Imagen 3, Imagen 3 Fast | [aistudio.google.com](https://aistudio.google.com) |
| **Fal.ai** | FLUX, Stable Diffusion, ControlNet models | [fal.ai](https://fal.ai) |

More providers coming soon. PRs welcome!

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
| Open Source | ✅ | ❌ | ❌ | ❌ |
| Multi-Provider | ✅ | ❌ | ❌ | ❌ |
| Bring Your Own Keys | ✅ | ❌ | ❌ | ❌ |
| Self-Hostable | ✅ | ❌ | ❌ | ❌ |
| No Account Required | ✅ | ❌ | ❌ | ❌ |
| Privacy Focused | ✅ | ⚠️ | ⚠️ | ❌ |

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** React 19, Tailwind CSS 4
- **Language:** TypeScript
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

---

## License

MIT License — do whatever you want with it.

---

<p align="center">
  <sub>Built with ☕ by <a href="https://github.com/nicremo">@nicremo</a></sub>
</p>
