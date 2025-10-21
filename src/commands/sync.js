import { intro, outro, spinner, note } from '@clack/prompts';
import AuthManager from '../lib/auth-manager.js';
import PostmanClient from '../lib/postman-client.js';
import Logger from '../utils/logger.js';
import chalk from 'chalk';
import CredentialStorage from '../lib/credential-storage.js';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

/**
 * Main Sync command
 */
export async function run(options) {

  intro(chalk.blue('🔄 Sync Collections'));

  const gitRepo = CredentialStorage.getGitRepoPath();
  if (!gitRepo) {
    outro(
      `${chalk.red(`No git repository found. Please add a git repo first by running`)} ${chalk.blue(`${require('../../package.json').name} git add`)}`
    );
    return;
  }



}

export const help = 'Sync local collections with Postman';
