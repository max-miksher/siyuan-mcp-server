/**
 * Settings Manager for SiYuan MCP Server Plugin
 * Handles configuration persistence, validation, and updates
 */

import { MCPPluginSettings, DEFAULT_SETTINGS } from '../types';

export class SettingsManager {
  private plugin: any; // SiYuan Plugin instance
  private currentSettings: MCPPluginSettings;
  private onChangeCallbacks: ((settings: MCPPluginSettings) => void)[] = [];

  constructor(plugin: any) {
    this.plugin = plugin;
    this.currentSettings = { ...DEFAULT_SETTINGS };
  }

  /**
   * Initialize settings from plugin data
   */
  async initialize(): Promise<void> {
    try {
      const savedSettings = await this.loadSettings();
      this.currentSettings = {
        ...DEFAULT_SETTINGS,
        ...savedSettings
      };
      
      // Validate settings after loading
      this.validateSettings();
      
      console.log('Settings initialized:', this.currentSettings);
    } catch (error) {
      console.error('Failed to initialize settings:', error);
      // Use defaults if loading fails
      this.currentSettings = { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Get current settings
   */
  getSettings(): MCPPluginSettings {
    return { ...this.currentSettings };
  }

  /**
   * Update settings with validation
   */
  async updateSettings(newSettings: Partial<MCPPluginSettings>): Promise<void> {
    const updatedSettings = {
      ...this.currentSettings,
      ...newSettings
    };

    // Validate settings before saving
    const validationResult = this.validateSettings(updatedSettings);
    if (!validationResult.isValid) {
      throw new Error(`Settings validation failed: ${validationResult.errors.join(', ')}`);
    }

    this.currentSettings = updatedSettings;
    await this.saveSettings();
    
    // Notify all listeners
    this.notifySettingsChange();
  }

  /**
   * Reset settings to defaults
   */
  async resetToDefaults(): Promise<void> {
    this.currentSettings = { ...DEFAULT_SETTINGS };
    await this.saveSettings();
    this.notifySettingsChange();
  }

  /**
   * Subscribe to settings changes
   */
  onSettingsChange(callback: (settings: MCPPluginSettings) => void): () => void {
    this.onChangeCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.onChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.onChangeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Validate settings
   */
  private validateSettings(settings: MCPPluginSettings = this.currentSettings): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate server port
    if (settings.serverPort < 1024 || settings.serverPort > 65535) {
      errors.push('Server port must be between 1024 and 65535');
    }

    // Validate API token (if enabled)
    if (settings.enabled && !settings.apiToken.trim()) {
      errors.push('API token is required when MCP server is enabled');
    }

    // Validate SSE endpoint
    if (!settings.sseEndpoint.startsWith('/')) {
      errors.push('SSE endpoint must start with /');
    }

    // Validate rate limiting
    if (settings.rateLimiting.enabled && settings.rateLimiting.requestsPerMinute < 1) {
      errors.push('Requests per minute must be at least 1');
    }

    // Validate session timeout
    if (settings.security.sessionTimeout < 5) {
      errors.push('Session timeout must be at least 5 minutes');
    }

    // Validate allowed origins
    if (settings.allowedOrigins.length === 0) {
      errors.push('At least one allowed origin must be specified');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Load settings from plugin data
   */
  private async loadSettings(): Promise<Partial<MCPPluginSettings>> {
    try {
      const data = await this.plugin.loadData('settings.json');
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.warn('Failed to load settings from plugin data:', error);
      return {};
    }
  }

  /**
   * Save settings to plugin data
   */
  private async saveSettings(): Promise<void> {
    try {
      await this.plugin.saveData('settings.json', JSON.stringify(this.currentSettings, null, 2));
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Notify all listeners of settings change
   */
  private notifySettingsChange(): void {
    this.onChangeCallbacks.forEach(callback => {
      try {
        callback(this.getSettings());
      } catch (error) {
        console.error('Error in settings change callback:', error);
      }
    });
  }

  /**
   * Export settings for backup
   */
  exportSettings(): string {
    return JSON.stringify(this.currentSettings, null, 2);
  }

  /**
   * Import settings from backup
   */
  async importSettings(settingsJson: string): Promise<void> {
    try {
      const importedSettings = JSON.parse(settingsJson);
      await this.updateSettings(importedSettings);
    } catch (error) {
      throw new Error(`Failed to import settings: ${error.message}`);
    }
  }

  /**
   * Get settings schema for UI generation
   */
  getSettingsSchema() {
    return {
      serverPort: {
        type: 'number',
        label: 'MCP Server Port',
        description: 'Port for the MCP server (1024-65535)',
        min: 1024,
        max: 65535,
        default: DEFAULT_SETTINGS.serverPort
      },
      apiToken: {
        type: 'password',
        label: 'SiYuan API Token',
        description: 'API token from SiYuan settings',
        required: true
      },
      enabled: {
        type: 'boolean',
        label: 'Enable MCP Server',
        description: 'Start/stop the MCP server',
        default: DEFAULT_SETTINGS.enabled
      },
      sseEndpoint: {
        type: 'text',
        label: 'SSE Endpoint Path',
        description: 'Server-Sent Events endpoint path',
        default: DEFAULT_SETTINGS.sseEndpoint
      },
      allowedOrigins: {
        type: 'array',
        label: 'Allowed Origins',
        description: 'CORS allowed origins (use * for all)',
        default: DEFAULT_SETTINGS.allowedOrigins
      },
      rateLimiting: {
        type: 'object',
        label: 'Rate Limiting',
        properties: {
          enabled: {
            type: 'boolean',
            label: 'Enable Rate Limiting',
            default: DEFAULT_SETTINGS.rateLimiting.enabled
          },
          requestsPerMinute: {
            type: 'number',
            label: 'Requests Per Minute',
            min: 1,
            default: DEFAULT_SETTINGS.rateLimiting.requestsPerMinute
          }
        }
      },
      security: {
        type: 'object',
        label: 'Security Settings',
        properties: {
          requireAuth: {
            type: 'boolean',
            label: 'Require Authentication',
            default: DEFAULT_SETTINGS.security.requireAuth
          },
          sessionTimeout: {
            type: 'number',
            label: 'Session Timeout (minutes)',
            min: 5,
            default: DEFAULT_SETTINGS.security.sessionTimeout
          }
        }
      }
    };
  }
} 