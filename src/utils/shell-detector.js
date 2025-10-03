const os = require('os');
const path = require('path');
const fs = require('fs');

class ShellDetector {
  /**
   * Detect the user's current shell
   * @returns {string} Shell name (bash, zsh, fish, etc.)
   */
  static detectShell() {
    // Check SHELL environment variable first
    const shellEnv = process.env.SHELL;
    if (shellEnv) {
      return path.basename(shellEnv);
    }

    // Fallback to platform-specific detection
    const platform = os.platform();

    switch (platform) {
      case 'win32':
        return 'cmd'; // or 'powershell'
      case 'darwin':
        return 'zsh'; // macOS default since Catalina
      default:
        return 'bash'; // Linux default
    }
  }

  /**
   * Get the appropriate shell configuration file path
   * @param {string} shell - Shell name (optional, will auto-detect if not provided)
   * @returns {string} Path to shell config file
   */
  static getShellConfigPath(shell = null) {
    const detectedShell = shell || this.detectShell();
    const homeDir = os.homedir();

    const configFiles = {
      bash: ['.bashrc', '.bash_profile', '.profile'],
      zsh: ['.zshrc', '.zprofile', '.profile'],
      fish: ['.config/fish/config.fish'],
      cmd: [], // Windows CMD doesn't have persistent config
      powershell: ['Documents/PowerShell/profile.ps1']
    };

    const possibleFiles = configFiles[detectedShell] || ['.profile'];

    // Check which config file exists
    for (const configFile of possibleFiles) {
      const fullPath = path.join(homeDir, configFile);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }

    // If no config file exists, return the primary one for creation
    const primaryConfigFile = possibleFiles[0] || '.profile';
    return path.join(homeDir, primaryConfigFile);
  }

  /**
   * Get all possible shell config file paths for the detected shell
   * @param {string} shell - Shell name (optional, will auto-detect if not provided)
   * @returns {Array} Array of possible config file paths
   */
  static getAllShellConfigPaths(shell = null) {
    const detectedShell = shell || this.detectShell();
    const homeDir = os.homedir();

    const configFiles = {
      bash: ['.bashrc', '.bash_profile', '.profile'],
      zsh: ['.zshrc', '.zprofile', '.profile'],
      fish: ['.config/fish/config.fish'],
      cmd: [],
      powershell: ['Documents/PowerShell/profile.ps1']
    };

    const possibleFiles = configFiles[detectedShell] || ['.profile'];
    return possibleFiles.map(file => path.join(homeDir, file));
  }

  /**
   * Check if the current shell supports environment variable persistence
   * @param {string} shell - Shell name (optional, will auto-detect if not provided)
   * @returns {boolean} True if shell supports persistent env vars
   */
  static supportsEnvPersistence(shell = null) {
    const detectedShell = shell || this.detectShell();
    const unsupportedShells = ['cmd'];
    return !unsupportedShells.includes(detectedShell);
  }

  /**
   * Get the appropriate export syntax for the shell
   * @param {string} shell - Shell name (optional, will auto-detect if not provided)
   * @returns {string} Export syntax (e.g., 'export', 'set')
   */
  static getExportSyntax(shell = null) {
    const detectedShell = shell || this.detectShell();

    const syntaxMap = {
      bash: 'export',
      zsh: 'export',
      fish: 'set -gx',
      cmd: 'set',
      powershell: '$env:'
    };

    return syntaxMap[detectedShell] || 'export';
  }
}

module.exports = ShellDetector;