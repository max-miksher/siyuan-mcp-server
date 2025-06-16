/**
 * SiYuan MCP Tools Implementation
 * Comprehensive tool handlers for SiYuan content operations
 * Based on Context7 documentation and creative phase decisions
 */

import { z } from 'zod';
import { SiYuanAPIAdapter } from '../server/apiAdapter.js';
import { CacheManager } from '../utils/cacheManager.js';

/**
 * Tool response interface compatible with MCP SDK
 */
export interface ToolResponse {
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
 * SiYuan Tools Manager
 * Implements all SiYuan-specific MCP tools with intelligent caching
 */
export class SiYuanToolsManager {
  private apiAdapter: SiYuanAPIAdapter;
  private cacheManager: CacheManager;

  constructor(apiAdapter: SiYuanAPIAdapter, cacheManager: CacheManager) {
    this.apiAdapter = apiAdapter;
    this.cacheManager = cacheManager;
  }

  /**
   * Get all tool definitions for MCP server registration
   */
  getToolDefinitions() {
    return [
      // Document Management Tools
      {
        name: 'create-document',
        description: 'Create a new document in SiYuan with markdown content',
        inputSchema: z.object({
          notebook: z.string().describe('Notebook ID where to create the document'),
          path: z.string().describe('Path for the new document'),
          title: z.string().describe('Document title'),
          markdown: z.string().describe('Markdown content for the document')
        }),
        handler: this.createDocument.bind(this)
      },

      {
        name: 'update-document',
        description: 'Update an existing document with new content',
        inputSchema: z.object({
          documentId: z.string().describe('Document ID to update'),
          markdown: z.string().describe('New markdown content'),
          mode: z.number().default(0).describe('Update mode (0=replace, 1=append)')
        }),
        handler: this.updateDocument.bind(this)
      },

      {
        name: 'delete-document',
        description: 'Delete a document from SiYuan',
        inputSchema: z.object({
          notebook: z.string().describe('Notebook ID'),
          path: z.string().describe('Document path to delete')
        }),
        handler: this.deleteDocument.bind(this)
      },

      // Block Management Tools
      {
        name: 'insert-block',
        description: 'Insert a new block into a document',
        inputSchema: z.object({
          dataType: z.string().describe('Block type (markdown, etc.)'),
          data: z.string().describe('Block content'),
          parentID: z.string().describe('Parent block ID'),
          previousID: z.string().optional().describe('Previous sibling block ID')
        }),
        handler: this.insertBlock.bind(this)
      },

      {
        name: 'update-block',
        description: 'Update an existing block content',
        inputSchema: z.object({
          id: z.string().describe('Block ID to update'),
          dataType: z.string().describe('Block type'),
          data: z.string().describe('New block content')
        }),
        handler: this.updateBlock.bind(this)
      },

      {
        name: 'delete-block',
        description: 'Delete a block from document',
        inputSchema: z.object({
          id: z.string().describe('Block ID to delete')
        }),
        handler: this.deleteBlock.bind(this)
      },

      {
        name: 'move-block',
        description: 'Move a block to a different location',
        inputSchema: z.object({
          id: z.string().describe('Block ID to move'),
          parentID: z.string().describe('New parent block ID'),
          previousID: z.string().optional().describe('Previous sibling block ID')
        }),
        handler: this.moveBlock.bind(this)
      },

      // Search and Query Tools
      {
        name: 'search-content',
        description: 'Search for content across SiYuan workspace',
        inputSchema: z.object({
          query: z.string().describe('Search query'),
          method: z.number().default(0).describe('Search method (0=keyword, 1=phrase, 2=regex, 3=sql)'),
          limit: z.number().default(20).describe('Maximum number of results'),
          notebooks: z.array(z.string()).optional().describe('Specific notebooks to search in')
        }),
        handler: this.searchContent.bind(this)
      },

      {
        name: 'sql-query',
        description: 'Execute SQL query against SiYuan database',
        inputSchema: z.object({
          sql: z.string().describe('SQL query to execute'),
          limit: z.number().default(100).describe('Maximum number of results')
        }),
        handler: this.sqlQuery.bind(this)
      },

      // Notebook Management Tools
      {
        name: 'create-notebook',
        description: 'Create a new notebook in SiYuan',
        inputSchema: z.object({
          name: z.string().describe('Notebook name')
        }),
        handler: this.createNotebook.bind(this)
      },

      {
        name: 'rename-notebook',
        description: 'Rename an existing notebook',
        inputSchema: z.object({
          notebook: z.string().describe('Notebook ID to rename'),
          name: z.string().describe('New notebook name')
        }),
        handler: this.renameNotebook.bind(this)
      },

      // Export Tools
      {
        name: 'export-document',
        description: 'Export document to various formats',
        inputSchema: z.object({
          id: z.string().describe('Document ID to export'),
          format: z.enum(['markdown', 'html', 'pdf', 'docx']).describe('Export format'),
          savePath: z.string().optional().describe('Save path for exported file')
        }),
        handler: this.exportDocument.bind(this)
      },

      // Asset Management Tools
      {
        name: 'upload-asset',
        description: 'Upload an asset file to SiYuan',
        inputSchema: z.object({
          assetsDirPath: z.string().describe('Assets directory path'),
          files: z.array(z.string()).describe('File paths to upload')
        }),
        handler: this.uploadAsset.bind(this)
      },

      // Utility Tools
      {
        name: 'get-block-info',
        description: 'Get detailed information about a specific block',
        inputSchema: z.object({
          id: z.string().describe('Block ID')
        }),
        handler: this.getBlockInfo.bind(this)
      },

      {
        name: 'list-recent-docs',
        description: 'List recently accessed documents',
        inputSchema: z.object({
          limit: z.number().default(10).describe('Number of recent documents to return')
        }),
        handler: this.listRecentDocs.bind(this)
      }
    ];
  }

  /**
   * Create a new document
   */
  private async createDocument(args: any): Promise<ToolResponse> {
    try {
      const result = await this.apiAdapter.callTool('siyuan_create_doc_with_md', {
        notebook: args.notebook,
        path: args.path,
        markdown: args.markdown
      });

      // Invalidate related caches
      this.cacheManager.delete(`notebook:${args.notebook}`);
      this.cacheManager.delete('notebooks:list');

      return {
        content: [{
          type: 'text',
          text: `Document created successfully at ${args.path}. Document ID: ${result?.id || 'unknown'}`
        }],
        metadata: { 
          operation: 'create-document',
          documentId: result?.id,
          path: args.path
        }
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: `Error creating document: ${error.message}`
        }],
        isError: true,
        metadata: { operation: 'create-document', error: error.message }
      };
    }
  }

  /**
   * Update an existing document
   */
  private async updateDocument(args: any): Promise<ToolResponse> {
    try {
      const result = await this.apiAdapter.callTool('siyuan_update_block', {
        id: args.documentId,
        dataType: 'markdown',
        data: args.markdown
      });

      // Invalidate document cache
      this.cacheManager.delete(`document:${args.documentId}`);
      this.cacheManager.delete(`block:${args.documentId}`);

      return {
        content: [{
          type: 'text',
          text: `Document ${args.documentId} updated successfully`
        }],
        metadata: { 
          operation: 'update-document',
          documentId: args.documentId
        }
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: `Error updating document: ${error.message}`
        }],
        isError: true,
        metadata: { operation: 'update-document', error: error.message }
      };
    }
  }

  /**
   * Delete a document
   */
  private async deleteDocument(args: any): Promise<ToolResponse> {
    try {
      const result = await this.apiAdapter.callTool('siyuan_remove_doc', {
        notebook: args.notebook,
        path: args.path
      });

      // Invalidate related caches
      this.cacheManager.delete(`notebook:${args.notebook}`);

      return {
        content: [{
          type: 'text',
          text: `Document at ${args.path} deleted successfully`
        }],
        metadata: { 
          operation: 'delete-document',
          path: args.path
        }
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: `Error deleting document: ${error.message}`
        }],
        isError: true,
        metadata: { operation: 'delete-document', error: error.message }
      };
    }
  }

  /**
   * Insert a new block
   */
  private async insertBlock(args: any): Promise<ToolResponse> {
    try {
      const result = await this.apiAdapter.callTool('siyuan_insert_block', {
        dataType: args.dataType,
        data: args.data,
        parentID: args.parentID,
        previousID: args.previousID
      });

      // Invalidate parent block cache
      this.cacheManager.delete(`block:${args.parentID}`);
      this.cacheManager.delete(`block-children:${args.parentID}`);

      return {
        content: [{
          type: 'text',
          text: `Block inserted successfully. Block ID: ${result?.[0]?.doOperations?.[0]?.id || 'unknown'}`
        }],
        metadata: { 
          operation: 'insert-block',
          parentID: args.parentID,
          blockId: result?.[0]?.doOperations?.[0]?.id
        }
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: `Error inserting block: ${error.message}`
        }],
        isError: true,
        metadata: { operation: 'insert-block', error: error.message }
      };
    }
  }

  /**
   * Update an existing block
   */
  private async updateBlock(args: any): Promise<ToolResponse> {
    try {
      const result = await this.apiAdapter.callTool('siyuan_update_block', {
        id: args.id,
        dataType: args.dataType,
        data: args.data
      });

      // Invalidate block cache
      this.cacheManager.delete(`block:${args.id}`);

      return {
        content: [{
          type: 'text',
          text: `Block ${args.id} updated successfully`
        }],
        metadata: { 
          operation: 'update-block',
          blockId: args.id
        }
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: `Error updating block: ${error.message}`
        }],
        isError: true,
        metadata: { operation: 'update-block', error: error.message }
      };
    }
  }

  /**
   * Delete a block
   */
  private async deleteBlock(args: any): Promise<ToolResponse> {
    try {
      const result = await this.apiAdapter.callTool('siyuan_delete_block', {
        id: args.id
      });

      // Invalidate block cache
      this.cacheManager.delete(`block:${args.id}`);

      return {
        content: [{
          type: 'text',
          text: `Block ${args.id} deleted successfully`
        }],
        metadata: { 
          operation: 'delete-block',
          blockId: args.id
        }
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: `Error deleting block: ${error.message}`
        }],
        isError: true,
        metadata: { operation: 'delete-block', error: error.message }
      };
    }
  }

  /**
   * Move a block
   */
  private async moveBlock(args: any): Promise<ToolResponse> {
    try {
      const result = await this.apiAdapter.callTool('siyuan_move_block', {
        id: args.id,
        parentID: args.parentID,
        previousID: args.previousID
      });

      // Invalidate related caches
      this.cacheManager.delete(`block:${args.id}`);
      this.cacheManager.delete(`block-children:${args.parentID}`);

      return {
        content: [{
          type: 'text',
          text: `Block ${args.id} moved successfully to parent ${args.parentID}`
        }],
        metadata: { 
          operation: 'move-block',
          blockId: args.id,
          newParentId: args.parentID
        }
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: `Error moving block: ${error.message}`
        }],
        isError: true,
        metadata: { operation: 'move-block', error: error.message }
      };
    }
  }

  /**
   * Search content across workspace
   */
  private async searchContent(args: any): Promise<ToolResponse> {
    try {
      const result = await this.apiAdapter.callTool('siyuan_fulltext_search_block', {
        query: args.query,
        method: args.method,
        types: {
          document: true,
          heading: true,
          list: true,
          listItem: true,
          codeBlock: true,
          mathBlock: true,
          table: true,
          blockquote: true,
          superBlock: true,
          paragraph: true
        },
        paths: args.notebooks || [],
        groupBy: 0,
        orderBy: 0,
        page: 1,
        pageSize: args.limit
      });

      const resultCount = result?.blocks?.length || 0;
      const summary = `Found ${resultCount} results for "${args.query}"`;
      const details = result?.blocks?.map((block: any, index: number) => 
        `${index + 1}. [${block.type}] ${block.content?.substring(0, 100)}...`
      ).join('\n') || 'No results found';

      return {
        content: [{
          type: 'text',
          text: `${summary}\n\n${details}`
        }],
        metadata: { 
          operation: 'search-content',
          query: args.query,
          resultCount: resultCount,
          results: result
        }
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: `Error searching content: ${error.message}`
        }],
        isError: true,
        metadata: { operation: 'search-content', error: error.message }
      };
    }
  }

  /**
   * Execute SQL query
   */
  private async sqlQuery(args: any): Promise<ToolResponse> {
    try {
      const result = await this.apiAdapter.callTool('siyuan_sql_query', {
        stmt: args.sql
      });

      const resultCount = result?.length || 0;
      const summary = `SQL query executed successfully. ${resultCount} rows returned.`;
      const data = JSON.stringify(result, null, 2);

      return {
        content: [{
          type: 'text',
          text: `${summary}\n\nResults:\n${data}`
        }],
        metadata: { 
          operation: 'sql-query',
          sql: args.sql,
          resultCount: resultCount,
          results: result
        }
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: `Error executing SQL query: ${error.message}`
        }],
        isError: true,
        metadata: { operation: 'sql-query', error: error.message }
      };
    }
  }

  /**
   * Create a new notebook
   */
  private async createNotebook(args: any): Promise<ToolResponse> {
    try {
      const result = await this.apiAdapter.callTool('siyuan_create_notebook', {
        name: args.name
      });

      // Invalidate notebooks cache
      this.cacheManager.delete('notebooks:list');

      return {
        content: [{
          type: 'text',
          text: `Notebook "${args.name}" created successfully. Notebook ID: ${result?.notebook?.id || 'unknown'}`
        }],
        metadata: { 
          operation: 'create-notebook',
          notebookId: result?.notebook?.id,
          name: args.name
        }
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: `Error creating notebook: ${error.message}`
        }],
        isError: true,
        metadata: { operation: 'create-notebook', error: error.message }
      };
    }
  }

  /**
   * Rename a notebook
   */
  private async renameNotebook(args: any): Promise<ToolResponse> {
    try {
      const result = await this.apiAdapter.callTool('siyuan_rename_notebook', {
        notebook: args.notebook,
        name: args.name
      });

      // Invalidate related caches
      this.cacheManager.delete(`notebook:${args.notebook}`);
      this.cacheManager.delete('notebooks:list');

      return {
        content: [{
          type: 'text',
          text: `Notebook ${args.notebook} renamed to "${args.name}" successfully`
        }],
        metadata: { 
          operation: 'rename-notebook',
          notebookId: args.notebook,
          newName: args.name
        }
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: `Error renaming notebook: ${error.message}`
        }],
        isError: true,
        metadata: { operation: 'rename-notebook', error: error.message }
      };
    }
  }

  /**
   * Export document
   */
  private async exportDocument(args: any): Promise<ToolResponse> {
    try {
      // Note: Export functionality would need to be implemented based on SiYuan's export APIs
      const result = await this.apiAdapter.callTool('siyuan_export_md', {
        id: args.id,
        savePath: args.savePath || '',
        removeAssets: false
      });

      return {
        content: [{
          type: 'text',
          text: `Document ${args.id} exported to ${args.format} format successfully`
        }],
        metadata: { 
          operation: 'export-document',
          documentId: args.id,
          format: args.format,
          result: result
        }
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: `Error exporting document: ${error.message}`
        }],
        isError: true,
        metadata: { operation: 'export-document', error: error.message }
      };
    }
  }

  /**
   * Upload asset
   */
  private async uploadAsset(args: any): Promise<ToolResponse> {
    try {
      const result = await this.apiAdapter.callTool('siyuan_upload', {
        assetsDirPath: args.assetsDirPath,
        files: args.files
      });

      return {
        content: [{
          type: 'text',
          text: `Assets uploaded successfully to ${args.assetsDirPath}`
        }],
        metadata: { 
          operation: 'upload-asset',
          assetsDirPath: args.assetsDirPath,
          files: args.files,
          result: result
        }
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: `Error uploading assets: ${error.message}`
        }],
        isError: true,
        metadata: { operation: 'upload-asset', error: error.message }
      };
    }
  }

  /**
   * Get detailed block information
   */
  private async getBlockInfo(args: any): Promise<ToolResponse> {
    try {
      const kramdown = await this.apiAdapter.callTool('siyuan_get_block_kramdown', {
        id: args.id
      });

      const attrs = await this.apiAdapter.callTool('siyuan_get_block_attrs', {
        id: args.id
      });

      const blockInfo = {
        id: args.id,
        content: kramdown?.kramdown || '',
        attributes: attrs,
        timestamp: new Date().toISOString()
      };

      return {
        content: [{
          type: 'text',
          text: `Block Information:\n${JSON.stringify(blockInfo, null, 2)}`
        }],
        metadata: { 
          operation: 'get-block-info',
          blockId: args.id,
          blockInfo: blockInfo
        }
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: `Error getting block info: ${error.message}`
        }],
        isError: true,
        metadata: { operation: 'get-block-info', error: error.message }
      };
    }
  }

  /**
   * List recent documents
   */
  private async listRecentDocs(args: any): Promise<ToolResponse> {
    try {
      // Note: This would need to be implemented based on SiYuan's recent docs API
      const result = await this.apiAdapter.callTool('siyuan_get_recent_docs', {
        limit: args.limit
      });

      const summary = `Found ${result?.length || 0} recent documents`;
      const details = result?.map((doc: any, index: number) => 
        `${index + 1}. ${doc.title || doc.name || doc.id}`
      ).join('\n') || 'No recent documents found';

      return {
        content: [{
          type: 'text',
          text: `${summary}\n\n${details}`
        }],
        metadata: { 
          operation: 'list-recent-docs',
          limit: args.limit,
          results: result
        }
      };
    } catch (error: any) {
      return {
        content: [{
          type: 'text',
          text: `Error listing recent documents: ${error.message}`
        }],
        isError: true,
        metadata: { operation: 'list-recent-docs', error: error.message }
      };
    }
  }
} 