/**
 * Enhanced Plugin Integration Layer for SiYuan MCP Server
 * Integrates Enhanced MCP Server with Streamable HTTP transport
 * Based on creative phase decisions and implementation plan
 */

import { Plugin } from "siyuan";
import { EnhancedMCPServer, createEnhancedMCPServer, EnhancedMCPServerConfig } from '../server/enhancedMcpServer.js';
import { MCPPluginSettings } from '../types/index.js';

/**
 * Enhanced plugin integration configuration
 */
export interface EnhancedPluginIntegrationConfig {
  plugin: Plugin;
  settings: MCPPluginSettings;
  serverConfig?: Partial<EnhancedMCPServerConfig>;
}

/**
 * Enhanced Plugin Integration Manager
 * Manages Enhanced MCP Server with Streamable HTTP transport
 */
export class EnhancedMCPPluginIntegration {
  private plugin: Plugin;
  private mcpServer: EnhancedMCPServer | null = null;
  private settings: MCPPluginSettings;
  private serverConfig: Partial<EnhancedMCPServerConfig>;
  private isInitialized = false;
  private isRunning = false;

  constructor(config: EnhancedPluginIntegrationConfig) {
    this.plugin = config.plugin;
    this.settings = config.settings;
    this.serverConfig = config.serverConfig || {};
  }

  /**
   * Initialize the enhanced MCP integration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Enhanced MCP integration already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing Enhanced MCP Plugin Integration...');

      // Create enhanced MCP server with configuration
      const config: Partial<EnhancedMCPServerConfig> = {
        name: 'siyuan-enhanced-mcp-server',
        version: '1.0.0',
        port: this.settings.port || 3000,
        enableCaching: this.settings.enableCaching !== false,
        ...this.serverConfig
      };

      this.mcpServer = await createEnhancedMCPServer(config);

      // Setup plugin UI and event handlers
      this.setupPluginInterface();

      this.isInitialized = true;
      console.log('✅ Enhanced MCP Plugin Integration initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Enhanced MCP integration:', error);
      throw error;
    }
  }

  /**
   * Start the enhanced MCP server
   */
  async startServer(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isRunning) {
      console.log('Enhanced MCP server already running');
      return;
    }

    if (!this.settings.enabled) {
      console.log('MCP server disabled in settings');
      return;
    }

    try {
      console.log('🌟 Starting Enhanced MCP Server...');
      await this.mcpServer!.start();
      this.isRunning = true;
      
      // Show success notification
      console.log(`🚀 Enhanced MCP Server started on port ${this.settings.port || 3000}`);

      console.log('✅ Enhanced MCP Server started successfully');

    } catch (error) {
      console.error('❌ Failed to start Enhanced MCP Server:', error);
      console.error(`❌ Failed to start MCP Server: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stop the enhanced MCP server
   */
  async stopServer(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      console.log('🛑 Stopping Enhanced MCP Server...');
      await this.mcpServer!.stop();
      this.isRunning = false;
      
      console.log('🛑 Enhanced MCP Server stopped');
      console.log('✅ Enhanced MCP Server stopped successfully');

    } catch (error) {
      console.error('❌ Error stopping Enhanced MCP Server:', error);
      throw error;
    }
  }

  /**
   * Restart the enhanced MCP server
   */
  async restartServer(): Promise<void> {
    console.log('🔄 Restarting Enhanced MCP Server...');
    await this.stopServer();
    await this.startServer();
  }

  /**
   * Update plugin settings
   */
  async updateSettings(newSettings: MCPPluginSettings): Promise<void> {
    const wasEnabled = this.settings.enabled;
    const wasRunning = this.isRunning;
    
    this.settings = newSettings;

    // Handle enable/disable
    if (newSettings.enabled && !wasEnabled) {
      await this.initialize();
      if (newSettings.autoStart) {
        await this.startServer();
      }
    } else if (!newSettings.enabled && wasEnabled) {
      await this.stopServer();
    }

    // Handle port change
    if (wasRunning && newSettings.port !== this.serverConfig.port) {
      await this.restartServer();
    }

    console.log('⚙️ Settings updated successfully');
  }

  /**
   * Setup plugin interface and event handlers
   */
  private setupPluginInterface(): void {
    // Add top bar icon for MCP server control
    this.plugin.addTopBar({
      icon: "iconServer",
      title: "Enhanced MCP Server",
      callback: () => {
        this.showServerControlDialog();
      }
    });

    // Add dock panel for server monitoring
    this.plugin.addDock({
      config: {
        position: "RightBottom",
        size: { width: 300, height: 400 },
        icon: "iconServer",
        title: "MCP Server Monitor"
      },
      data: {
        text: "MCP Server Monitor will be implemented in Phase 3"
      },
      type: "mcp-monitor",
      init: () => {
        console.log('MCP Monitor dock initialized');
      }
    });

    console.log('🎛️ Plugin interface configured');
  }

  /**
   * Show server control dialog (simplified for console output)
   */
  private showServerControlDialog(): void {
    const status = this.getStatus();
    const stats = status.serverStats;

    console.log('🚀 Enhanced MCP Server Control Panel');
    console.log('📊 Status:');
    console.log(`  Initialized: ${status.isInitialized ? '✅' : '❌'}`);
    console.log(`  Running: ${status.isRunning ? '✅' : '❌'}`);
    console.log(`  Port: ${this.settings.port || 3000}`);
    console.log(`  Caching: ${this.settings.enableCaching !== false ? '✅' : '❌'}`);

    if (stats) {
      console.log('📈 Statistics:');
      console.log(`  Active Sessions: ${stats.transport?.activeSessions || 0}`);
      console.log(`  Cache Entries: ${stats.cache?.totalEntries || 0}`);
      console.log(`  Cache Hit Rate: ${((stats.cache?.hitRate || 0) * 100).toFixed(1)}%`);
      console.log(`  Memory Usage: ${(stats.cache?.memoryUsageMB || 0).toFixed(2)} MB`);
    }

    console.log('🌐 Endpoints:');
    console.log(`  MCP: http://localhost:${this.settings.port || 3000}/mcp`);
    console.log(`  Health: http://localhost:${this.settings.port || 3000}/health`);
    console.log(`  Sessions: http://localhost:${this.settings.port || 3000}/sessions`);
  }

  /**
   * Get integration status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      settings: this.settings,
      serverConfig: this.serverConfig,
      serverStats: this.mcpServer?.getStatistics()
    };
  }

  /**
   * Get enhanced MCP server instance
   */
  getEnhancedMCPServer(): EnhancedMCPServer | null {
    return this.mcpServer;
  }

  /**
   * Test server connectivity
   */
  async testConnectivity(): Promise<boolean> {
    if (!this.isRunning) {
      return false;
    }

    try {
      const response = await fetch(`http://localhost:${this.settings.port || 3000}/health`);
      return response.ok;
    } catch (error) {
      console.error('Connectivity test failed:', error);
      return false;
    }
  }

  /**
   * Get server health information
   */
  async getHealthInfo(): Promise<any> {
    if (!this.isRunning) {
      return { status: 'stopped' };
    }

    try {
      const response = await fetch(`http://localhost:${this.settings.port || 3000}/health`);
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    await this.stopServer();
    
    if (this.mcpServer) {
      // Additional cleanup if needed
      this.mcpServer = null;
    }

    this.isInitialized = false;
    console.log('🧹 Enhanced MCP Plugin Integration destroyed');
  }
}

/**
 * Global integration instance
 */
let globalEnhancedIntegration: EnhancedMCPPluginIntegration | null = null;

/**
 * Factory function to create enhanced plugin integration
 */
export async function createEnhancedMCPPluginIntegration(
  config: EnhancedPluginIntegrationConfig
): Promise<EnhancedMCPPluginIntegration> {
  const integration = new EnhancedMCPPluginIntegration(config);
  await integration.initialize();
  return integration;
}

/**
 * Set global enhanced integration instance
 */
export function setGlobalEnhancedIntegration(integration: EnhancedMCPPluginIntegration): void {
  globalEnhancedIntegration = integration;
}

/**
 * Get global enhanced integration instance
 */
export function getGlobalEnhancedIntegration(): EnhancedMCPPluginIntegration | null {
  return globalEnhancedIntegration;
}

/**
 * Helper function to create integration with default settings
 */
export async function createDefaultEnhancedIntegration(
  plugin: Plugin,
  settings: MCPPluginSettings
): Promise<EnhancedMCPPluginIntegration> {
  return createEnhancedMCPPluginIntegration({
    plugin,
    settings,
    serverConfig: {
      port: settings.port || 3000,
      enableCaching: settings.enableCaching !== false
    }
  });
} 