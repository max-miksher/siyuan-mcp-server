/**
 * Plugin Integration Layer for SiYuan MCP Server
 * Connects MCP server with SiYuan plugin infrastructure
 */

import { Plugin } from "siyuan";
import { SiYuanMCPServer, createSiYuanMCPServer } from '../server/mcpServer';
import { MCPPluginSettings } from '../types';

/**
 * Plugin integration manager for MCP server
 */
export class MCPPluginIntegration {
  private plugin: Plugin;
  private mcpServer: SiYuanMCPServer | null = null;
  private settings: MCPPluginSettings;
  private isStarted = false;

  constructor(plugin: Plugin, settings: MCPPluginSettings) {
    this.plugin = plugin;
    this.settings = settings;
  }

  /**
   * Initialize and start MCP server integration
   */
  async initialize(): Promise<void> {
    if (this.isStarted) {
      console.log('MCP integration already started');
      return;
    }

    try {
      console.log('🚀 Initializing MCP Plugin Integration...');

      // Create MCP server
      this.mcpServer = await createSiYuanMCPServer();

      // Setup plugin event handlers
      this.setupPluginEventHandlers();

      console.log('✅ MCP Plugin Integration initialized successfully');
      this.isStarted = true;
    } catch (error) {
      console.error('❌ Failed to initialize MCP integration:', error);
      throw error;
    }
  }

  /**
   * Start MCP server (for background mode)
   */
  async startServer(): Promise<void> {
    if (!this.mcpServer) {
      throw new Error('MCP server not initialized');
    }

    if (this.settings.enabled && this.settings.autoStart) {
      console.log('🌟 Starting MCP server in background mode...');
      // Note: In plugin context, we don't start stdio transport
      // Instead, we make the server available for external connections
      console.log('✅ MCP server ready for external connections');
    }
  }

  /**
   * Stop MCP server
   */
  async stopServer(): Promise<void> {
    if (this.mcpServer) {
      await this.mcpServer.stop();
      console.log('🛑 MCP server stopped');
    }
  }

  /**
   * Update plugin settings
   */
  async updateSettings(newSettings: MCPPluginSettings): Promise<void> {
    this.settings = newSettings;

    if (newSettings.enabled && !this.isStarted) {
      await this.initialize();
      await this.startServer();
    } else if (!newSettings.enabled && this.isStarted) {
      await this.stopServer();
    }
  }

  /**
   * Get MCP server instance
   */
  getMCPServer(): SiYuanMCPServer | null {
    return this.mcpServer;
  }

  /**
   * Get integration status
   */
  getStatus(): any {
    return {
      initialized: this.isStarted,
      serverReady: this.mcpServer !== null,
      settings: this.settings,
      serverStats: this.mcpServer?.getStatistics()
    };
  }

  /**
   * Setup plugin event handlers
   */
  private setupPluginEventHandlers(): void {
    // Handle plugin loading events
    this.plugin.addTopBar({
      icon: "iconServer",
      title: "MCP Server Status",
      callback: () => {
        this.showStatusDialog();
      }
    });

    // Log integration ready
    console.log('🔗 Plugin event handlers configured');
  }

  /**
   * Show MCP server status dialog
   */
  private showStatusDialog(): void {
    const status = this.getStatus();
    const stats = status.serverStats;

    let statusText = `📊 MCP Server Status\n\n`;
    statusText += `🔌 Initialized: ${status.initialized ? '✅' : '❌'}\n`;
    statusText += `🌟 Server Ready: ${status.serverReady ? '✅' : '❌'}\n`;
    
    if (stats) {
      statusText += `\n📈 Statistics:\n`;
      statusText += `• Total Tools: ${stats.tools?.totalTools || 0}\n`;
      
      if (stats.tools?.byCategory) {
        statusText += `• By Category:\n`;
        Object.entries(stats.tools.byCategory).forEach(([category, count]) => {
          statusText += `  - ${category}: ${count} tools\n`;
        });
      }
    }

    statusText += `\n⚙️ Settings:\n`;
    statusText += `• Enabled: ${status.settings.enabled ? '✅' : '❌'}\n`;
    statusText += `• Auto Start: ${status.settings.autoStart ? '✅' : '❌'}\n`;

    this.plugin.showMessage(statusText, 10000);
  }

  /**
   * Test tool execution
   */
  async testToolExecution(toolName: string, args: any = {}): Promise<any> {
    if (!this.mcpServer) {
      throw new Error('MCP server not initialized');
    }

    const tool = this.mcpServer.getTool(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    console.log(`🧪 Testing tool: ${toolName}`);
    const result = await tool.handler(args);
    console.log(`✅ Test result:`, result);
    
    return result;
  }

  /**
   * List available tools by category
   */
  getAvailableTools(): any {
    if (!this.mcpServer) {
      return { tools: [], categories: [] };
    }

    const stats = this.mcpServer.getStatistics();
    const tools: any[] = [];
    const categories: string[] = [];

    if (stats.tools?.byCategory) {
      Object.keys(stats.tools.byCategory).forEach(category => {
        categories.push(category);
        const categoryTools = this.mcpServer!.getToolsByCategory(category);
        tools.push(...categoryTools.map(tool => ({
          name: tool.name,
          category: tool.category,
          description: tool.description,
          tags: tool.tags
        })));
      });
    }

    return { tools, categories };
  }
}

/**
 * Factory function to create plugin integration
 */
export async function createMCPPluginIntegration(
  plugin: Plugin, 
  settings: MCPPluginSettings
): Promise<MCPPluginIntegration> {
  const integration = new MCPPluginIntegration(plugin, settings);
  await integration.initialize();
  return integration;
}

/**
 * Plugin integration singleton
 */
let globalIntegration: MCPPluginIntegration | null = null;

export function setGlobalIntegration(integration: MCPPluginIntegration): void {
  globalIntegration = integration;
}

export function getGlobalIntegration(): MCPPluginIntegration | null {
  return globalIntegration;
}