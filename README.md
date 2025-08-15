# My CLI Tool

A CLI tool built with TypeScript and React Ink.

## Installation

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Test locally
node bin/cli.js hello --name "Test"

# Link globally for development
pnpm link --global

# After linking, you can use:
my-cli hello --name "Developer"
```

## Usage

```bash
# Display help
my-cli --help

# Run hello command
my-cli hello
my-cli hello --name "Your Name"
my-cli hello -n "Your Name"
```

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests in watch mode
pnpm test

# Type check
pnpm typecheck

# Build for production
pnpm build
```

## Publishing

```bash
# Build and publish
pnpm publish
```

After publishing, users can install globally:

```bash
pnpm install -g my-cli-tool
# or
pnpm dlx my-cli-tool hello --name "World"
```