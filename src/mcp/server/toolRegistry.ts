/**
 * MCP Tool Registry for SiYuan Plugin
 * Registers all 42 SiYuan APIs as MCP tools using the schema system
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { ToolSchemaGenerator, MCPToolDefinition } from '../schemas/toolSchemaGenerator.js';
import { SIYUAN_API_MAPPINGS, getAPIsByCategory } from '../schemas/apiMappings.js';
import { TOOL_CATEGORIES } from '../schemas/categoryDefinitions.js';
import * as SiYuanAPI from '../../api.js';
// Additional API functions will be integrated directly

/**
 * Enhanced API adapter that bridges schema system with existing SiYuan API
 */
export class SiYuanAPIAdapter {
  private apiMap: Map<string, Function>;

  constructor() {
    this.apiMap = new Map();
    this.initializeAPIMap();
  }

  /**
   * Initialize mapping between tool names and SiYuan API functions
   */
  private initializeAPIMap() {
    // Notebook APIs
    this.apiMap.set('notebook_create_new', SiYuanAPI.createNotebook);
    this.apiMap.set('notebook_list_all', SiYuanAPI.lsNotebooks);
    this.apiMap.set('notebook_open_existing', SiYuanAPI.openNotebook);
    this.apiMap.set('notebook_close_existing', SiYuanAPI.closeNotebook);
    this.apiMap.set('notebook_remove_existing', SiYuanAPI.removeNotebook);
    this.apiMap.set('notebook_rename_existing', SiYuanAPI.renameNotebook);
    this.apiMap.set('notebook_get_config', SiYuanAPI.getNotebookConf);
    this.apiMap.set('notebook_set_config', SiYuanAPI.setNotebookConf);

    // File Tree APIs
    this.apiMap.set('filetree_create_doc', SiYuanAPI.createDocWithMd);
    this.apiMap.set('filetree_rename_doc', SiYuanAPI.renameDoc);
    this.apiMap.set('filetree_remove_doc', SiYuanAPI.removeDoc);
    this.apiMap.set('filetree_move_doc', SiYuanAPI.moveDocs);
    this.apiMap.set('filetree_get_hpath_by_path', SiYuanAPI.getHPathByPath);
    this.apiMap.set('filetree_get_hpath_by_id', SiYuanAPI.getHPathByID);
    this.apiMap.set('filetree_get_ids_by_hpath', SiYuanAPI.getIDsByHPath);

    // Block APIs
    this.apiMap.set('block_insert_blocks', SiYuanAPI.insertBlock);
    this.apiMap.set('block_prepend_blocks', SiYuanAPI.prependBlock);
    this.apiMap.set('block_append_blocks', SiYuanAPI.appendBlock);
    this.apiMap.set('block_update_block', SiYuanAPI.updateBlock);
    this.apiMap.set('block_delete_block', SiYuanAPI.deleteBlock);
    this.apiMap.set('block_move_block', SiYuanAPI.moveBlock);
    this.apiMap.set('block_get_block_kramdown', SiYuanAPI.getBlockKramdown);
    this.apiMap.set('block_get_child_blocks', SiYuanAPI.getChildBlocks);
    this.apiMap.set('block_transfer_block_ref', SiYuanAPI.transferBlockRef);
    this.apiMap.set('block_set_block_attrs', SiYuanAPI.setBlockAttrs);
    this.apiMap.set('block_get_block_attrs', SiYuanAPI.getBlockAttrs);

    // Asset APIs
    this.apiMap.set('asset_upload', SiYuanAPI.upload);

    // Search APIs
    this.apiMap.set('search_sql', SiYuanAPI.sql);
    this.apiMap.set('search_get_block_by_id', SiYuanAPI.getBlockByID);

    // Filesystem APIs
    this.apiMap.set('fs_get_file', SiYuanAPI.getFile);
    this.apiMap.set('fs_put_file', SiYuanAPI.putFile);
    this.apiMap.set('fs_remove_file', SiYuanAPI.removeFile);
    this.apiMap.set('fs_list', SiYuanAPI.readDir);

    // Export APIs
    this.apiMap.set('export_markdown_content', SiYuanAPI.exportMdContent);
    this.apiMap.set('export_resources', SiYuanAPI.exportResources);
    this.apiMap.set('export_pandoc', SiYuanAPI.pandoc);
    this.apiMap.set('export_render_template', SiYuanAPI.render);

    // System APIs
    this.apiMap.set('system_version_info', SiYuanAPI.version);
    this.apiMap.set('system_currenttime_info', SiYuanAPI.currentTime);
    this.apiMap.set('system_boot_progress', SiYuanAPI.bootProgress);
    this.apiMap.set('system_forward_proxy', SiYuanAPI.forwardProxy);
    this.apiMap.set('system_push_msg', SiYuanAPI.pushMsg);
    this.apiMap.set('system_push_err_msg', SiYuanAPI.pushErrMsg);

    console.log(`SiYuanAPIAdapter initialized with ${this.apiMap.size} API mappings`);
  }

  /**
   * Call a SiYuan API tool with validated arguments
   */
  async callTool(toolName: string, args: any): Promise<any> {
    const apiFunction = this.apiMap.get(toolName);
    if (!apiFunction) {
      throw new Error(`Tool ${toolName} not found in API adapter`);
    }

    try {
      // Call the SiYuan API function with spread arguments
      const result = await this.callAPIFunction(apiFunction, args, toolName);
      return result;
    } catch (error: any) {
      console.error(`Error calling ${toolName}:`, error);
      throw new Error(`API call failed: ${error.message}`);
    }
  }

  /**
   * Call API function with proper argument mapping
   */
  private async callAPIFunction(apiFunction: Function, args: any, toolName: string): Promise<any> {
    // Handle different argument patterns based on tool name
    switch (toolName) {
      // Notebook APIs
      case 'notebook_create_new':
        return await apiFunction(args.name);
      case 'notebook_list_all':
        return await apiFunction();
      case 'notebook_open_existing':
      case 'notebook_close_existing':
      case 'notebook_remove_existing':
        return await apiFunction(args.notebook);
      case 'notebook_rename_existing':
        return await apiFunction(args.notebook, args.name);
      case 'notebook_get_config':
        return await apiFunction(args.notebook);
      case 'notebook_set_config':
        return await apiFunction(args.notebook, args.conf);

      // File Tree APIs
      case 'filetree_create_doc':
        return await apiFunction(args.notebook, args.path, args.markdown);
      case 'filetree_rename_doc':
        return await apiFunction(args.notebook, args.path, args.title);
      case 'filetree_remove_doc':
        return await apiFunction(args.notebook, args.path);
      case 'filetree_move_doc':
        return await apiFunction(args.fromPaths, args.toNotebook, args.toPath);
      case 'filetree_get_hpath_by_path':
        return await apiFunction(args.notebook, args.path);
      case 'filetree_get_hpath_by_id':
        return await apiFunction(args.id);
      case 'filetree_get_ids_by_hpath':
        return await apiFunction(args.notebook, args.path);

      // Block APIs
      case 'block_insert_blocks':
        return await apiFunction(args.dataType, args.data, args.nextID, args.previousID, args.parentID);
      case 'block_prepend_blocks':
      case 'block_append_blocks':
        return await apiFunction(args.dataType, args.data, args.parentID);
      case 'block_update_block':
        return await apiFunction(args.dataType, args.data, args.id);
      case 'block_delete_block':
        return await apiFunction(args.id);
      case 'block_move_block':
        return await apiFunction(args.id, args.previousID, args.parentID);

      // Asset APIs
      case 'asset_upload':
        return await apiFunction(args.assetsDirPath, args.files);

      // Search APIs
      case 'search_sql':
        return await apiFunction(args.sql);
      case 'search_get_block_by_id':
        return await apiFunction(args.blockId);

      // Filesystem APIs
      case 'fs_get_file':
        return await apiFunction(args.path);
      case 'fs_put_file':
        return await apiFunction(args.path, args.isDir, args.file);
      case 'fs_remove_file':
        return await apiFunction(args.path);
      case 'fs_list':
        return await apiFunction(args.path);

      // Export APIs
      case 'export_markdown_content':
        return await apiFunction(args.id);
      case 'export_resources':
        return await apiFunction(args.paths, args.name);
      case 'export_render_template':
        return await apiFunction(args.id, args.path);

      // System APIs
      case 'system_version_info':
      case 'system_currenttime_info':
      case 'system_boot_progress':
        return await apiFunction();
      case 'system_forward_proxy':
        return await apiFunction(args.url, args.method, args.payload, args.headers, args.timeout, args.contentType);
      case 'system_push_msg':
      case 'system_push_err_msg':
        return await apiFunction(args.msg, args.timeout);

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}

/**
 * MCP Tool Registry - registers all SiYuan APIs as MCP tools
 */
export class MCPToolRegistry {
  private server: Server;
  private toolGenerator: ToolSchemaGenerator;
  private apiAdapter: SiYuanAPIAdapter;
  private registeredTools: Map<string, MCPToolDefinition>;

  constructor(server: Server) {
    this.server = server;
    this.apiAdapter = new SiYuanAPIAdapter();
    this.toolGenerator = new ToolSchemaGenerator(this.apiAdapter);
    this.registeredTools = new Map();
  }

  /**
   * Register all 42 SiYuan APIs as MCP tools
   */
  async registerAllTools(): Promise<void> {
    console.log('Starting MCP tool registration...');

    // Generate all tool definitions from schema system
    const tools = this.toolGenerator.generateAllTools();
    
    // Register each tool with the MCP server
    for (const tool of tools) {
      await this.registerTool(tool);
    }

    console.log(`Successfully registered ${this.registeredTools.size} MCP tools`);
    this.logRegistrationSummary();
  }

  /**
   * Register individual tool with MCP server
   */
  private async registerTool(tool: MCPToolDefinition): Promise<void> {
    try {
      // Register tool with MCP server
      this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
        if (request.params.name === tool.name) {
          const result = await tool.handler(request.params.arguments || {});
          return result;
        }
      });

      this.registeredTools.set(tool.name, tool);
      console.log(`✅ Registered tool: ${tool.name} [${tool.category}]`);
    } catch (error) {
      console.error(`❌ Failed to register tool ${tool.name}:`, error);
    }
  }

  /**
   * Get tool by name
   */
  getTool(name: string): MCPToolDefinition | undefined {
    return this.registeredTools.get(name);
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string): MCPToolDefinition[] {
    return Array.from(this.registeredTools.values()).filter(tool => tool.category === category);
  }

  /**
   * Get registration statistics
   */
  getStatistics(): any {
    const stats = {
      totalTools: this.registeredTools.size,
      byCategory: {} as Record<string, number>
    };

    for (const tool of this.registeredTools.values()) {
      stats.byCategory[tool.category] = (stats.byCategory[tool.category] || 0) + 1;
    }

    return stats;
  }

  /**
   * List all registered tools (for testing compatibility)
   */
  listTools(): MCPToolDefinition[] {
    return Array.from(this.registeredTools.values());
  }

  /**
   * Execute a tool by name (for testing compatibility)
   */
  async executeTool(toolName: string, args: any): Promise<any> {
    const tool = this.registeredTools.get(toolName);
    if (!tool) {
      return {
        isError: true,
        content: [{ type: "text", text: `Unknown tool: ${toolName}` }]
      };
    }

    try {
      const result = await tool.handler(args);
      return result;
    } catch (error: any) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error executing ${toolName}: ${error.message}` }]
      };
    }
  }

  /**
   * Log registration summary
   */
  private logRegistrationSummary(): void {
    const stats = this.getStatistics();
    console.log('\n📊 MCP Tool Registration Summary:');
    console.log(`Total Tools: ${stats.totalTools}`);
    console.log('By Category:');
    
    for (const [category, count] of Object.entries(stats.byCategory)) {
      const categoryInfo = TOOL_CATEGORIES[category];
      console.log(`  ${categoryInfo?.name || category}: ${count} tools`);
    }
  }
}

/**
 * Factory function to create and initialize tool registry
 */
export async function createMCPToolRegistry(server: Server): Promise<MCPToolRegistry> {
  const registry = new MCPToolRegistry(server);
  await registry.registerAllTools();
  return registry;
}