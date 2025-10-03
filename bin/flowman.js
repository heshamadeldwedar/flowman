#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const packageJson = require('../package.json');
const CommandLoader = require('../src/utils/command-loader');
const Logger = require('../src/utils/logger');

// Set up the CLI program
program
  .name(packageJson.name)
  .description(packageJson.description)
  .version(packageJson.version);

// Auto-load all commands from the commands directory
const commandsDir = path.join(__dirname, '../src/commands');
CommandLoader.loadCommands(program, commandsDir);

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