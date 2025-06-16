/**
 * Enhanced MCP Server for SiYuan Plugin
 * Integrates tool registry with MCP server infrastructure
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import { MCPToolRegistry, createMCPToolRegistry } from './toolRegistry.js';
import { TOOL_CATEGORIES } from '../schemas/categoryDefinitions.js';

/**
 * Enhanced MCP Server with SiYuan API integration
 */
export class SiYuanMCPServer {
  private server: Server;
  private toolRegistry: MCPToolRegistry | null = null;
  private isInitialized = false;

  constructor() {
    this.server = new Server(
      {
        name: 'siyuan-mcp-server',
        version: '1.0.0',
        description: 'SiYuan Plugin MCP Server with 42 API tools'
      },
      {
        capabilities: {
          tools: {},
          logging: {}
        }
      }
    );

    this.setupServerHandlers();
  }

  /**
   * Initialize the MCP server with tool registry
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('MCP Server already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing SiYuan MCP Server...');

      // Create and register all tools
      this.toolRegistry = await createMCPToolRegistry(this.server);

      this.isInitialized = true;
      console.log('✅ SiYuan MCP Server initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize MCP Server:', error);
      throw error;
    }
  }

  /**
   * Setup MCP server request handlers
   */
  private setupServerHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      if (!this.toolRegistry) {
        return { tools: [] };
      }

      const tools: Tool[] = [];
      const stats = this.toolRegistry.getStatistics();

      // Generate tool list from registry
      for (const [category, count] of Object.entries(stats.byCategory)) {
        const categoryTools = this.toolRegistry.getToolsByCategory(category);
        
        for (const tool of categoryTools) {
          tools.push({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema._def as any
          });
        }
      }

      console.log(`📋 Listed ${tools.length} available tools`);
      return { tools };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (!this.toolRegistry) {
        throw new Error('Tool registry not initialized');
      }

      const { name, arguments: args } = request.params;
      console.log(`🔧 Calling tool: ${name}`);

      try {
        const tool = this.toolRegistry.getTool(name);
        if (!tool) {
          throw new Error(`Tool ${name} not found`);
        }

        const result = await tool.handler(args || {});
        console.log(`✅ Tool ${name} completed successfully`);
        
        return {
          content: result.content,
          isError: result.isError || false
        };
      } catch (error: any) {
        console.error(`❌ Tool ${name} failed:`, error);
        
        return {
          content: [{
            type: 'text' as const,
            text: `Error executing ${name}: ${error.message}`
          }],
          isError: true
        };
      }
    });
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.log('🌟 SiYuan MCP Server started and ready for connections');
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    if (this.server) {
      await this.server.close();
      console.log('🛑 SiYuan MCP Server stopped');
    }
  }

  /**
   * Get server statistics
   */
  getStatistics(): any {
    if (!this.toolRegistry) {
      return { initialized: false };
    }

    return {
      initialized: this.isInitialized,
      server: {
        name: 'siyuan-mcp-server',
        version: '1.0.0'
      },
      tools: this.toolRegistry.getStatistics()
    };
  }

  /**
   * Get tool by name
   */
  getTool(name: string) {
    return this.toolRegistry?.getTool(name);
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string) {
    return this.toolRegistry?.getToolsByCategory(category) || [];
  }
}

/**
 * Factory function to create and start MCP server
 */
export async function createSiYuanMCPServer(): Promise<SiYuanMCPServer> {
  const server = new SiYuanMCPServer();
  await server.initialize();
  return server;
}

/**
 * Start MCP server in standalone mode
 */
export async function startMCPServer(): Promise<void> {
  try {
    const server = await createSiYuanMCPServer();
    await server.start();
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Export for plugin integration
export { SiYuanMCPServer as default }; 