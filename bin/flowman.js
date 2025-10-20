#!/usr/bin/env node

import { program } from 'commander';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import CommandLoader from '../src/utils/command-loader.js';
import Logger from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

// Main async function
(async () => {
  // Set up the CLI program
  program
    .name(packageJson.name)
    .description(packageJson.description)
    .version(packageJson.version);

  // Auto-load all commands from the commands directory
  const commandsDir = path.join(__dirname, '../src/commands');
  await CommandLoader.loadCommands(program, commandsDir);

  // Handle unknown commands
  program.on('command:*', () => {
    Logger.error(`Unknown command: ${program.args.join(' ')}`);
    Logger.info('Run `flowman-cli --help` to see available commands');
    process.exit(1);
  });

  // Parse command line arguments
  program.parse();

  // Show help if no command is provided
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
})();