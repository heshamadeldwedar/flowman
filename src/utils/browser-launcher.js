import open from 'open';
import express from 'express';
import http from 'http';
import Logger from './logger.js';
import Validator from './validator.js';

class BrowserLauncher {
  /**
   * Launch browser for OAuth flow
   * @param {Object} options - OAuth configuration
   * @returns {Promise<Object>} OAuth result
   */
  static async launchOAuthFlow(options = {}) {
    const {
      authUrl,
      callbackPort = 3000,
      timeout = 300000, // 5 minutes
      successMessage = 'Authentication successful! You can close this window.',
      errorMessage = 'Authentication failed. Please try again.'
    } = options;

    if (!authUrl || !Validator.validateUrl(authUrl)) {
      throw new Error('Invalid auth URL provided');
    }

    if (!Validator.validatePort(callbackPort)) {
      throw new Error('Invalid callback port provided');
    }

    return new Promise((resolve, reject) => {
      const app = express();
      let server;
      let timeoutHandle;

      // Setup timeout
      timeoutHandle = setTimeout(() => {
        if (server) {
          server.close();
        }
        reject(new Error('OAuth flow timed out'));
      }, timeout);

      // Configure express app
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));

      // OAuth callback endpoint
      app.get('/callback', (req, res) => {
        clearTimeout(timeoutHandle);

        try {
          const { code, error, error_description } = req.query;

          if (error) {
            Logger.error('OAuth error:', error_description || error);
            res.send(`<html><body><h1>Error</h1><p>${errorMessage}</p><script>setTimeout(() => window.close(), 3000);</script></body></html>`);
            server.close();
            reject(new Error(error_description || error));
            return;
          }

          if (!code) {
            Logger.error('No authorization code received');
            res.send(`<html><body><h1>Error</h1><p>${errorMessage}</p><script>setTimeout(() => window.close(), 3000);</script></body></html>`);
            server.close();
            reject(new Error('No authorization code received'));
            return;
          }

          // Success response
          res.send(`<html><body><h1>Success!</h1><p>${successMessage}</p><script>setTimeout(() => window.close(), 3000);</script></body></html>`);

          server.close();
          resolve({
            code,
            state: req.query.state,
            success: true
          });
        } catch (err) {
          Logger.error('Callback processing error:', err.message);
          res.send(`<html><body><h1>Error</h1><p>${errorMessage}</p><script>setTimeout(() => window.close(), 3000);</script></body></html>`);
          server.close();
          reject(err);
        }
      });

      // Health check endpoint
      app.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
      });

      // Default route
      app.get('/', (req, res) => {
        res.send('<html><body><h1>OAuth Callback Server</h1><p>Waiting for authentication...</p></body></html>');
      });

      // Error handling
      app.use((err, req, res, next) => {
        Logger.error('Express error:', err.message);
        res.status(500).send(`<html><body><h1>Server Error</h1><p>${errorMessage}</p></body></html>`);
      });

      // Start server
      server = app.listen(callbackPort, (err) => {
        if (err) {
          clearTimeout(timeoutHandle);
          reject(new Error(`Failed to start callback server: ${err.message}`));
          return;
        }

        Logger.info(`OAuth callback server started on port ${callbackPort}`);

        // Launch browser
        this.openBrowser(authUrl)
          .then(() => {
            Logger.info('Browser launched successfully');
          })
          .catch((browserErr) => {
            Logger.warn('Failed to open browser automatically:', browserErr.message);
            Logger.info(`Please manually open this URL in your browser: ${authUrl}`);
          });
      });

      // Handle server errors
      server.on('error', (err) => {
        clearTimeout(timeoutHandle);
        Logger.error('Server error:', err.message);
        reject(new Error(`Server error: ${err.message}`));
      });
    });
  }

  /**
   * Open URL in browser
   * @param {string} url - URL to open
   * @param {Object} options - Browser options
   * @returns {Promise<void>}
   */
  static async openBrowser(url, options = {}) {
    const {
      app = undefined, // Let 'open' choose default browser
      wait = false,
      background = false
    } = options;

    if (!url || !Validator.validateUrl(url)) {
      throw new Error('Invalid URL provided');
    }

    try {
      await open(url, {
        app: app ? { name: app } : undefined,
        wait,
        background
      });
    } catch (error) {
      throw new Error(`Failed to open browser: ${error.message}`);
    }
  }

  /**
   * Find available port for callback server
   * @param {number} startPort - Starting port number
   * @param {number} maxAttempts - Maximum attempts to find port
   * @returns {Promise<number>} Available port number
   */
  static async findAvailablePort(startPort = 3000, maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      const port = startPort + i;

      if (await this.isPortAvailable(port)) {
        return port;
      }
    }

    throw new Error(`No available port found after ${maxAttempts} attempts`);
  }

  /**
   * Check if port is available
   * @param {number} port - Port number to check
   * @returns {Promise<boolean>} True if port is available
   */
  static isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = http.createServer();

      server.listen(port, () => {
        server.close(() => {
          resolve(true);
        });
      });

      server.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Build OAuth URL with parameters
   * @param {Object} params - OAuth parameters
   * @returns {string} Complete OAuth URL
   */
  static buildOAuthUrl(params) {
    const {
      baseUrl,
      clientId,
      redirectUri,
      scope = '',
      state = '',
      responseType = 'code'
    } = params;

    if (!baseUrl || !clientId || !redirectUri) {
      throw new Error('Missing required OAuth parameters');
    }

    const url = new URL(baseUrl);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', responseType);

    if (scope) {
      url.searchParams.set('scope', scope);
    }

    if (state) {
      url.searchParams.set('state', state);
    }

    return url.toString();
  }

  /**
   * Generate random state parameter for OAuth
   * @param {number} length - Length of state string
   * @returns {string} Random state string
   */
  static generateState(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }
}

export default BrowserLauncher;