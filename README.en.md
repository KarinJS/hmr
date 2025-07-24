# Node.js Pure ESM Hot Module Replacement (HMR)

A lightweight **pure ESM** hot module replacement (HMR) tool for Node.js that allows you to reload modified ES modules without restarting your application.

## Features

- **Pure ESM implementation** - designed specifically for ES modules
- Automatically injects `--expose-internals` parameter, no manual addition needed
- Supports TypeScript and JavaScript files
- Simple and easy-to-use API
- Provides command-line tool

## Installation

```bash
# Using pnpm
pnpm add @karinjs/node-hmr

# Using npm
npm install @karinjs/node-hmr

# Using yarn
yarn add @karinjs/node-hmr
```

## Command Line Usage

After installation, you can use the `hmr` command to run your application. It will automatically inject the required `--expose-internals` parameter:

```bash
# Run JavaScript files
hmr ./src/app.js

# Run TypeScript files with tsx
hmr ./src/app.ts --tsx

# Pass additional arguments
hmr ./src/server.js --port 3000
```

## Manual Usage

If you prefer not to use the CLI, you can run your application directly with Node.js:

```bash
# For JavaScript files
node --expose-internals ./your-file.js

# For TypeScript files
node --expose-internals --import tsx ./your-file.ts
```

## API Usage

You can also use the HMR API directly in your code:

```typescript
import { HMRModule } from '@karinjs/node-hmr';

// Create an HMR instance to monitor file changes
const hmr = new HMRModule('./src/**/*.{js,ts}');

// Listen for file change events
hmr.on('change', async (fileUrl, isCached) => {
  console.log(`File changed: ${fileUrl}`);
  if (isCached) {
    console.log('Module has been removed from cache, can be reimported');
    
    try {
      // Reimport the module
      const module = await import(fileUrl);
      console.log('Successfully reimported:', Object.keys(module));
    } catch (error) {
      console.error('Failed to reimport:', error);
    }
  }
});

// Listen for other events
hmr.on('add', (fileUrl) => {
  console.log(`File added: ${fileUrl}`);
});

hmr.on('unlink', (fileUrl) => {
  console.log(`File deleted: ${fileUrl}`);
});

// Get all watched files
console.log(hmr.getWatched());
```

> **Note**: When using the API directly, you still need to start Node.js with the `--expose-internals` parameter. It's recommended to use the command-line tool which handles this automatically.

## API Reference

### HMRModule

The `HMRModule` class extends `EventEmitter` and provides the following methods and properties:

#### Constructor

```typescript
constructor(files: string | string[], options?: ChokidarOptions)
```

- `files`: File paths to monitor, supports glob patterns
- `options`: Chokidar watch options, defaults to `{ ignoreInitial: true, ignored: /(^|[/\\])\./ }`

#### Methods

- `add(filePath: string | string[]): this` - Add files to watch
- `unwatch(filePath: string | string[]): this` - Stop watching files
- `close(): Promise<void>` - Close the watcher
- `getWatched(): Record<string, string[]>` - Get all watched files

#### Properties

- `closed: boolean` - Whether the watcher is closed

#### Events

- `'change'` - Emitted when a file changes, parameters: `(fileUrl: string, isCached: boolean)`
- `'add'` - Emitted when a file is added, parameters: `(fileUrl: string, isCached: boolean)`
- `'unlink'` - Emitted when a file is deleted, parameters: `(fileUrl: string, isCached: boolean)`
- Other chokidar events

## How It Works

This tool is specifically designed for **ES Modules (ESM)** and accesses Node.js's internal ESM module cache through the `--expose-internals` flag. When a file changes, it clears the corresponding module from the cache, allowing it to be reimported with the updated code.

The process works as follows:

1. The tool monitors file changes using the chokidar library
2. When a file changes, it converts the file path to a file URL format (the format used by ESM)
3. It checks if the module exists in the ESM module cache
4. If found, it removes the module from the cache
5. The application can then reimport the module to get the updated code

### ESM-Only

This tool is designed exclusively for ES Modules and will not work with CommonJS modules. Your project should use `"type": "module"` in package.json or `.mjs` file extensions.

## Warning

⚠️ **This tool uses Node.js internal APIs and is not recommended for production use!**

⚠️ **Internal APIs may change between Node.js versions, which could cause compatibility issues!**

## Requirements

- Node.js 18+
- ES Modules (not compatible with CommonJS)

## License

MIT 