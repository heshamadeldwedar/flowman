const ConfigFileManager = require('../utils/config-file-manager');
const Validator = require('../utils/validator');
const Logger = require('../utils/logger');

class CredentialStorage {
  static POSTMAN_API_KEY = 'POSTMAN_API_KEY';
  static POSTMAN_WORKSPACE_ID = 'POSTMAN_WORKSPACE_ID';

  /**
   * Store Postman API key
   * @param {string} apiKey - The Postman API key
   * @returns {boolean} True if successful
   */
  static storeApiKey(apiKey) {
    if (!Validator.validateApiKey(apiKey)) {
      return false;
    }

    const success = ConfigFileManager.writeEnvVariable(
      this.POSTMAN_API_KEY,
      apiKey,
      {
        comment: 'Postman API Key for flowman-cli',
        overwrite: true
      }
    );

    if (success) {
      // Also set in current process environment
      process.env[this.POSTMAN_API_KEY] = apiKey;
      Logger.success('Postman API key stored successfully');
    }

    return success;
  }

  /**
   * Get stored Postman API key
   * @returns {string|null} API key or null if not found
   */
  static getApiKey() {
    return ConfigFileManager.readEnvVariable(this.POSTMAN_API_KEY);
  }

  /**
   * Store Postman workspace ID
   * @param {string} workspaceId - The Postman workspace ID
   * @returns {boolean} True if successful
   */
  static storeWorkspaceId(workspaceId) {
    if (!Validator.validateWorkspaceId(workspaceId)) {
      return false;
    }

    const success = ConfigFileManager.writeEnvVariable(
      this.POSTMAN_WORKSPACE_ID,
      workspaceId,
      {
        comment: 'Postman Workspace ID for flowman-cli',
        overwrite: true
      }
    );

    if (success) {
      // Also set in current process environment
      process.env[this.POSTMAN_WORKSPACE_ID] = workspaceId;
      Logger.success('Postman workspace ID stored successfully');
    }

    return success;
  }

  /**
   * Get stored Postman workspace ID
   * @returns {string|null} Workspace ID or null if not found
   */
  static getWorkspaceId() {
    return ConfigFileManager.readEnvVariable(this.POSTMAN_WORKSPACE_ID);
  }

  /**
   * Check if API key is stored
   * @returns {boolean} True if API key exists
   */
  static hasApiKey() {
    return ConfigFileManager.hasEnvVariable(this.POSTMAN_API_KEY);
  }

  /**
   * Check if workspace ID is stored
   * @returns {boolean} True if workspace ID exists
   */
  static hasWorkspaceId() {
    return ConfigFileManager.hasEnvVariable(this.POSTMAN_WORKSPACE_ID);
  }

  /**
   * Remove stored credentials
   * @returns {boolean} True if successful
   */
  static clearCredentials() {
    const apiKeyRemoved = ConfigFileManager.removeEnvVariable(this.POSTMAN_API_KEY);
    const workspaceIdRemoved = ConfigFileManager.removeEnvVariable(this.POSTMAN_WORKSPACE_ID);

    // Also clear from current process environment
    delete process.env[this.POSTMAN_API_KEY];
    delete process.env[this.POSTMAN_WORKSPACE_ID];

    if (apiKeyRemoved && workspaceIdRemoved) {
      Logger.success('All credentials cleared successfully');
      return true;
    } else if (apiKeyRemoved || workspaceIdRemoved) {
      Logger.success('Some credentials cleared successfully');
      return true;
    } else {
      Logger.info('No credentials found to clear');
      return false;
    }
  }

  /**
   * Get all stored credentials
   * @returns {Object} Object containing all credentials
   */
  static getAllCredentials() {
    return {
      apiKey: this.getApiKey(),
      workspaceId: this.getWorkspaceId()
    };
  }

  /**
   * Check if user is authenticated (has API key)
   * @returns {boolean} True if authenticated
   */
  static isAuthenticated() {
    return this.hasApiKey() && this.getApiKey() !== null;
  }

  /**
   * Store multiple credentials at once
   * @param {Object} credentials - Object containing credentials
   * @param {string} credentials.apiKey - Postman API key
   * @param {string} credentials.workspaceId - Postman workspace ID (optional)
   * @returns {boolean} True if all successful
   */
  static storeCredentials({ apiKey, workspaceId }) {
    let success = true;

    if (apiKey) {
      success = this.storeApiKey(apiKey) && success;
    }

    if (workspaceId) {
      success = this.storeWorkspaceId(workspaceId) && success;
    }

    return success;
  }

  /**
   * Validate stored API key format
   * @returns {boolean} True if API key format is valid
   */
  static validateStoredApiKey() {
    const apiKey = this.getApiKey();
    return apiKey ? Validator.validateApiKey(apiKey) : false;
  }

  /**
   * Validate stored workspace ID format
   * @returns {boolean} True if workspace ID format is valid
   */
  static validateStoredWorkspaceId() {
    const workspaceId = this.getWorkspaceId();
    return workspaceId ? Validator.validateWorkspaceId(workspaceId) : false;
  }
}

module.exports = CredentialStorage;