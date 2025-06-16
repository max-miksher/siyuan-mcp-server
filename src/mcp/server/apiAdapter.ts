/**
 * SiYuan API Adapter for MCP Server
 * Bridges SiYuan's 42 APIs to MCP tools and resources
 * Now uses the new ToolSchemaGenerator for comprehensive API coverage
 */

import axios, { AxiosInstance } from 'axios';
import { MCPTool, MCPResource, SiYuanAPIRequest, SiYuanAPIResponse } from '../types';
import { ToolSchemaGenerator, createToolSchemaGenerator, MCPToolDefinition } from '../schemas/toolSchemaGenerator';

export class SiYuanAPIAdapter {
  private plugin: any; // SiYuan Plugin instance
  private httpClient: AxiosInstance;
  private apiBaseUrl: string = 'http://127.0.0.1:6806';
  private toolSchemaGenerator: ToolSchemaGenerator;

  constructor(plugin: any) {
    this.plugin = plugin;
    this.httpClient = axios.create({
      baseURL: this.apiBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Initialize the new schema generator system
    this.toolSchemaGenerator = createToolSchemaGenerator(this);
  }

  /**
   * Initialize API adapter
   */
  async initialize(): Promise<void> {
    // Setup API token if available
    const apiToken = await this.getAPIToken();
    if (apiToken) {
      this.httpClient.defaults.headers.common['Authorization'] = `Token ${apiToken}`;
    }

    console.log('SiYuan API Adapter initialized');
  }

  /**
   * Get available MCP tools based on SiYuan APIs
   * Now uses the comprehensive ToolSchemaGenerator for all 42 APIs
   */
  async getAvailableTools(): Promise<MCPTool[]> {
    // Generate all tools using the new schema system
    const generatedTools = this.toolSchemaGenerator.generateAllTools();
    
    // Convert to legacy MCPTool format for backward compatibility
    return generatedTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));
  }

  /**
   * Get comprehensive tool information (new method)
   * Returns tools with full metadata and handlers
   */
  getComprehensiveTools(): MCPToolDefinition[] {
    return this.toolSchemaGenerator.generateAllTools();
  }

  /**
   * Get tool statistics and discovery information
   */
  getToolStatistics(): any {
    return this.toolSchemaGenerator.getStatistics();
  }

  /**
   * Get available MCP resources
   */
  async getAvailableResources(): Promise<MCPResource[]> {
    return [
      {
        uri: 'siyuan://notebooks',
        name: 'SiYuan Notebooks',
        description: 'List of all notebooks in SiYuan workspace',
        mimeType: 'application/json'
      },
      {
        uri: 'siyuan://workspace',
        name: 'Workspace Information',
        description: 'Current workspace details and statistics',
        mimeType: 'application/json'
      }
    ];
  }

  /**
   * Call specific SiYuan API tool
   */
  async callTool(toolName: string, args: any): Promise<any> {
    const apiCall = this.getAPICallForTool(toolName);
    if (!apiCall) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    try {
      const response = await this.makeAPICall(apiCall.method, apiCall.path, args);
      return response.data;
    } catch (error: any) {
      throw new Error(`API call failed: ${error.message}`);
    }
  }

  /**
   * Read MCP resource
   */
  async readResource(uri: string): Promise<any> {
    switch (uri) {
      case 'siyuan://notebooks':
        return await this.callTool('siyuan_list_notebooks', {});
      
      case 'siyuan://workspace':
        return await this.callTool('siyuan_get_conf', {});
      
      default:
        throw new Error(`Unknown resource URI: ${uri}`);
    }
  }

  /**
   * Get API call mapping for tool
   * Now uses the comprehensive schema mappings
   */
  private getAPICallForTool(toolName: string): { method: string; path: string } | null {
    // Use the new schema system to get API mapping
    const generatedTools = this.toolSchemaGenerator.generateAllTools();
    const tool = generatedTools.find(t => t.name === toolName);
    
    if (tool) {
      return {
        method: tool.metadata.method,
        path: tool.metadata.apiPath
      };
    }
    
    // Fallback to old mappings for backward compatibility
    const legacyMappings: Record<string, { method: string; path: string }> = {
      'siyuan_create_notebook': { method: 'POST', path: '/api/notebook/createNotebook' },
      'siyuan_list_notebooks': { method: 'POST', path: '/api/notebook/lsNotebooks' },
      'siyuan_get_notebook_conf': { method: 'POST', path: '/api/notebook/getNotebookConf' },
      'siyuan_get_block_kramdown': { method: 'POST', path: '/api/block/getBlockKramdown' },
      'siyuan_insert_block': { method: 'POST', path: '/api/block/insertBlock' },
      'siyuan_fulltext_search_block': { method: 'POST', path: '/api/search/fullTextSearchBlock' },
      'siyuan_sql_query': { method: 'POST', path: '/api/query/sql' }
    };

    return legacyMappings[toolName] || null;
  }

  /**
   * Make API call to SiYuan
   */
  private async makeAPICall(method: string, path: string, data?: any): Promise<SiYuanAPIResponse> {
    try {
      const response = await this.httpClient.request({
        method,
        url: path,
        data
      });

      return response.data;
    } catch (error: any) {
      console.error(`SiYuan API call failed: ${method} ${path}`, error);
      throw new Error(`SiYuan API error: ${error.message}`);
    }
  }

  /**
   * Get API token from plugin settings
   */
  private async getAPIToken(): Promise<string | null> {
    try {
      const pluginData = await this.plugin.loadData('settings.json');
      if (pluginData) {
        const settings = JSON.parse(pluginData);
        if (settings.apiToken) {
          return settings.apiToken;
        }
      }
      return null;
    } catch (error) {
      console.warn('Could not retrieve API token:', error);
      return null;
    }
  }
} 