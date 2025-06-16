/**
 * MCP Tool Schema Generator for SiYuan Plugin
 * Implements Hybrid Category + Smart Features approach from creative phase
 */

import { z } from 'zod';
import { 
  TOOL_CATEGORIES, 
  VALIDATION_RULES, 
  ERROR_CODES, 
  RESPONSE_TEMPLATES,
  DOCUMENTATION_METADATA,
  ToolCategory,
  APIMapping 
} from './categoryDefinitions';
import { 
  SIYUAN_API_MAPPINGS, 
  getAPIsByCategory, 
  getAPIMapping,
  TOTAL_API_COUNT 
} from './apiMappings';

/**
 * MCP Tool interface based on SDK documentation
 */
export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<any>;
  handler: (args: any) => Promise<any>;
  category: string;
  tags: string[];
  metadata: {
    version: string;
    rateLimit?: number;
    requiresAuth: boolean;
    apiPath: string;
    method: string;
  };
}

/**
 * Tool response format compatible with MCP SDK
 */
export interface MCPToolResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    uri?: string;
  }>;
  isError?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Main Tool Schema Generator Class
 */
export class ToolSchemaGenerator {
  private categoryMap: Map<string, ToolCategory>;
  private apiMappings: Map<string, APIMapping>;
  private toolCache: Map<string, MCPToolDefinition>;
  private apiAdapter: any;

  constructor(apiAdapter: any) {
    this.categoryMap = new Map(Object.entries(TOOL_CATEGORIES));
    this.apiMappings = new Map(Object.entries(SIYUAN_API_MAPPINGS));
    this.toolCache = new Map();
    this.apiAdapter = apiAdapter;
    
    console.log(`ToolSchemaGenerator initialized with ${TOTAL_API_COUNT} APIs`);
  }

  /**
   * Generate all MCP tools from SiYuan APIs
   */
  generateAllTools(): MCPToolDefinition[] {
    const tools: MCPToolDefinition[] = [];
    
    for (const [categoryId, category] of this.categoryMap) {
      const categoryAPIs = getAPIsByCategory(categoryId);
      
      for (const api of categoryAPIs) {
        const toolName = this.findToolNameForAPI(api.apiPath);
        if (toolName) {
          const tool = this.generateToolDefinition(toolName, api);
          if (tool) {
            tools.push(tool);
            this.toolCache.set(toolName, tool);
          }
        }
      }
    }
    
    console.log(`Generated ${tools.length} MCP tools`);
    return tools;
  }

  /**
   * Generate individual tool definition
   */
  private generateToolDefinition(toolName: string, api: APIMapping): MCPToolDefinition | null {
    try {
      const category = this.categoryMap.get(api.category);
      if (!category) return null;

      return {
        name: toolName,
        description: `[${category.name}] ${api.description}`,
        inputSchema: api.inputSchema,
        handler: this.createToolHandler(toolName, api),
        category: api.category,
        tags: api.tags,
        metadata: {
          version: DOCUMENTATION_METADATA.version,
          rateLimit: api.rateLimit,
          requiresAuth: api.requiresAuth,
          apiPath: api.apiPath,
          method: api.method
        }
      };
    } catch (error) {
      console.error(`Failed to generate tool ${toolName}:`, error);
      return null;
    }
  }

  /**
   * Create tool handler that calls SiYuan API
   */
  private createToolHandler(toolName: string, api: APIMapping) {
    return async (args: any): Promise<MCPToolResponse> => {
      try {
        const validatedArgs = api.inputSchema.parse(args);
        const result = await this.apiAdapter.callTool(toolName, validatedArgs);
        return this.formatSuccessResponse(result, api.category, toolName);
      } catch (error: any) {
        return this.formatErrorResponse(error, api.category);
      }
    };
  }

  /**
   * Format successful response
   */
  private formatSuccessResponse(data: any, categoryId: string, toolName: string): MCPToolResponse {
    return {
      content: [{
        type: 'text',
        text: `${toolName} completed successfully. Result: ${JSON.stringify(data, null, 2)}`
      }]
    };
  }

  /**
   * Format error response
   */
  private formatErrorResponse(error: any, categoryId: string): MCPToolResponse {
    const errorCode = error.code && ERROR_CODES.SIYUAN_TO_MCP[error.code] || -32603;
    const message = error.message || 'Unknown error occurred';

    return {
      content: [{
        type: 'text' as const,
        text: `Error: ${message}`
      }],
      isError: true,
      metadata: { errorCode, category: categoryId }
    };
  }

  /**
   * Find tool name for API path
   */
  private findToolNameForAPI(apiPath: string): string | null {
    for (const [toolName, mapping] of this.apiMappings) {
      if (mapping.apiPath === apiPath) {
        return toolName;
      }
    }
    return null;
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(categoryId: string): MCPToolDefinition[] {
    const tools: MCPToolDefinition[] = [];
    for (const [toolName, tool] of this.toolCache) {
      if (tool.category === categoryId) {
        tools.push(tool);
      }
    }
    return tools;
  }

  /**
   * Get statistics
   */
  getStatistics(): any {
    const stats = {
      totalTools: this.toolCache.size,
      totalAPIs: TOTAL_API_COUNT,
      coverage: (this.toolCache.size / TOTAL_API_COUNT) * 100,
      categories: {} as Record<string, number>
    };

    for (const [_, tool] of this.toolCache) {
      stats.categories[tool.category] = (stats.categories[tool.category] || 0) + 1;
    }

    return stats;
  }
}

/**
 * Factory function
 */
export function createToolSchemaGenerator(apiAdapter: any): ToolSchemaGenerator {
  return new ToolSchemaGenerator(apiAdapter);
}
 