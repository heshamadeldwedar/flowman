const CredentialStorage = require('./credential-storage');
const Logger = require('../utils/logger');

class AuthManager {
  /**
   * Check if user is currently authenticated
   * @returns {boolean} True if authenticated
   */
  static isAuthenticated() {
    return CredentialStorage.isAuthenticated();
  }

  /**
   * Get authentication status with details
   * @returns {Object} Authentication status object
   */
  static getAuthStatus() {
    const credentials = CredentialStorage.getAllCredentials();
    const hasApiKey = !!credentials.apiKey;
    const hasWorkspace = !!credentials.workspaceId;

    return {
      authenticated: hasApiKey,
      hasApiKey,
      hasWorkspace,
      apiKey: hasApiKey ? this.maskApiKey(credentials.apiKey) : null,
      workspaceId: credentials.workspaceId
    };
  }

  /**
   * Authenticate user with API key
   * @param {string} apiKey - Postman API key
   * @param {string} workspaceId - Optional workspace ID
   * @returns {Promise<boolean>} True if authentication successful
   */
  static async authenticateWithApiKey(apiKey, workspaceId = null) {
    try {
      // Store credentials
      const success = CredentialStorage.storeCredentials({
        apiKey,
        workspaceId
      });

      if (!success) {
        Logger.error('Failed to store credentials');
        return false;
      }

      // Validate credentials with Postman API
      const isValid = await this.validateCredentials();
      if (!isValid) {
        Logger.error('Invalid credentials provided');
        // Clear invalid credentials
        CredentialStorage.clearCredentials();
        return false;
      }

      Logger.success('Authentication successful');
      return true;
    } catch (error) {
      Logger.error('Authentication failed:', error.message);
      return false;
    }
  }

  /**
   * Logout user by clearing stored credentials
   * @returns {boolean} True if logout successful
   */
  static logout() {
    try {
      const success = CredentialStorage.clearCredentials();
      if (success) {
        Logger.success('Logged out successfully');
      }
      return success;
    } catch (error) {
      Logger.error('Logout failed:', error.message);
      return false;
    }
  }

  /**
   * Validate stored credentials with Postman API
   * @returns {Promise<boolean>} True if credentials are valid
   */
  static async validateCredentials() {
    const apiKey = CredentialStorage.getApiKey();
    if (!apiKey) {
      return false;
    }

    try {
      // This will be implemented when we create the Postman client
      const PostmanClient = require('./postman-client');
      return await PostmanClient.validateApiKey(apiKey);
    } catch (error) {
      Logger.debug('Credential validation failed:', error.message);
      return false;
    }
  }

  /**
   * Get stored API key (masked for display)
   * @returns {string|null} Masked API key or null
   */
  static getMaskedApiKey() {
    const apiKey = CredentialStorage.getApiKey();
    return apiKey ? this.maskApiKey(apiKey) : null;
  }

  /**
   * Get stored workspace ID
   * @returns {string|null} Workspace ID or null
   */
  static getWorkspaceId() {
    return CredentialStorage.getWorkspaceId();
  }

  /**
   * Mask API key for display purposes
   * @param {string} apiKey - The API key to mask
   * @returns {string} Masked API key
   */
  static maskApiKey(apiKey) {
    if (!apiKey || apiKey.length < 8) {
      return '****';
    }

    const start = apiKey.substring(0, 8);
    const end = apiKey.substring(apiKey.length - 4);
    const middle = '*'.repeat(Math.max(0, apiKey.length - 12));

    return `${start}${middle}${end}`;
  }

  /**
   * Ensure user is authenticated before proceeding
   * @throws {Error} If user is not authenticated
   */
  static requireAuthentication() {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required. Please run "flowman-cli login" first.');
    }
  }

  /**
   * Get authentication headers for API requests
   * @returns {Object} Headers object with authentication
   */
  static getAuthHeaders() {
    const apiKey = CredentialStorage.getApiKey();
    if (!apiKey) {
      throw new Error('No API key found. Please authenticate first.');
    }

    return {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Check if credentials need refresh/validation
   * @returns {Promise<boolean>} True if credentials are still valid
   */
  static async checkCredentialsHealth() {
    if (!this.isAuthenticated()) {
      return false;
    }

    // Validate format first
    if (!CredentialStorage.validateStoredApiKey()) {
      Logger.warn('Stored API key format is invalid');
      return false;
    }

    // Then validate with API
    return await this.validateCredentials();
  }

  /**
   * Refresh authentication status by validating with API
   * @returns {Promise<boolean>} True if still authenticated
   */
  static async refreshAuthStatus() {
    const isValid = await this.checkCredentialsHealth();
    if (!isValid && this.isAuthenticated()) {
      Logger.warn('Stored credentials are no longer valid');
      CredentialStorage.clearCredentials();
    }
    return isValid;
  }
}

module.exports = AuthManager;