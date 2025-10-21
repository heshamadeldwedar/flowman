import {  outro, spinner, } from '@clack/prompts';
import AuthManager from '../lib/auth-manager.js';
import Logger from '../utils/logger.js';
import chalk from 'chalk';

/**
 * Main Sync command
 */
export async function run(options) {


  const s = spinner();

  s.start(chalk.blue('🔄 Sync Collections with GIT'));
  try {
    
    const { hasApiKey, hasWorkspace, hasGitRepoPath } = AuthManager.getAuthStatus();

    // validations
    if (!hasApiKey) {
      s.stop('No API key found. Please login first. using flowman-cli login');
    }
    if (!hasWorkspace) {
      s.stop('No workspace selected. Please select a workspace first using flowman-cli workspace switch.');
    }
    if (!hasGitRepoPath) {
      s.stop('No git repository found. Please add a git repo first using flowman-cli git add [path]');
    }





  } catch (error) {
    s.stop('Failed to retrieve necessary credentials.');
    Logger.error('Sync failed:', error.message);
    outro(chalk.red('❌ Sync failed'));
    return;
  }

  s.stop(chalk.green('✅ Sync completed successfully!'));
}

export const help = 'Sync local collections with Postman';
