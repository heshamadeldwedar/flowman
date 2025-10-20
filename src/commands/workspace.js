import AuthManager from '../lib/auth-manager.js';
import { select, spinner, note } from '@clack/prompts';
import PostmanClient from '../lib/postman-client.js';

export const run = [
  {
    name: 'ls',
    run: async () => {
        const s = spinner();
        s.start('Getting workspaces...');
        const apiKey = AuthManager.getApiKey();
        if (!apiKey) {
            s.stop('No API key found');
        }
        const workspaces = await PostmanClient.getWorkspaces(apiKey);
        note(workspaces.map(ws => `- ${ws.name} (ID: ${ws.id})`).join('\n'), 'Available Workspaces');
        s.stop('Fetched workspaces');
    },
    help: 'List all available workspaces'
  },
  {
    name: 'switch',
    run: async (options) => {
        const workspaces = await PostmanClient.getWorkspaces(AuthManager.getApiKey());
        const workspaceChoices = workspaces.map(ws => ({ value: ws.id, label: ws.name }));
        const selectedWorkspaceId = await select({
            message: 'Select a workspace to switch to:',
            options: workspaceChoices
        });

        if (selectedWorkspaceId) {
            const success = await AuthManager.setCurrentWorkspace(selectedWorkspaceId);
            if (success) {
                note(`Switched to workspace: ${workspaceChoices.find(ws => ws.value === selectedWorkspaceId).label}`, 'Workspace Switched');
            }
        }

    },
    help: 'Switch to a different workspace'
  }
];

export const help = 'Manage Postman workspaces';