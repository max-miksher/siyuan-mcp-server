/**
 * Enhanced MCP Server for SiYuan Plugin
 * Integrates Streamable HTTP transport with comprehensive SiYuan API capabilities
 * Based on creative phase decisions and Context7 best practices
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPTransportManager } from '../transport/streamableHttpTransport.js';
import { SiYuanAPIAdapter } from './apiAdapter.js';
import { CacheManager } from '../utils/cacheManager.js';
import { SiYuanResourcesManager } from '../resources/siyuanResources.js';
import { SiYuanToolsManager } from '../tools/siyuanTools.js';
import { SiYuanPromptsManager } from '../prompts/siyuanPrompts.js';
import { z } from 'zod';

/**
 * Enhanced MCP Server Configuration
 */
export interface EnhancedMCPServerConfig {
  name: string;
  version: string;
  port: number;
  enableCaching: boolean;
  cacheConfig?: {
    maxSize: number;
    ttl: number;
  };
  siyuanConfig?: {
    apiUrl: string;
    token?: string;
  };
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: EnhancedMCPServerConfig = {
  name: 'siyuan-enhanced-mcp-server',
  version: '1.0.0',
  port: 3000,
  enableCaching: true,
  cacheConfig: {
    maxSize: 1000,
    ttl: 300000 // 5 minutes
  }
};

/**
 * Enhanced MCP Server with Streamable HTTP and SiYuan Integration
 */
export class EnhancedMCPServer {
  private config: EnhancedMCPServerConfig;
  private transport: StreamableHTTPTransportManager | null = null;
  private apiAdapter: SiYuanAPIAdapter | null = null;
  private cacheManager: CacheManager | null = null;
  private isInitialized = false;
  private isRunning = false;

  constructor(config: Partial<EnhancedMCPServerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the enhanced MCP server
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Enhanced MCP Server already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing Enhanced MCP Server...');

      // Initialize cache manager if enabled
      if (this.config.enableCaching) {
        this.cacheManager = new CacheManager(this.config.cacheConfig!);
        console.log('✅ Cache manager initialized');
      }

      // Initialize SiYuan API adapter
      this.apiAdapter = new SiYuanAPIAdapter(this.cacheManager);
      console.log('✅ SiYuan API adapter initialized');

      // Initialize Streamable HTTP transport
      this.transport = new StreamableHTTPTransportManager(this.config.port);
      console.log('✅ Streamable HTTP transport initialized');

      this.isInitialized = true;
      console.log('✅ Enhanced MCP Server initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Enhanced MCP Server:', error);
      throw error;
    }
  }

  /**
   * Setup MCP server capabilities for a session
   */
  async setupServerCapabilities(server: McpServer): Promise<void> {
    if (!this.apiAdapter) {
      throw new Error('API adapter not initialized');
    }

    console.log('🔧 Setting up MCP server capabilities...');

    // Setup Resources
    await this.setupResources(server);

    // Setup Tools
    await this.setupTools(server);

    // Setup Prompts
    await this.setupPrompts(server);

    console.log('✅ MCP server capabilities configured');
  }

  /**
   * Setup SiYuan resources using the new Resources Manager
   */
  private async setupResources(server: McpServer): Promise<void> {
    const resourcesManager = new SiYuanResourcesManager(this.apiAdapter!, this.cacheManager!);
    const resourceDefinitions = resourcesManager.getResourceDefinitions();
    
    for (const resourceDef of resourceDefinitions) {
      if (typeof resourceDef.template === 'string') {
        // Static resource
        server.resource(
          resourceDef.name,
          resourceDef.template,
          resourceDef.handler
        );
      } else {
        // Dynamic resource with ResourceTemplate
        server.resource(
          resourceDef.name,
          resourceDef.template,
          resourceDef.handler
        );
      }
    }

    console.log(`📚 Resources configured: ${resourceDefinitions.length} SiYuan resources with intelligent caching`);
  }

  /**
   * Setup SiYuan tools using the new Tools Manager
   */
  private async setupTools(server: McpServer): Promise<void> {
    const toolsManager = new SiYuanToolsManager(this.apiAdapter!, this.cacheManager!);
    const toolDefinitions = toolsManager.getToolDefinitions();
    
    for (const toolDef of toolDefinitions) {
      server.tool(
        toolDef.name,
        toolDef.inputSchema,
        toolDef.handler
      );
    }

    console.log(`🔧 Tools configured: ${toolDefinitions.length} comprehensive SiYuan tools with caching`);
  }

  /**
   * Setup SiYuan prompts using the new Prompts Manager
   */
  private async setupPrompts(server: McpServer): Promise<void> {
    const promptsManager = new SiYuanPromptsManager(this.apiAdapter!, this.cacheManager!);
    const promptDefinitions = promptsManager.getPromptDefinitions();
    
    for (const promptDef of promptDefinitions) {
      server.prompt(
        promptDef.name,
        promptDef.inputSchema,
        promptDef.handler
      );
    }

    console.log(`💬 Prompts configured: ${promptDefinitions.length} intelligent SiYuan prompts`);
  }

  /**
   * Start the enhanced MCP server
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isRunning) {
      console.log('Enhanced MCP Server already running');
      return;
    }

    try {
      // Start the transport
      await this.transport!.start();
      
      this.isRunning = true;
      console.log('🌟 Enhanced MCP Server started successfully');
      console.log(`📡 Server available at: http://localhost:${this.config.port}/mcp`);
      
    } catch (error) {
      console.error('❌ Failed to start Enhanced MCP Server:', error);
      throw error;
    }
  }

  /**
   * Stop the enhanced MCP server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      // Stop the transport
      if (this.transport) {
        await this.transport.stop();
      }

      this.isRunning = false;
      console.log('🛑 Enhanced MCP Server stopped');
      
    } catch (error) {
      console.error('❌ Error stopping Enhanced MCP Server:', error);
      throw error;
    }
  }

  /**
   * Get server statistics
   */
  getStatistics() {
    return {
      config: this.config,
      isInitialized: this.isInitialized,
      isRunning: this.isRunning,
      transport: this.transport?.getStatistics(),
      cache: this.cacheManager?.getStatistics(),
      api: this.apiAdapter?.getToolStatistics()
    };
  }

  /**
   * Get cache manager
   */
  getCacheManager(): CacheManager | null {
    return this.cacheManager;
  }

  /**
   * Get API adapter
   */
  getAPIAdapter(): SiYuanAPIAdapter | null {
    return this.apiAdapter;
  }

  /**
   * Get transport manager
   */
  getTransportManager(): StreamableHTTPTransportManager | null {
    return this.transport;
  }
}

/**
 * Factory function to create and start enhanced MCP server
 */
export async function createEnhancedMCPServer(config?: Partial<EnhancedMCPServerConfig>): Promise<EnhancedMCPServer> {
  const server = new EnhancedMCPServer(config);
  await server.initialize();
  return server;
} 