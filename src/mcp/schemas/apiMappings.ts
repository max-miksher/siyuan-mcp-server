/**
 * SiYuan API Mappings for MCP Tool Schema System
 * Complete mapping of all 42 SiYuan APIs to MCP tools
 * Based on src/api.ts analysis and MCP TypeScript SDK documentation
 */

import { z } from 'zod';
import { APIMapping } from './categoryDefinitions';

/**
 * All 42 SiYuan APIs organized by category with MCP-compatible schemas
 * Using Zod for validation as per MCP SDK documentation
 */
export const SIYUAN_API_MAPPINGS: Record<string, APIMapping> = {
  
  // ===========================================
  // NOTEBOOK MANAGEMENT CATEGORY (8 APIs)
  // ===========================================
  
  notebook_create_new: {
    apiPath: '/api/notebook/createNotebook',
    method: 'POST',
    description: 'Create a new notebook in SiYuan workspace',
    inputSchema: z.object({
      name: z.string().min(1).max(255).describe('Notebook name')
    }),
    requiresAuth: true,
    category: 'notebook',
    tags: ['create', 'notebook', 'workspace']
  },

  notebook_remove_existing: {
    apiPath: '/api/notebook/removeNotebook',
    method: 'POST', 
    description: 'Remove an existing notebook from workspace',
    inputSchema: z.object({
      notebook: z.string().describe('Notebook ID to remove')
    }),
    requiresAuth: true,
    category: 'notebook',
    tags: ['delete', 'notebook', 'workspace']
  },

  notebook_list_all: {
    apiPath: '/api/notebook/lsNotebooks',
    method: 'POST',
    description: 'List all notebooks in the workspace',
    inputSchema: z.object({}),
    requiresAuth: true,
    category: 'notebook',
    tags: ['list', 'notebook', 'workspace']
  },

  notebook_open_existing: {
    apiPath: '/api/notebook/openNotebook',
    method: 'POST',
    description: 'Open a closed notebook',
    inputSchema: z.object({
      notebook: z.string().describe('Notebook ID to open')
    }),
    requiresAuth: true,
    category: 'notebook', 
    tags: ['open', 'notebook', 'workspace']
  },

  notebook_close_existing: {
    apiPath: '/api/notebook/closeNotebook',
    method: 'POST',
    description: 'Close an opened notebook',
    inputSchema: z.object({
      notebook: z.string().describe('Notebook ID to close')
    }),
    requiresAuth: true,
    category: 'notebook',
    tags: ['close', 'notebook', 'workspace']
  },

  notebook_rename_existing: {
    apiPath: '/api/notebook/renameNotebook',
    method: 'POST',
    description: 'Rename an existing notebook',
    inputSchema: z.object({
      notebook: z.string().describe('Notebook ID to rename'),
      name: z.string().min(1).max(255).describe('New notebook name')
    }),
    requiresAuth: true,
    category: 'notebook',
    tags: ['rename', 'notebook', 'update']
  },

  notebook_get_config: {
    apiPath: '/api/notebook/getNotebookConf',
    method: 'POST',
    description: 'Get notebook configuration settings',
    inputSchema: z.object({
      notebook: z.string().describe('Notebook ID')
    }),
    requiresAuth: true,
    category: 'notebook',
    tags: ['config', 'notebook', 'settings']
  },

  notebook_set_config: {
    apiPath: '/api/notebook/setNotebookConf',
    method: 'POST',
    description: 'Set notebook configuration settings',
    inputSchema: z.object({
      notebook: z.string().describe('Notebook ID'),
      conf: z.record(z.any()).describe('Configuration object')
    }),
    requiresAuth: true,
    category: 'notebook',
    tags: ['config', 'notebook', 'settings', 'update']
  },

  // ===========================================
  // FILE TREE OPERATIONS CATEGORY (7 APIs)
  // ===========================================

  filetree_list_docs: {
    apiPath: '/api/filetree/listDocsByPath',
    method: 'POST',
    description: 'List documents in a specific path of the file tree',
    inputSchema: z.object({
      notebook: z.string().describe('Notebook ID'),
      path: z.string().describe('Path in the file tree')
    }),
    requiresAuth: true,
    category: 'filetree',
    tags: ['list', 'documents', 'path']
  },

  filetree_create_doc: {
    apiPath: '/api/filetree/createDocWithMd',
    method: 'POST',
    description: 'Create a new document with markdown content',
    inputSchema: z.object({
      notebook: z.string().describe('Notebook ID'),
      path: z.string().describe('Document path'),
      markdown: z.string().describe('Markdown content')
    }),
    requiresAuth: true,
    category: 'filetree',
    tags: ['create', 'document', 'markdown']
  },

  filetree_rename_doc: {
    apiPath: '/api/filetree/renameDoc',
    method: 'POST',
    description: 'Rename a document in the file tree',
    inputSchema: z.object({
      notebook: z.string().describe('Notebook ID'),
      path: z.string().describe('Current document path'),
      title: z.string().describe('New document title')
    }),
    requiresAuth: true,
    category: 'filetree',
    tags: ['rename', 'document', 'update']
  },

  filetree_remove_doc: {
    apiPath: '/api/filetree/removeDoc',
    method: 'POST',
    description: 'Remove a document from the file tree',
    inputSchema: z.object({
      notebook: z.string().describe('Notebook ID'),
      path: z.string().describe('Document path to remove')
    }),
    requiresAuth: true,
    category: 'filetree',
    tags: ['remove', 'document', 'delete']
  },

  filetree_move_doc: {
    apiPath: '/api/filetree/moveDoc',
    method: 'POST',
    description: 'Move a document to a different location',
    inputSchema: z.object({
      fromNotebook: z.string().describe('Source notebook ID'),
      fromPath: z.string().describe('Source document path'),
      toNotebook: z.string().describe('Target notebook ID'),
      toPath: z.string().describe('Target document path')
    }),
    requiresAuth: true,
    category: 'filetree',
    tags: ['move', 'document', 'relocate']
  },

  filetree_get_doc: {
    apiPath: '/api/filetree/getDoc',
    method: 'POST',
    description: 'Get document information and metadata',
    inputSchema: z.object({
      id: z.string().describe('Document block ID'),
      mode: z.number().default(0).describe('Get mode (0=default)')
    }),
    requiresAuth: true,
    category: 'filetree',
    tags: ['get', 'document', 'metadata']
  },

  filetree_search_docs: {
    apiPath: '/api/filetree/searchDocs',
    method: 'POST',
    description: 'Search for documents in the file tree',
    inputSchema: z.object({
      k: z.string().describe('Search keyword'),
      notebook: z.string().optional().describe('Notebook ID (optional)')
    }),
    requiresAuth: true,
    category: 'filetree',
    tags: ['search', 'document', 'find']
  },

  // ===========================================
  // BLOCK OPERATIONS CATEGORY (11 APIs)
  // ===========================================

  block_insert_new: {
    apiPath: '/api/block/insertBlock',
    method: 'POST',
    description: 'Insert a new block at specified position',
    inputSchema: z.object({
      dataType: z.string().describe('Block data type (markdown, etc.)'),
      data: z.string().describe('Block content'),
      parentID: z.string().describe('Parent block ID'),
      previousID: z.string().optional().describe('Previous sibling block ID')
    }),
    requiresAuth: true,
    category: 'block',
    tags: ['insert', 'block', 'content']
  },

  block_prepend_child: {
    apiPath: '/api/block/prependBlock',
    method: 'POST',
    description: 'Prepend a block as the first child',
    inputSchema: z.object({
      dataType: z.string().describe('Block data type'),
      data: z.string().describe('Block content'),
      parentID: z.string().describe('Parent block ID')
    }),
    requiresAuth: true,
    category: 'block',
    tags: ['prepend', 'block', 'child']
  },

  block_append_child: {
    apiPath: '/api/block/appendBlock',
    method: 'POST',
    description: 'Append a block as the last child',
    inputSchema: z.object({
      dataType: z.string().describe('Block data type'),
      data: z.string().describe('Block content'),
      parentID: z.string().describe('Parent block ID')
    }),
    requiresAuth: true,
    category: 'block',
    tags: ['append', 'block', 'child']
  },

  block_update_content: {
    apiPath: '/api/block/updateBlock',
    method: 'POST',
    description: 'Update block content',
    inputSchema: z.object({
      dataType: z.string().describe('Block data type'),
      data: z.string().describe('New block content'),
      id: z.string().describe('Block ID to update')
    }),
    requiresAuth: true,
    category: 'block',
    tags: ['update', 'block', 'content']
  },

  block_delete_existing: {
    apiPath: '/api/block/deleteBlock',
    method: 'POST',
    description: 'Delete an existing block',
    inputSchema: z.object({
      id: z.string().describe('Block ID to delete')
    }),
    requiresAuth: true,
    category: 'block',
    tags: ['delete', 'block', 'remove']
  },

  block_get_kramdown: {
    apiPath: '/api/block/getBlockKramdown',
    method: 'POST',
    description: 'Get block content in Kramdown format',
    inputSchema: z.object({
      id: z.string().describe('Block ID')
    }),
    requiresAuth: true,
    category: 'block',
    tags: ['get', 'block', 'kramdown', 'content']
  },

  block_get_breadcrumb: {
    apiPath: '/api/block/getBlockBreadcrumb',
    method: 'POST',
    description: 'Get block breadcrumb navigation path',
    inputSchema: z.object({
      id: z.string().describe('Block ID'),
      excludeTypes: z.array(z.string()).optional().describe('Block types to exclude')
    }),
    requiresAuth: true,
    category: 'block',
    tags: ['get', 'block', 'breadcrumb', 'navigation']
  },

  block_get_children: {
    apiPath: '/api/block/getChildBlocks',
    method: 'POST',
    description: 'Get child blocks of a parent block',
    inputSchema: z.object({
      id: z.string().describe('Parent block ID')
    }),
    requiresAuth: true,
    category: 'block',
    tags: ['get', 'block', 'children']
  },

  block_move_to_position: {
    apiPath: '/api/block/moveBlock',
    method: 'POST',
    description: 'Move block to a new position',
    inputSchema: z.object({
      id: z.string().describe('Block ID to move'),
      previousID: z.string().optional().describe('Previous sibling block ID'),
      parentID: z.string().describe('New parent block ID')
    }),
    requiresAuth: true,
    category: 'block',
    tags: ['move', 'block', 'position']
  },

  block_fold_toggle: {
    apiPath: '/api/block/foldBlock',
    method: 'POST',
    description: 'Toggle fold/unfold state of a block',
    inputSchema: z.object({
      id: z.string().describe('Block ID to fold/unfold')
    }),
    requiresAuth: true,
    category: 'block',
    tags: ['fold', 'block', 'toggle']
  },

  block_get_tree_stat: {
    apiPath: '/api/block/getBlockTreeStat',
    method: 'POST',
    description: 'Get statistics of block tree structure',
    inputSchema: z.object({
      id: z.string().describe('Root block ID')
    }),
    requiresAuth: true,
    category: 'block',
    tags: ['get', 'block', 'tree', 'statistics']
  },

  // ===========================================
  // ASSET MANAGEMENT CATEGORY (1 API)
  // ===========================================

  asset_upload_file: {
    apiPath: '/api/asset/upload',
    method: 'POST',
    description: 'Upload an asset file to SiYuan',
    inputSchema: z.object({
      assetsDirPath: z.string().describe('Assets directory path'),
      file: z.any().describe('File to upload (multipart/form-data)')
    }),
    requiresAuth: true,
    category: 'asset',
    tags: ['upload', 'asset', 'file', 'media']
  },

  // ===========================================
  // SEARCH & QUERY CATEGORY (2 APIs)
  // ===========================================

  search_fulltext_blocks: {
    apiPath: '/api/search/fullTextSearchBlock',
    method: 'POST',
    description: 'Perform full-text search across blocks',
    inputSchema: z.object({
      query: z.string().min(1).describe('Search query'),
      method: z.number().default(0).describe('Search method (0=keyword, 1=query syntax)'),
      types: z.record(z.boolean()).optional().describe('Block types to search'),
      paths: z.array(z.string()).optional().describe('Paths to search'),
      groupBy: z.number().default(0).describe('Group results by (0=block, 1=doc)'),
      orderBy: z.number().default(0).describe('Order by (0=relevance, 1=type, etc.)'),
      page: z.number().default(1).describe('Page number'),
      pageSize: z.number().default(32).describe('Results per page')
    }),
    requiresAuth: true,
    rateLimit: 30,
    category: 'search',
    tags: ['search', 'fulltext', 'blocks', 'query']
  },

  search_sql_query: {
    apiPath: '/api/query/sql',
    method: 'POST',
    description: 'Execute SQL query on SiYuan database',
    inputSchema: z.object({
      stmt: z.string().min(1).describe('SQL statement to execute')
    }),
    requiresAuth: true,
    rateLimit: 30,
    category: 'search',
    tags: ['search', 'sql', 'query', 'database']
  },

  // ===========================================
  // FILE SYSTEM CATEGORY (4 APIs)
  // ===========================================

  fs_list_files: {
    apiPath: '/api/file/readDir',
    method: 'POST',
    description: 'List files and directories in a path',
    inputSchema: z.object({
      path: z.string().describe('Directory path to list')
    }),
    requiresAuth: true,
    rateLimit: 50,
    category: 'filesystem',
    tags: ['list', 'files', 'directory', 'fs']
  },

  fs_get_file: {
    apiPath: '/api/file/getFile',
    method: 'POST',
    description: 'Get file content',
    inputSchema: z.object({
      path: z.string().describe('File path to read')
    }),
    requiresAuth: true,
    rateLimit: 50,
    category: 'filesystem',
    tags: ['get', 'file', 'content', 'read']
  },

  fs_put_file: {
    apiPath: '/api/file/putFile',
    method: 'POST',
    description: 'Write content to a file',
    inputSchema: z.object({
      path: z.string().describe('File path to write'),
      file: z.any().describe('File content (multipart/form-data)')
    }),
    requiresAuth: true,
    rateLimit: 50,
    category: 'filesystem',
    tags: ['put', 'file', 'write', 'content']
  },

  fs_remove_file: {
    apiPath: '/api/file/removeFile',
    method: 'POST',
    description: 'Remove a file or directory',
    inputSchema: z.object({
      path: z.string().describe('File or directory path to remove')
    }),
    requiresAuth: true,
    rateLimit: 50,
    category: 'filesystem',
    tags: ['remove', 'file', 'delete', 'fs']
  },

  // ===========================================
  // EXPORT & TRANSFORM CATEGORY (4 APIs)
  // ===========================================

  export_markdown_content: {
    apiPath: '/api/export/exportMdContent',
    method: 'POST',
    description: 'Export content as Markdown',
    inputSchema: z.object({
      id: z.string().describe('Block or document ID to export')
    }),
    requiresAuth: true,
    category: 'export',
    tags: ['export', 'markdown', 'content']
  },

  export_html_content: {
    apiPath: '/api/export/exportHtml',
    method: 'POST',
    description: 'Export content as HTML',
    inputSchema: z.object({
      id: z.string().describe('Block or document ID to export'),
      pdf: z.boolean().default(false).describe('Export as PDF')
    }),
    requiresAuth: true,
    category: 'export',
    tags: ['export', 'html', 'content']
  },

  export_docx_content: {
    apiPath: '/api/export/exportDocx',
    method: 'POST',
    description: 'Export content as Word document',
    inputSchema: z.object({
      id: z.string().describe('Block or document ID to export')
    }),
    requiresAuth: true,
    category: 'export',
    tags: ['export', 'docx', 'word', 'content']
  },

  export_pdf_content: {
    apiPath: '/api/export/exportPDF',
    method: 'POST',
    description: 'Export content as PDF',
    inputSchema: z.object({
      id: z.string().describe('Block or document ID to export'),
      removeAssets: z.boolean().default(false).describe('Remove assets from export')
    }),
    requiresAuth: true,
    category: 'export',
    tags: ['export', 'pdf', 'content']
  },

  // ===========================================
  // SYSTEM & UTILITY CATEGORY (5 APIs)
  // ===========================================

  system_get_conf: {
    apiPath: '/api/system/getConf',
    method: 'POST',
    description: 'Get system configuration',
    inputSchema: z.object({}),
    requiresAuth: true,
    category: 'system',
    tags: ['system', 'config', 'get']
  },

  system_set_conf: {
    apiPath: '/api/system/setConf',
    method: 'POST',
    description: 'Set system configuration',
    inputSchema: z.object({
      conf: z.record(z.any()).describe('Configuration object to set')
    }),
    requiresAuth: true,
    category: 'system',
    tags: ['system', 'config', 'set', 'update']
  },

  system_get_changelog: {
    apiPath: '/api/system/getChangelog',
    method: 'POST',
    description: 'Get system changelog',
    inputSchema: z.object({}),
    requiresAuth: true,
    category: 'system',
    tags: ['system', 'changelog', 'history']
  },

  system_version_info: {
    apiPath: '/api/system/version',
    method: 'POST',
    description: 'Get system version information',
    inputSchema: z.object({}),
    requiresAuth: true,
    category: 'system',
    tags: ['system', 'version', 'info']
  },

  system_currenttime_info: {
    apiPath: '/api/system/currentTime',
    method: 'POST',
    description: 'Get current system time',
    inputSchema: z.object({}),
    requiresAuth: true,
    category: 'system',
    tags: ['system', 'time', 'current']
  }
};

/**
 * Quick lookup for API count by category
 */
export const API_COUNT_BY_CATEGORY = {
  notebook: 8,
  filetree: 7,
  block: 11,
  asset: 1,
  search: 2,
  filesystem: 4,
  export: 4,
  system: 5
};

/**
 * Total API count validation
 */
export const TOTAL_API_COUNT = Object.keys(SIYUAN_API_MAPPINGS).length;
console.assert(TOTAL_API_COUNT === 42, `Expected 42 APIs, found ${TOTAL_API_COUNT}`);

/**
 * Get APIs by category
 */
export function getAPIsByCategory(category: string): APIMapping[] {
  return Object.values(SIYUAN_API_MAPPINGS).filter(api => api.category === category);
}

/**
 * Get API mapping by tool name
 */
export function getAPIMapping(toolName: string): APIMapping | undefined {
  return SIYUAN_API_MAPPINGS[toolName];
}

/**
 * Validate API mapping structure
 */
export function validateAPIMapping(mapping: APIMapping): boolean {
  try {
    // Validate required fields
    if (!mapping.apiPath || !mapping.method || !mapping.description || !mapping.category) {
      return false;
    }
    
    // Validate Zod schema if provided
    if (mapping.inputSchema && typeof mapping.inputSchema.parse === 'function') {
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('API mapping validation failed:', error);
    return false;
  }
} 