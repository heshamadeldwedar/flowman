const fs = require('fs');
const Logger = require('./logger');

class Validator {
  /**
   * Validate Postman API key format
   * @param {string} apiKey - The API key to validate
   * @returns {boolean} True if valid
   */
  static validateApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      Logger.error('API key must be a non-empty string');
      return false;
    }

    // Postman API keys typically start with "PMAK-"
    if (!apiKey.startsWith('PMAK-')) {
      Logger.error('Invalid API key format. Postman API keys should start with "PMAK-"');
      return false;
    }

    if (apiKey.length < 20) {
      Logger.error('API key appears to be too short');
      return false;
    }

    return true;
  }

  /**
   * Validate Postman workspace ID format
   * @param {string} workspaceId - The workspace ID to validate
   * @returns {boolean} True if valid
   */
  static validateWorkspaceId(workspaceId) {
    if (!workspaceId || typeof workspaceId !== 'string') {
      Logger.error('Workspace ID must be a non-empty string');
      return false;
    }

    // Postman workspace IDs are typically UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(workspaceId)) {
      Logger.error('Invalid workspace ID format. Should be a valid UUID');
      return false;
    }

    return true;
  }

  /**
   * Validate email format
   * @param {string} email - The email to validate
   * @returns {boolean} True if valid
   */
  static validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   * @param {string} url - The URL to validate
   * @returns {boolean} True if valid
   */
  static validateUrl(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }

    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate port number
   * @param {number|string} port - The port to validate
   * @returns {boolean} True if valid
   */
  static validatePort(port) {
    const portNum = parseInt(port, 10);
    return !isNaN(portNum) && portNum > 0 && portNum <= 65535;
  }

  /**
   * Validate that a string is not empty
   * @param {string} value - The value to validate
   * @param {string} fieldName - Name of the field for error message
   * @returns {boolean} True if valid
   */
  static validateRequired(value, fieldName = 'Field') {
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      Logger.error(`${fieldName} is required`);
      return false;
    }
    return true;
  }

  /**
   * Validate collection ID format
   * @param {string} collectionId - The collection ID to validate
   * @returns {boolean} True if valid
   */
  static validateCollectionId(collectionId) {
    if (!collectionId || typeof collectionId !== 'string') {
      Logger.error('Collection ID must be a non-empty string');
      return false;
    }

    // Collection IDs are typically UUIDs or similar format
    if (collectionId.length < 10) {
      Logger.error('Collection ID appears to be too short');
      return false;
    }

    return true;
  }

  /**
   * Validate environment ID format
   * @param {string} environmentId - The environment ID to validate
   * @returns {boolean} True if valid
   */
  static validateEnvironmentId(environmentId) {
    if (!environmentId || typeof environmentId !== 'string') {
      Logger.error('Environment ID must be a non-empty string');
      return false;
    }

    // Environment IDs are typically UUIDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(environmentId)) {
      Logger.error('Invalid environment ID format. Should be a valid UUID');
      return false;
    }

    return true;
  }

  /**
   * Validate JSON string
   * @param {string} jsonString - The JSON string to validate
   * @returns {boolean} True if valid JSON
   */
  static validateJson(jsonString) {
    if (!jsonString || typeof jsonString !== 'string') {
      return false;
    }

    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      Logger.error('Invalid JSON format');
      return false;
    }
  }

  /**
   * Validate file path exists
   * @param {string} filePath - The file path to validate
   * @returns {boolean} True if file exists
   */
  static validateFileExists(filePath) {
    if (!filePath || typeof filePath !== 'string') {
      Logger.error('File path must be a non-empty string');
      return false;
    }

    if (!fs.existsSync(filePath)) {
      Logger.error(`File not found: ${filePath}`);
      return false;
    }

    return true;
  }
}

module.exports = Validator;