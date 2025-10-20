import { intro, outro, confirm, note } from '@clack/prompts';
import AuthManager from '../lib/auth-manager.js';
import Logger from '../utils/logger.js';
import chalk from 'chalk';

/**
 * Main logout command
 */
export async function run(options) {
  intro(chalk.blue('🚪 Logout'));

  try {
    if (!AuthManager.isAuthenticated()) {
      note('You are not currently logged in.', 'Not Authenticated');
      outro(chalk.gray('Nothing to do'));
      return;
    }

    const authStatus = AuthManager.getAuthStatus();
    note(
      `Current user: ${chalk.gray(authStatus.apiKey)}\n` +
      `Workspace: ${chalk.gray(authStatus.workspaceId || 'Not set')}`,
      'Current Session'
    );

    const shouldLogout = await confirm({
      message: 'Are you sure you want to logout?',
      initialValue: false
    });

    if (!shouldLogout) {
      outro(chalk.yellow('Logout cancelled'));
      return;
    }

    const success = AuthManager.logout();
    if (success) {
      outro(chalk.green('✅ Successfully logged out'));
    } else {
      outro(chalk.red('Failed to logout'));
    }

  } catch (error) {
    if (error.message === 'cancelled') {
      outro(chalk.yellow('Logout cancelled'));
      return;
    }
    Logger.error('Logout failed:', error.message);
    outro(chalk.red('Logout failed'));
  }
}

export const help = 'Logout from your Postman account';
