import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import Logger from './logger.js';

class CommandLoader {
  /**
   * Load all commands from a directory and register them with Commander
   * @param {Object} program - Commander.js program instance
   * @param {string} commandsDir - Directory containing command files
   */
  static async loadCommands(program, commandsDir) {
    const commandsPath = path.resolve(commandsDir);

    if (!fs.existsSync(commandsPath)) {
      Logger.warn(`Commands directory not found: ${commandsPath}`);
      return;
    }

    // Read all .js files in the commands directory
    const commandFiles = fs.readdirSync(commandsPath)
      .filter(file => file.endsWith('.js'))
      .map(file => path.join(commandsPath, file));

    for (const commandFile of commandFiles) {
      try {
        const fileUrl = pathToFileURL(commandFile).href;
        const commandModule = await import(fileUrl);
        const actualModule = commandModule.default || commandModule;

        if (actualModule && typeof actualModule.register === 'function') {
          // If command has a register function, call it
          actualModule.register(program);
        } else if (actualModule && actualModule.commands) {
          // If command exports a commands array, register each command
          this.registerCommandsFromModule(program, actualModule);
        } else {
          Logger.warn(`Invalid command format in ${commandFile}`);
        }
      } catch (error) {
        Logger.error(`Error loading command from ${commandFile}:`, error.message);
      }
    }
  }

  /**
   * Register commands from a module that exports commands array
   * @param {Object} program - Commander.js program instance
   * @param {Object} commandModule - Module containing commands
   */
  static registerCommandsFromModule(program, commandModule) {
    const { name, description, commands } = commandModule;

    if (!commands || !Array.isArray(commands)) {
      Logger.warn(`No commands array found in module: ${name}`);
      return;
    }

    // Create a parent command if name is provided
    let parentCommand = program;
    if (name && name !== 'root') {
      parentCommand = program.command(name);
      if (description) {
        parentCommand.description(description);
      }
    }

    // Register each command
    commands.forEach(cmd => {
      const command = parentCommand.command(cmd.command);

      if (cmd.description) {
        command.description(cmd.description);
      }

      if (cmd.options) {
        cmd.options.forEach(option => {
          command.option(option.flags, option.description, option.defaultValue);
        });
      }

      if (cmd.arguments) {
        cmd.arguments.forEach(arg => {
          command.argument(arg.name, arg.description);
        });
      }

      if (cmd.action) {
        command.action(cmd.action);
      }
    });
  }
}

export default CommandLoader;