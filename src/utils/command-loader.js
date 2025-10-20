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

        // Get command name from filename (e.g., login.js -> login)
        const commandName = path.basename(commandFile, '.js');

        // Check if module exports run function and help
        if (commandModule.run && typeof commandModule.run === 'function') {
          const command = program.command(commandName);

          // Set description from help (can be string or function)
          if (commandModule.help) {
            const description = typeof commandModule.help === 'function'
              ? commandModule.help()
              : commandModule.help;
            command.description(description);
          }

          // Register the run function as the action
          command.action(commandModule.run);
        } else {
          Logger.warn(`Command file ${commandFile} must export 'run' function`);
        }
      } catch (error) {
        Logger.error(`Error loading command from ${commandFile}:`, error.message);
      }
    }
  }

}

export default CommandLoader;