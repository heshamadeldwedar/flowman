const fs = require('fs');
const path = require('path');
const Logger = require('./logger');

class CommandLoader {
  /**
   * Load all commands from a directory and register them with Commander
   * @param {Object} program - Commander.js program instance
   * @param {string} commandsDir - Directory containing command files
   */
  static loadCommands(program, commandsDir) {
    const commandsPath = path.resolve(commandsDir);

    if (!fs.existsSync(commandsPath)) {
      Logger.warn(`Commands directory not found: ${commandsPath}`);
      return;
    }

    // Read all .js files in the commands directory
    const commandFiles = fs.readdirSync(commandsPath)
      .filter(file => file.endsWith('.js'))
      .map(file => path.join(commandsPath, file));

    commandFiles.forEach(commandFile => {
      try {
        const commandModule = require(commandFile);

        if (commandModule && typeof commandModule.register === 'function') {
          // If command has a register function, call it
          commandModule.register(program);
        } else if (commandModule && commandModule.commands) {
          // If command exports a commands array, register each command
          this.registerCommandsFromModule(program, commandModule);
        } else {
          Logger.warn(`Invalid command format in ${commandFile}`);
        }
      } catch (error) {
        Logger.error(`Error loading command from ${commandFile}:`, error.message);
      }
    });
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

module.exports = CommandLoader;