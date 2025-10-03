const chalk = require('chalk');

class Logger {
  /**
   * Log info message in blue
   * @param {string} message - The message to log
   * @param {...any} args - Additional arguments
   */
  static info(message, ...args) {
    console.log(chalk.blue('ℹ'), message, ...args);
  }

  /**
   * Log success message in green
   * @param {string} message - The message to log
   * @param {...any} args - Additional arguments
   */
  static success(message, ...args) {
    console.log(chalk.green('✓'), message, ...args);
  }

  /**
   * Log warning message in yellow
   * @param {string} message - The message to log
   * @param {...any} args - Additional arguments
   */
  static warn(message, ...args) {
    console.log(chalk.yellow('⚠'), message, ...args);
  }

  /**
   * Log error message in red
   * @param {string} message - The message to log
   * @param {...any} args - Additional arguments
   */
  static error(message, ...args) {
    console.log(chalk.red('✗'), message, ...args);
  }

  /**
   * Log debug message in gray (only if debug mode is enabled)
   * @param {string} message - The message to log
   * @param {...any} args - Additional arguments
   */
  static debug(message, ...args) {
    if (process.env.DEBUG || process.env.NODE_ENV === 'development') {
      console.log(chalk.gray('🐛'), message, ...args);
    }
  }

  /**
   * Log plain message without styling
   * @param {string} message - The message to log
   * @param {...any} args - Additional arguments
   */
  static log(message, ...args) {
    console.log(message, ...args);
  }

  /**
   * Create a spinner-like loading message
   * @param {string} message - The loading message
   * @returns {Object} Spinner-like object with stop method
   */
  static loading(message) {
    const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let index = 0;
    let isSpinning = true;

    const interval = setInterval(() => {
      if (!isSpinning) return;
      process.stdout.write(`\r${chalk.cyan(spinner[index])} ${message}`);
      index = (index + 1) % spinner.length;
    }, 100);

    return {
      stop: (finalMessage = null) => {
        isSpinning = false;
        clearInterval(interval);
        process.stdout.write('\r' + ' '.repeat(message.length + 5) + '\r');
        if (finalMessage) {
          this.success(finalMessage);
        }
      },
      fail: (errorMessage = null) => {
        isSpinning = false;
        clearInterval(interval);
        process.stdout.write('\r' + ' '.repeat(message.length + 5) + '\r');
        if (errorMessage) {
          this.error(errorMessage);
        }
      }
    };
  }

  /**
   * Log with custom color
   * @param {string} color - Chalk color name
   * @param {string} message - The message to log
   * @param {...any} args - Additional arguments
   */
  static colored(color, message, ...args) {
    console.log(chalk[color](message), ...args);
  }
}

module.exports = Logger;