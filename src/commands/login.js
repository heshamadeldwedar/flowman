import { intro, outro, text, select, confirm, spinner, note } from '@clack/prompts';
import AuthManager from '../lib/auth-manager.js';
import PostmanClient from '../lib/postman-client.js';
import BrowserLauncher from '../utils/browser-launcher.js';
import Logger from '../utils/logger.js';
import chalk from 'chalk';

/**
 * Handle API key login
 */
async function handleApiKeyLogin() {
  const apiKey = await text({
    message: 'Enter your Postman API Key:',
    placeholder: 'PMAK-...',
    validate: (value) => {
      if (!value) return 'API key is required';
      if (!value.startsWith('PMAK-')) return 'API key should start with "PMAK-"';
      if (value.length < 20) return 'API key appears to be too short';
      return undefined;
    }
  });

  const s = spinner();
  s.start('Validating API key...');

  try {
    // Validate API key
    const isValid = await PostmanClient.validateApiKey(apiKey);
    if (!isValid) {
      s.stop('Invalid API key');
      outro(chalk.red('Authentication failed - Invalid API key'));
      return;
    }

    // Get user info
    const userInfo = await PostmanClient.getUserInfo(apiKey);
    s.stop('API key validated');

    // Store credentials
    const success = await AuthManager.authenticateWithApiKey(apiKey);
    if (!success) {
      outro(chalk.red('Failed to store credentials'));
      return;
    }

    // Show success message
    note(
      `Logged in as: ${chalk.green(userInfo?.fullName || 'Unknown User')}\n` +
      `Email: ${chalk.cyan(userInfo?.email || 'Unknown')}\n` +
      `API Key: ${chalk.gray(AuthManager.getMaskedApiKey())}`,
      'Authentication Successful'
    );

    outro(chalk.green('✅ Successfully authenticated with Postman!'));

  } catch (error) {
    s.stop('Validation failed');
    Logger.error('API key validation failed:', error.message);
    outro(chalk.red('Authentication failed'));
  }
}

/**
 * Handle browser-based OAuth login
 */
async function handleBrowserLogin() {
  note(
    'Browser authentication is not yet implemented.\n' +
    'This feature will redirect you to Postman\'s OAuth page.\n' +
    'For now, please use the API key option.',
    'Coming Soon'
  );

  const useApiKey = await confirm({
    message: 'Would you like to use API key authentication instead?',
    initialValue: true
  });

  if (useApiKey) {
    await handleApiKeyLogin();
  } else {
    outro(chalk.yellow('Authentication cancelled'));
  }

  // TODO: Implement OAuth flow
  // This would involve:
  // 1. Setting up OAuth app in Postman
  // 2. Building OAuth URL with proper client_id
  // 3. Launching browser and handling callback
  // 4. Exchanging code for access token
}

/**
 * Main login command
 */
export async function run(options) {
  intro(chalk.blue('🔐 Postman Authentication'));

  try {
    // Check if already authenticated
    if (AuthManager.isAuthenticated()) {
      const shouldReauth = await confirm({
        message: 'You are already logged in. Do you want to re-authenticate?',
        initialValue: false
      });

      if (!shouldReauth) {
        outro(chalk.green('Authentication cancelled'));
        return;
      }
    }

    // Get authentication method
    const authMethod = await select({
      message: 'How would you like to authenticate?',
      options: [
        {
          value: 'api-key',
          label: 'Enter API Key manually',
          hint: 'Paste your Postman API key'
        },
        {
          value: 'browser',
          label: 'Login via browser (OAuth)',
          hint: 'Opens browser for authentication'
        }
      ]
    });

    if (authMethod === 'api-key') {
      await handleApiKeyLogin();
    } else if (authMethod === 'browser') {
      await handleBrowserLogin();
    }

  } catch (error) {
    if (error.message === 'cancelled') {
      outro(chalk.yellow('Authentication cancelled'));
      return;
    }
    Logger.error('Login failed:', error.message);
    outro(chalk.red('Authentication failed'));
  }
}

export const help = 'Login to your Postman account';
