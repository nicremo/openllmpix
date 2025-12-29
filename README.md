# OPENLLMPIX

Open Source AI image generation dashboard using Next.js and various AI providers (OpenRouter, Google AI Studio, Fal.ai).

## Features

- **Security First**: API keys are stored in browser `localStorage` and sent directly to providers via CORS. No sensitive keys touch the application server.
- **Provider Support**:
  - OpenRouter (FLUX, Stable Diffusion, etc.)
  - Google AI Studio (Imagen)
  - Fal.ai
- **Local History**: Generation history is persisted in browser localStorage.
- **Modern Stack**: Next.js 16, Tailwind CSS 4, TypeScript, React 19.

## Setup

1.  **Clone the repo**:
    ```bash
    git clone https://github.com/your-username/openllmpix.git
    cd openllmpix
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Run Dev Server**:
    ```bash
    npm run dev
    ```

4.  **Configure API Keys**: Open the app in your browser and click the Settings button to add your API keys for:
    - OpenRouter
    - Google AI Studio
    - Fal.ai

## Deployment (Vercel)

1.  Push your code to GitHub.
2.  Import the project in [Vercel](https://vercel.com).
3.  Deploy! (No environment variables needed - API keys are stored client-side)

## License

MIT
