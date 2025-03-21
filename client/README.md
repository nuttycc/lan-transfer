# Environment Configuration in Vite

This project uses Vite's environment configuration system to manage different settings for development, production, and other environments.

## Environment Files

The project uses the following environment files:

- `.env`: Base environment variables, loaded in all environments
- `.env.development`: Development-specific variables (loaded when running `npm run dev`)
- `.env.production`: Production-specific variables (loaded when running `npm run build`)
- `.env.local`: Local overrides (not committed to git, loaded in all environments)
- `.env.[mode].local`: Local overrides for specific environments (not committed to git)

## Available Scripts

```bash
# Start development server with development environment
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Start development server with production-like settings
npm run dev -- --mode production
```

## Using Environment Variables

### In Vite Config

Environment variables are available in the Vite config through the `loadEnv` function:

```typescript
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    // Use env variables here
    server: {
      port: env.PORT ? Number.parseInt(env.PORT) : 3000,
    }
  };
});
```

### In Your Code

There are two ways to access environment variables in your code:

1. **Using `import.meta.env`** - For variables prefixed with `VITE_`:

```typescript
// For a variable defined as VITE_API_KEY=123 in .env file
console.log(import.meta.env.VITE_API_KEY); // Outputs: 123
```

2. **Using the `define` option in Vite config** - For custom global constants:

```typescript
// In your code
console.log(__API_URL__); // Outputs the URL defined in Vite config
```

## Environment Type Checking

The project includes TypeScript type definitions for environment variables in `src/utils/config.ts`.

## Environment-Specific Features

You can conditionally render components or enable features based on the current environment:

```tsx
import { config } from '../utils/config';

// Only show in development
{config.isDevelopment && <DebugPanel />}

// Only enable in production
const enableAnalytics = config.isProduction;
```

## Adding New Environment Variables

1. Add the variable to the appropriate `.env` file(s)
2. If using with `import.meta.env`, prefix with `VITE_`
3. If using with `define`, add it to the `define` section in `vite.config.ts`
4. Update TypeScript types if necessary

## Logging Utility

This project includes an environment-aware logging utility that wraps the [debug](https://github.com/debug-js/debug) module. It automatically enables detailed logging in development mode and disables it in production.

### Basic Usage

```typescript
import { logger } from './utils/logger';

// These logs will only appear in development mode
logger.debug('This is a debug message');

// Info logs are visible in all environments if enabled
logger.info('This is an info message');

// Warning logs are visible in all environments if enabled
logger.warn('This is a warning message');

// Error logs are always visible
logger.error('This is an error message');
```

### Creating Component-Specific Loggers

```typescript
import { createLeveledLogger } from './utils/logger';

// Create a logger for a specific component
const componentLogger = createLeveledLogger('component:button');

componentLogger.debug('Button rendered');
componentLogger.info('Button clicked');
```

For more details on using the logger, see [Logger Utility Documentation](./src/utils/README.md) 