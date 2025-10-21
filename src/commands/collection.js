import AuthManager from '../lib/auth-manager.js';
import { spinner, note } from '@clack/prompts';
import PostmanClient from '../lib/postman-client.js';
import CredentialStorage from '../lib/credential-storage.js';

export const run = [
  {
    name: 'ls',
    run: async () => {
        const s = spinner();
        s.start('Getting collections...');
        const apiKey = AuthManager.getApiKey();
        if (!apiKey) {
            s.stop('No API key found');
        }
        const collections = await PostmanClient.getCollections(apiKey, CredentialStorage.getCurrentWorkspaceId());
        note(collections.map(collection => `- ${collection.name} (ID: ${collection.id})`).join('\n'), 'Available Collections');
        s.stop('Fetched collections');
    },
    help: 'List all available workspaces'
  },
];

export const help = 'Manage Postman workspaces';