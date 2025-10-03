const axios = require('axios');
const Logger = require('../utils/logger');

class PostmanClient {
  static BASE_URL = 'https://api.getpostman.com';

  /**
   * Create axios instance with default config
   * @param {string} apiKey - Postman API key
   * @returns {Object} Axios instance
   */
  static createClient(apiKey) {
    return axios.create({
      baseURL: this.BASE_URL,
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  /**
   * Validate API key by making a test request
   * @param {string} apiKey - API key to validate
   * @returns {Promise<boolean>} True if valid
   */
  static async validateApiKey(apiKey) {
    try {
      const client = this.createClient(apiKey);
      const response = await client.get('/me');
      return response.status === 200 && response.data.user;
    } catch (error) {
      Logger.debug('API key validation failed:', error.response?.data?.error?.message || error.message);
      return false;
    }
  }

  /**
   * Get user information
   * @param {string} apiKey - API key
   * @returns {Promise<Object|null>} User data or null if failed
   */
  static async getUserInfo(apiKey) {
    try {
      const client = this.createClient(apiKey);
      const response = await client.get('/me');
      return response.data.user;
    } catch (error) {
      Logger.error('Failed to get user info:', error.response?.data?.error?.message || error.message);
      return null;
    }
  }

  /**
   * Get all workspaces for the user
   * @param {string} apiKey - API key
   * @returns {Promise<Array>} Array of workspaces
   */
  static async getWorkspaces(apiKey) {
    try {
      const client = this.createClient(apiKey);
      const response = await client.get('/workspaces');
      return response.data.workspaces || [];
    } catch (error) {
      Logger.error('Failed to get workspaces:', error.response?.data?.error?.message || error.message);
      return [];
    }
  }

  /**
   * Get workspace details
   * @param {string} apiKey - API key
   * @param {string} workspaceId - Workspace ID
   * @returns {Promise<Object|null>} Workspace data or null if failed
   */
  static async getWorkspace(apiKey, workspaceId) {
    try {
      const client = this.createClient(apiKey);
      const response = await client.get(`/workspaces/${workspaceId}`);
      return response.data.workspace;
    } catch (error) {
      Logger.error('Failed to get workspace:', error.response?.data?.error?.message || error.message);
      return null;
    }
  }

  /**
   * Get collections in a workspace
   * @param {string} apiKey - API key
   * @param {string} workspaceId - Workspace ID (optional)
   * @returns {Promise<Array>} Array of collections
   */
  static async getCollections(apiKey, workspaceId = null) {
    try {
      const client = this.createClient(apiKey);
      let url = '/collections';

      if (workspaceId) {
        url += `?workspace=${workspaceId}`;
      }

      const response = await client.get(url);
      return response.data.collections || [];
    } catch (error) {
      Logger.error('Failed to get collections:', error.response?.data?.error?.message || error.message);
      return [];
    }
  }

  /**
   * Get collection details
   * @param {string} apiKey - API key
   * @param {string} collectionId - Collection ID
   * @returns {Promise<Object|null>} Collection data or null if failed
   */
  static async getCollection(apiKey, collectionId) {
    try {
      const client = this.createClient(apiKey);
      const response = await client.get(`/collections/${collectionId}`);
      return response.data.collection;
    } catch (error) {
      Logger.error('Failed to get collection:', error.response?.data?.error?.message || error.message);
      return null;
    }
  }

  /**
   * Get environments in a workspace
   * @param {string} apiKey - API key
   * @param {string} workspaceId - Workspace ID (optional)
   * @returns {Promise<Array>} Array of environments
   */
  static async getEnvironments(apiKey, workspaceId = null) {
    try {
      const client = this.createClient(apiKey);
      let url = '/environments';

      if (workspaceId) {
        url += `?workspace=${workspaceId}`;
      }

      const response = await client.get(url);
      return response.data.environments || [];
    } catch (error) {
      Logger.error('Failed to get environments:', error.response?.data?.error?.message || error.message);
      return [];
    }
  }

  /**
   * Get environment details
   * @param {string} apiKey - API key
   * @param {string} environmentId - Environment ID
   * @returns {Promise<Object|null>} Environment data or null if failed
   */
  static async getEnvironment(apiKey, environmentId) {
    try {
      const client = this.createClient(apiKey);
      const response = await client.get(`/environments/${environmentId}`);
      return response.data.environment;
    } catch (error) {
      Logger.error('Failed to get environment:', error.response?.data?.error?.message || error.message);
      return null;
    }
  }

  /**
   * Run a collection
   * @param {string} apiKey - API key
   * @param {string} collectionId - Collection ID
   * @param {Object} options - Run options
   * @returns {Promise<Object|null>} Run data or null if failed
   */
  static async runCollection(apiKey, collectionId, options = {}) {
    try {
      const client = this.createClient(apiKey);
      const payload = {
        collection: collectionId,
        ...options
      };

      const response = await client.post('/collection/runs', payload);
      return response.data.run;
    } catch (error) {
      Logger.error('Failed to run collection:', error.response?.data?.error?.message || error.message);
      return null;
    }
  }

  /**
   * Get run status
   * @param {string} apiKey - API key
   * @param {string} runId - Run ID
   * @returns {Promise<Object|null>} Run status or null if failed
   */
  static async getRunStatus(apiKey, runId) {
    try {
      const client = this.createClient(apiKey);
      const response = await client.get(`/collection/runs/${runId}`);
      return response.data.run;
    } catch (error) {
      Logger.error('Failed to get run status:', error.response?.data?.error?.message || error.message);
      return null;
    }
  }

  /**
   * Test API connectivity
   * @param {string} apiKey - API key
   * @returns {Promise<boolean>} True if API is reachable
   */
  static async testConnectivity(apiKey) {
    try {
      const client = this.createClient(apiKey);
      // Use a simple endpoint to test connectivity
      await client.get('/me');
      return true;
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        Logger.error('Unable to connect to Postman API. Check your internet connection.');
      } else if (error.response?.status === 401) {
        Logger.error('Invalid API key.');
      } else {
        Logger.error('API connectivity test failed:', error.message);
      }
      return false;
    }
  }
}

module.exports = PostmanClient;