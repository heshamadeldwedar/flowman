import { intro, outro, spinner, note } from '@clack/prompts';
import AuthManager from '../lib/auth-manager.js';
import PostmanClient from '../lib/postman-client.js';
import Logger from '../utils/logger.js';
import chalk from 'chalk';

/**
 * Main status command
 */
export async function run(options) {
  intro(chalk.blue('📊 Authentication Status'));

  try {
    const authStatus = AuthManager.getAuthStatus();

    if (!authStatus.authenticated) {
      note(
        'You are not currently authenticated.\n' +
        'Run "flowman-cli login" to authenticate.',
        'Not Authenticated'
      );
      outro(chalk.yellow('Please login to continue'));
      return;
    }

    // Get additional user info if possible
    let userInfo = null;
    const s = spinner();
    s.start('Fetching user information...');

    try {
      const apiKey = AuthManager.getApiKey();
      if (apiKey) {
        userInfo = await PostmanClient.getUserInfo(apiKey);
      }
      s.stop('User information retrieved');
    } catch (error) {
      s.stop('Failed to fetch user info');
      Logger.debug('Failed to fetch user info:', error.message);
    }

    // Display status
    const statusInfo = [
      `Status: ${chalk.green('Authenticated')}`,
      `API Key: ${chalk.gray(authStatus.apiKey)}`,
      `Workspace: ${chalk.gray(authStatus.workspaceId || 'Not set')}`
    ];

    if (userInfo) {
      statusInfo.push(`User: ${chalk.cyan(userInfo.fullName || 'Unknown')}`);
      statusInfo.push(`Email: ${chalk.cyan(userInfo.email || 'Unknown')}`);
    }

    note(statusInfo.join('\n'), 'Authentication Status');
    outro(chalk.green('✅ Authentication is active'));

  } catch (error) {
    Logger.error('Status check failed:', error.message);
    outro(chalk.red('Failed to check status'));
  }
}

export const help = 'Check authentication status';
