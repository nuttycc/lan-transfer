# Logger Utility

This utility provides a wrapper around the [debug](https://github.com/debug-js/debug) module that respects the application's environment configuration. It automatically enables detailed logging in development mode and disables it in production.

## Features

- Environment-aware logging (development vs. production)
- Namespaced loggers for different components/features
- Different log levels (debug, info, warn, error)
- Colored output for better readability
- TypeScript support

## Basic Usage

```typescript
import { logger } from '../utils/logger';

// These logs will only appear in development mode
logger.debug('This is a debug message');
logger.debug('Debug message with data:', { userId: 123, action: 'login' });

// Info logs are visible in all environments if enabled
logger.info('This is an info message');
logger.info('User logged in:', { userId: 123 });

// Warning logs are visible in all environments if enabled
logger.warn('This is a warning message');
logger.warn('Session about to expire:', { timeLeft: '5 minutes' });

// Error logs are always visible
logger.error('This is an error message');
logger.error('Login failed:', { reason: 'Invalid credentials' });
```

## Creating Component-Specific Loggers

You can create loggers for specific components or features:

```typescript
import { createLeveledLogger } from '../utils/logger';

// Create a logger for a specific component
const buttonLogger = createLeveledLogger('component:button');

buttonLogger.debug('Button rendered');
buttonLogger.info('Button clicked');
buttonLogger.warn('Button clicked multiple times');
buttonLogger.error('Button action failed');

// Create a logger for a specific feature
const authLogger = createLeveledLogger('feature:auth');

authLogger.debug('Starting authentication flow');
authLogger.info('User authenticated successfully');
authLogger.error('Authentication failed', { reason: 'Invalid credentials' });
```

## Environment-Specific Logging

The logger automatically respects the current environment:

```typescript
import { logger } from '../utils/logger';
import { config } from './config';

// Debug logs only appear in development
logger.debug('Development-only debug information');

// This will run in all environments
logger.info(`Current environment: ${config.environment}`);

// You can also add additional environment checks
if (config.isDevelopment) {
  // Additional development-only logging
}
```

## Error Logging

Error logging is particularly useful in try/catch blocks:

```typescript
import { logger } from '../utils/logger';

try {
  // Some code that might throw
  throw new Error('Something went wrong');
} catch (error) {
  // Log the error with context
  logger.error(
    'Operation failed',
    { 
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }
  );
}
```

## Colors in Logger Output

The debug module automatically assigns colors to different namespaces to make it easier to distinguish between them in the console. Each namespace gets a unique color based on its name.

### Testing Logger Colors

You can test the logger colors by running:

```bash
# TypeScript version (using ts-node)
# On Unix/Linux/macOS
npm run test:logger

# On Windows (using cross-env)
npm run test:logger

# Alternative for Windows (using PowerShell)
npm run test:logger:win

# JavaScript version (using node directly)
# On Unix/Linux/macOS
npm run test:logger:js

# On Windows (using PowerShell)
npm run test:logger:js:win
```

If you encounter issues with the TypeScript version, try using the JavaScript version instead.

This will run a test script that outputs messages from different loggers with different namespaces, each with its own color.

### Troubleshooting Colors

If colors are not showing in your terminal:

1. Make sure your terminal supports ANSI colors
2. Set the `DEBUG_COLORS=true` environment variable
3. For Node.js child processes, you may need to explicitly enable colors
4. On Windows, you might need to use a terminal that supports ANSI colors (like Windows Terminal)

## Enabling Debug Logs in Production

By default, debug logs are disabled in production. If you need to enable them for troubleshooting:

### In the Browser

Open the browser console and run:

```javascript
localStorage.setItem('debug', 'lan-transfer:*');
```

To disable again:

```javascript
localStorage.setItem('debug', '');
```

### In Node.js

Set the DEBUG environment variable:

```bash
# On Unix/Linux/macOS
DEBUG=lan-transfer:* npm start

# On Windows (CMD)
set DEBUG=lan-transfer:* && npm start

# On Windows (PowerShell)
$env:DEBUG='lan-transfer:*'; npm start
```

## Namespacing Convention

We use the following namespacing convention:

- `app:*` - Application-wide logs
- `component:*` - UI component logs
- `service:*` - Service logs
- `feature:*` - Feature-specific logs
- `util:*` - Utility function logs

Each namespace can have different log levels:
- `:debug` - Debug information (development only)
- `:info` - General information
- `:warn` - Warnings
- `:error` - Errors (always enabled) 