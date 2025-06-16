/**
 * SiYuan MCP Resources Implementation
 * Comprehensive resource handlers for SiYuan content access
 * Based on Context7 documentation and creative phase decisions
 */

import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SiYuanAPIAdapter } from '../server/apiAdapter.js';
import { CacheManager } from '../utils/cacheManager.js';

/**
 * Resource response interface
 */
export interface ResourceResponse {
  contents: Array<{
    uri: string;
    text?: string;
    blob?: string;
    mimeType?: string;
  }>;
}

/**
 * SiYuan Resources Manager
 * Implements all SiYuan-specific MCP resources with caching
 */
export class SiYuanResourcesManager {
  private apiAdapter: SiYuanAPIAdapter;
  private cacheManager: CacheManager;

  constructor(apiAdapter: SiYuanAPIAdapter, cacheManager: CacheManager) {
    this.apiAdapter = apiAdapter;
    this.cacheManager = cacheManager;
  }

  /**
   * Get all resource definitions for MCP server registration
   */
  getResourceDefinitions() {
    return [
      // Notebook resources
      {
        name: 'notebook',
        template: new ResourceTemplate('siyuan://notebook/{notebookId}', { list: undefined }),
        handler: this.handleNotebookResource.bind(this)
      },
      {
        name: 'notebooks',
        template: 'siyuan://notebooks',
        handler: this.handleNotebooksListResource.bind(this)
      },

      // Document resources
      {
        name: 'document',
        template: new ResourceTemplate('siyuan://document/{documentId}', { list: undefined }),
        handler: this.handleDocumentResource.bind(this)
      },

      // Block resources
      {
        name: 'block',
        template: new ResourceTemplate('siyuan://block/{blockId}', { list: undefined }),
        handler: this.handleBlockResource.bind(this)
      },

      // Search resources
      {
        name: 'search',
        template: new ResourceTemplate('siyuan://search?query={query}&method={method?}&limit={limit?}', { list: undefined }),
        handler: this.handleSearchResource.bind(this)
      },

      // Workspace resources
      {
        name: 'workspace',
        template: 'siyuan://workspace',
        handler: this.handleWorkspaceResource.bind(this)
      }
    ];
  }

  /**
   * Handle notebook resource requests
   */
  private async handleNotebookResource(uri: URL, params: { notebookId: string }): Promise<ResourceResponse> {
    const cacheKey = `notebook:${params.notebookId}`;
    
    // Try cache first
    const cached = this.cacheManager.get<any>(cacheKey);
    if (cached) {
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(cached, null, 2),
          mimeType: 'application/json'
        }]
      };
    }

    try {
      // Get notebook configuration
      const notebookConf = await this.apiAdapter.callTool('siyuan_get_notebook_conf', {
        notebook: params.notebookId
      });

      const notebookData = {
        id: params.notebookId,
        config: notebookConf,
        metadata: {
          resourceType: 'notebook',
          timestamp: new Date().toISOString(),
          uri: uri.href
        }
      };

      // Cache for 5 minutes
      this.cacheManager.set(cacheKey, notebookData, 300000);

      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(notebookData, null, 2),
          mimeType: 'application/json'
        }]
      };
    } catch (error: any) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error accessing notebook ${params.notebookId}: ${error.message}`,
          mimeType: 'text/plain'
        }]
      };
    }
  }

  /**
   * Handle notebooks list resource
   */
  private async handleNotebooksListResource(uri: URL): Promise<ResourceResponse> {
    const cacheKey = 'notebooks:list';
    
    const cached = this.cacheManager.get<any>(cacheKey);
    if (cached) {
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(cached, null, 2),
          mimeType: 'application/json'
        }]
      };
    }

    try {
      const notebooks = await this.apiAdapter.callTool('siyuan_list_notebooks', {});
      
      const notebooksData = {
        notebooks: notebooks,
        count: notebooks?.notebooks?.length || 0,
        metadata: {
          resourceType: 'notebooks-list',
          timestamp: new Date().toISOString(),
          uri: uri.href
        }
      };

      // Cache for 2 minutes
      this.cacheManager.set(cacheKey, notebooksData, 120000);

      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(notebooksData, null, 2),
          mimeType: 'application/json'
        }]
      };
    } catch (error: any) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error listing notebooks: ${error.message}`,
          mimeType: 'text/plain'
        }]
      };
    }
  }

  /**
   * Handle document resource requests
   */
  private async handleDocumentResource(uri: URL, params: { documentId: string }): Promise<ResourceResponse> {
    const cacheKey = `document:${params.documentId}`;
    
    const cached = this.cacheManager.get<any>(cacheKey);
    if (cached) {
      return {
        contents: [{
          uri: uri.href,
          text: cached.content,
          mimeType: 'text/markdown'
        }]
      };
    }

    try {
      // Get document content as Kramdown
      const kramdown = await this.apiAdapter.callTool('siyuan_get_block_kramdown', {
        id: params.documentId
      });

      const documentData = {
        id: params.documentId,
        content: kramdown?.kramdown || '',
        metadata: {
          resourceType: 'document',
          timestamp: new Date().toISOString(),
          uri: uri.href
        }
      };

      // Cache for 1 minute (documents change frequently)
      this.cacheManager.set(cacheKey, documentData, 60000);

      return {
        contents: [{
          uri: uri.href,
          text: documentData.content,
          mimeType: 'text/markdown'
        }]
      };
    } catch (error: any) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error accessing document ${params.documentId}: ${error.message}`,
          mimeType: 'text/plain'
        }]
      };
    }
  }

  /**
   * Handle block resource requests
   */
  private async handleBlockResource(uri: URL, params: { blockId: string }): Promise<ResourceResponse> {
    const cacheKey = `block:${params.blockId}`;
    
    const cached = this.cacheManager.get<any>(cacheKey);
    if (cached) {
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(cached, null, 2),
          mimeType: 'application/json'
        }]
      };
    }

    try {
      // Get block content
      const kramdown = await this.apiAdapter.callTool('siyuan_get_block_kramdown', {
        id: params.blockId
      });

      const blockData = {
        id: params.blockId,
        content: kramdown?.kramdown || '',
        metadata: {
          resourceType: 'block',
          timestamp: new Date().toISOString(),
          uri: uri.href
        }
      };

      // Cache for 30 seconds (blocks change very frequently)
      this.cacheManager.set(cacheKey, blockData, 30000);

      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(blockData, null, 2),
          mimeType: 'application/json'
        }]
      };
    } catch (error: any) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error accessing block ${params.blockId}: ${error.message}`,
          mimeType: 'text/plain'
        }]
      };
    }
  }

  /**
   * Handle search resource requests
   */
  private async handleSearchResource(uri: URL, params: { query: string; method?: string; limit?: string }): Promise<ResourceResponse> {
    const method = parseInt(params.method || '0');
    const limit = parseInt(params.limit || '20');
    const cacheKey = `search:${params.query}:${method}:${limit}`;
    
    const cached = this.cacheManager.get<any>(cacheKey);
    if (cached) {
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(cached, null, 2),
          mimeType: 'application/json'
        }]
      };
    }

    try {
      const searchResults = await this.apiAdapter.callTool('siyuan_fulltext_search_block', {
        query: params.query,
        method: method,
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
        paths: [],
        groupBy: 0,
        orderBy: 0,
        page: 1,
        pageSize: limit
      });

      const searchData = {
        query: params.query,
        method: method,
        limit: limit,
        results: searchResults,
        metadata: {
          resourceType: 'search',
          timestamp: new Date().toISOString(),
          uri: uri.href
        }
      };

      // Cache search results for 30 seconds
      this.cacheManager.set(cacheKey, searchData, 30000);

      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(searchData, null, 2),
          mimeType: 'application/json'
        }]
      };
    } catch (error: any) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error searching for "${params.query}": ${error.message}`,
          mimeType: 'text/plain'
        }]
      };
    }
  }

  /**
   * Handle workspace resource
   */
  private async handleWorkspaceResource(uri: URL): Promise<ResourceResponse> {
    const cacheKey = 'workspace:info';
    
    const cached = this.cacheManager.get<any>(cacheKey);
    if (cached) {
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(cached, null, 2),
          mimeType: 'application/json'
        }]
      };
    }

    try {
      const conf = await this.apiAdapter.callTool('siyuan_get_conf', {});
      const notebooks = await this.apiAdapter.callTool('siyuan_list_notebooks', {});

      const workspaceData = {
        configuration: conf,
        notebooks: notebooks,
        metadata: {
          resourceType: 'workspace',
          timestamp: new Date().toISOString(),
          uri: uri.href
        }
      };

      // Cache for 5 minutes
      this.cacheManager.set(cacheKey, workspaceData, 300000);

      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(workspaceData, null, 2),
          mimeType: 'application/json'
        }]
      };
    } catch (error: any) {
      return {
        contents: [{
          uri: uri.href,
          text: `Error accessing workspace: ${error.message}`,
          mimeType: 'text/plain'
        }]
      };
    }
  }
} 