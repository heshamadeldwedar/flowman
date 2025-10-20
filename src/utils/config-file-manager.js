import fs from 'fs';
import path from 'path';
import os from 'os';
import { createRequire } from 'module';
import ShellDetector from './shell-detector.js';
import Logger from './logger.js';

const require = createRequire(import.meta.url);

class ConfigFileManager {
  /**
   * Read environment variables from shell config files
   * @param {string} variableName - Name of the environment variable to read
   * @returns {string|null} Value of the environment variable or null if not found
   */
  static readEnvVariable(variableName) {
    // First check current environment
    if (process.env[variableName]) {
      return process.env[variableName];
    }

    // Then check shell config files
    const shell = ShellDetector.detectShell();
    const configPaths = ShellDetector.getAllShellConfigPaths(shell);

    for (const configPath of configPaths) {
      if (fs.existsSync(configPath)) {
        try {
          const content = fs.readFileSync(configPath, 'utf8');
          const value = this.extractEnvVariable(content, variableName, shell);
          if (value) {
            return value;
          }
        } catch (error) {
          Logger.debug(`Error reading config file ${configPath}:`, error.message);
        }
      }
    }

    return null;
  }

  /**
   * Write environment variable to shell config file
   * @param {string} variableName - Name of the environment variable
   * @param {string} value - Value of the environment variable
   * @param {Object} options - Configuration options
   * @returns {boolean} True if successful, false otherwise
   */
  static writeEnvVariable(variableName, value, options = {}) {
    const {
      shell = ShellDetector.detectShell(),
      comment = `Added by ${require('../../package.json').name}`,
      overwrite = true
    } = options;

    if (!ShellDetector.supportsEnvPersistence(shell)) {
      Logger.warn(`Shell ${shell} doesn't support persistent environment variables`);
      return false;
    }

    const configPath = ShellDetector.getShellConfigPath(shell);
    const exportSyntax = ShellDetector.getExportSyntax(shell);

    try {
      // Ensure directory exists
      const configDir = path.dirname(configPath);
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      let content = '';
      let existingContent = '';

      // Read existing content if file exists
      if (fs.existsSync(configPath)) {
        existingContent = fs.readFileSync(configPath, 'utf8');
        content = existingContent;
      }

      // Check if variable already exists
      const existingValue = this.extractEnvVariable(content, variableName, shell);

      if (existingValue && !overwrite) {
        Logger.info(`Environment variable ${variableName} already exists`);
        return true;
      }

      // Remove existing variable if it exists
      if (existingValue) {
        content = this.removeEnvVariable(content, variableName, shell);
      }

      // Generate the export line based on shell syntax
      let exportLine;
      switch (shell) {
        case 'fish':
          exportLine = `${exportSyntax} ${variableName} "${value}"`;
          break;
        case 'powershell':
          exportLine = `${exportSyntax}${variableName} = "${value}"`;
          break;
        default:
          exportLine = `${exportSyntax} ${variableName}="${value}"`;
      }

      // Add the new variable with comment
      const newContent = content +
        (content && !content.endsWith('\n') ? '\n' : '') +
        `\n# ${comment}\n${exportLine}\n`;

      // Write to file
      fs.writeFileSync(configPath, newContent, 'utf8');
      Logger.success(`Environment variable ${variableName} added to ${configPath}`);

      return true;
    } catch (error) {
      Logger.error(`Error writing to config file ${configPath}:`, error.message);
      return false;
    }
  }

  /**
   * Remove environment variable from shell config file
   * @param {string} variableName - Name of the environment variable to remove
   * @param {Object} options - Configuration options
   * @returns {boolean} True if successful, false otherwise
   */
  static removeEnvVariable(variableName, options = {}) {
    const { shell = ShellDetector.detectShell() } = options;
    const configPath = ShellDetector.getShellConfigPath(shell);

    if (!fs.existsSync(configPath)) {
      Logger.info(`Config file ${configPath} doesn't exist`);
      return true;
    }

    try {
      const content = fs.readFileSync(configPath, 'utf8');
      const newContent = this.removeEnvVariable(content, variableName, shell);

      if (content !== newContent) {
        fs.writeFileSync(configPath, newContent, 'utf8');
        Logger.success(`Environment variable ${variableName} removed from ${configPath}`);
      } else {
        Logger.info(`Environment variable ${variableName} not found in config file`);
      }

      return true;
    } catch (error) {
      Logger.error(`Error removing variable from config file ${configPath}:`, error.message);
      return false;
    }
  }

  /**
   * Extract environment variable value from file content
   * @param {string} content - File content
   * @param {string} variableName - Variable name to extract
   * @param {string} shell - Shell type
   * @returns {string|null} Variable value or null if not found
   */
  static extractEnvVariable(content, variableName, shell) {
    const patterns = {
      bash: new RegExp(`^\\s*export\\s+${variableName}=["']?([^"'\\n]+)["']?`, 'm'),
      zsh: new RegExp(`^\\s*export\\s+${variableName}=["']?([^"'\\n]+)["']?`, 'm'),
      fish: new RegExp(`^\\s*set\\s+-gx\\s+${variableName}\\s+["']?([^"'\\n]+)["']?`, 'm'),
      powershell: new RegExp(`^\\s*\\$env:${variableName}\\s*=\\s*["']?([^"'\\n]+)["']?`, 'm')
    };

    const pattern = patterns[shell] || patterns.bash;
    const match = content.match(pattern);
    return match ? match[1] : null;
  }

  /**
   * Remove environment variable lines from content
   * @param {string} content - File content
   * @param {string} variableName - Variable name to remove
   * @param {string} shell - Shell type
   * @returns {string} Content with variable removed
   */
  static removeEnvVariable(content, variableName, shell) {
    const patterns = {
      bash: new RegExp(`^\\s*export\\s+${variableName}=.*$`, 'gm'),
      zsh: new RegExp(`^\\s*export\\s+${variableName}=.*$`, 'gm'),
      fish: new RegExp(`^\\s*set\\s+-gx\\s+${variableName}\\s+.*$`, 'gm'),
      powershell: new RegExp(`^\\s*\\$env:${variableName}\\s*=.*$`, 'gm')
    };

    const pattern = patterns[shell] || patterns.bash;
    return content.replace(pattern, '').replace(/\n\s*\n\s*\n/g, '\n\n'); // Clean up extra newlines
  }

  /**
   * Check if environment variable exists in config files
   * @param {string} variableName - Variable name to check
   * @returns {boolean} True if variable exists
   */
  static hasEnvVariable(variableName) {
    return this.readEnvVariable(variableName) !== null;
  }
}

export default ConfigFileManager;