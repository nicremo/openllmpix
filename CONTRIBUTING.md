# Contributing to OpenLLMPix

First off, thanks for taking the time to contribute! OpenLLMPix is an open-source AI image generation app, and we welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

## Code of Conduct

Be respectful and inclusive. We're all here to build something cool together.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/openllmpix.git
   cd openllmpix
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/nicremo/openllmpix.git
   ```

## Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- An API key from a supported provider (OpenRouter, Google AI, etc.)

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Add your API key to .env.local (optional, can also be set in the app)

# Start development server
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run start` | Start production server |

## Making Changes

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes** and commit them:
   ```bash
   git add .
   git commit -m "feat: add awesome feature"
   ```

   We use [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New features
   - `fix:` - Bug fixes
   - `docs:` - Documentation changes
   - `refactor:` - Code refactoring
   - `style:` - Formatting changes
   - `test:` - Adding tests
   - `chore:` - Maintenance tasks

3. **Keep your branch updated**:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

## Pull Request Process

1. **Open a PR** against the `main` branch
2. **Fill out the PR template** completely
3. **Wait for CI** to pass (lint, type-check, build)
4. **Request a review** - PRs require approval from @nicremo
5. **Address feedback** if any changes are requested
6. **Squash and merge** once approved

### PR Requirements

- [ ] Tests pass locally (`npm run build`)
- [ ] Code follows style guidelines
- [ ] No sensitive data exposed
- [ ] Documentation updated if needed
- [ ] Conventional commit messages used

## Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for all new code
- Prefer `const` over `let`
- Use arrow functions for callbacks
- Use template literals for string interpolation
- Add types to function parameters and return values

### React

- Use functional components with hooks
- Keep components small and focused
- Use `useCallback` for event handlers passed to children
- Prefer composition over prop drilling

### CSS

- Use Tailwind CSS utilities
- Follow mobile-first approach
- Always add `dark:` variants for colors
- Use CSS variables for theming

### File Structure

```
src/
├── app/           # Next.js app router pages
├── components/    # React components
│   └── ui/        # shadcn/ui components
├── hooks/         # Custom React hooks
└── lib/           # Utilities and helpers
    └── providers/ # API provider adapters
```

## Reporting Bugs

Use the [Bug Report template](https://github.com/nicremo/openllmpix/issues/new?template=bug_report.md) and include:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser and OS information
- Console errors

## Suggesting Features

Use the [Feature Request template](https://github.com/nicremo/openllmpix/issues/new?template=feature_request.md) and include:

- Clear description of the feature
- Why it's needed (problem/motivation)
- Proposed solution
- Whether you'd like to implement it

## Questions?

- Open a [Discussion](https://github.com/nicremo/openllmpix/discussions)
- Tag `@claude` in an issue for AI-assisted help

---

Thank you for contributing to OpenLLMPix!
