#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory of the current script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
let port = 6060; // Default port

// Parse --port argument
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && i + 1 < args.length) {
    port = parseInt(args[i + 1], 10);
    // Remove these arguments so they don't get passed to supergateway
    args.splice(i, 2);
    i--;
  }
}

// Check for required environment variable
if (!process.env.OUTLINE_API_KEY) {
  console.error('\x1b[31mError: OUTLINE_API_KEY environment variable is required but not set.\x1b[0m');
  console.error('Please set this environment variable before running the server.');
  process.exit(1);
}

// Path to the built index.js file
const serverPath = resolve(__dirname, '../build/index.js');

// Spawn the supergateway process
const gateway = spawn('npx', [
  '-y',
  'supergateway',
  '--port',
  port.toString(),
  '--baseUrl',
  'http://0.0.0.0:' + port.toString(),
  '--stdio',
  `node ${serverPath}`
], {
  stdio: 'inherit',
  shell: true
});

// Handle process exit
process.on('SIGINT', () => {
  console.log('SIGINT received, killing outline-mcp-server');
  gateway.kill('SIGINT');
});

gateway.on('close', (code) => {
  console.log('outline-mcp-server exited with code', code);
  process.exit(code);
});