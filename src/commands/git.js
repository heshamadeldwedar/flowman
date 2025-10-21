import { intro, text, spinner, note } from '@clack/prompts';
import chalk from 'chalk';
import CredentialStorage from '../lib/credential-storage.js';

export const run = [
  {
    name: 'add',
    run: async (args) => {

      let repoPath = null;

      if (!args) {

        intro(chalk.blue('➕ Add Git Repository'));
        repoPath = await text({
          message: 'Enter the path to your git repository:',
          placeholder: '/path/to/repo',
          validate: (value) => {
            if (!value) return 'Repository path is required';
            return undefined;
          }
        });

        const success = await CredentialStorage.storeGitRepoPath(repoPath);
        if (success) {
          note(`Git repository set to: ${repoPath}`, 'Git Repository Added');
        } else {
          outro(chalk.red('Failed to add git repository'));
        }
        return;
      }

      repoPath = args;
      const success = await CredentialStorage.storeGitRepoPath(repoPath);
      if (success) {
        note(`Git repository set to: ${repoPath}`, 'Git Repository Added');
      } else {
        outro(chalk.red('Failed to add git repository'));
      }


    },
    help: 'Add git repository to sync workspace collections',
    arguments: '[path]'
  },
];

export const help = 'Manage git repository to sync workspace collections';