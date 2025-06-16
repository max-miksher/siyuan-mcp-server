/**
 * Category Definitions for SiYuan MCP Tool Schema System
 * Implements Hybrid Category + Smart Features approach from creative phase
 * 
 * 8 Main Categories based on SiYuan API analysis:
 * - Notebook Management (8 APIs)
 * - File Tree Operations (7 APIs) 
 * - Block Operations (11 APIs)
 * - Asset Management (1 API)
 * - Search & Query (2 APIs)
 * - File System (4 APIs)
 * - Export & Transform (4 APIs)
 * - System & Utility (5 APIs)
 */

export interface ToolCategory {
  id: string;
  name: string;
  description: string;
  prefix: string; // For tool naming convention
  color: string; // UI categorization
  priority: number; // Discovery order
  capabilities: string[]; // Smart features
}

export interface APIMapping {
  apiPath: string;
  method: string;
  description: string;
  inputSchema: any;
  outputSchema?: any;
  requiresAuth: boolean;
  rateLimit?: number;
  category: string;
  tags: string[];
}

/**
 * 8 Core Categories for SiYuan API organization
 */
export const TOOL_CATEGORIES: Record<string, ToolCategory> = {
  notebook: {
    id: 'notebook',
    name: 'Notebook Management',
    description: 'Create, manage, and configure notebooks in SiYuan workspace',
    prefix: 'notebook',
    color: '#4a90e2',
    priority: 1,
    capabilities: ['create', 'read', 'update', 'delete', 'configure']
  },
  
  filetree: {
    id: 'filetree',
    name: 'File Tree Operations', 
    description: 'Navigate and manipulate the hierarchical file structure',
    prefix: 'filetree',
    color: '#7ed321',
    priority: 2,
    capabilities: ['navigate', 'create', 'move', 'rename', 'delete']
  },
  
  block: {
    id: 'block',
    name: 'Block Operations',
    description: 'Create, edit, and manipulate content blocks (paragraphs, headings, etc.)',
    prefix: 'block',
    color: '#f5a623',
    priority: 3,
    capabilities: ['create', 'read', 'update', 'delete', 'move', 'format']
  },
  
  asset: {
    id: 'asset',
    name: 'Asset Management',
    description: 'Upload, manage, and organize media assets and attachments',
    prefix: 'asset',
    color: '#bd10e0',
    priority: 4,
    capabilities: ['upload', 'organize', 'reference']
  },
  
  search: {
    id: 'search',
    name: 'Search & Query',
    description: 'Full-text search and SQL queries across workspace content',
    prefix: 'search',
    color: '#9013fe',
    priority: 5,
    capabilities: ['fulltext', 'sql', 'filter', 'sort']
  },
  
  filesystem: {
    id: 'filesystem',
    name: 'File System',
    description: 'Direct file system operations for advanced use cases',
    prefix: 'fs',
    color: '#50e3c2',
    priority: 6,
    capabilities: ['read', 'write', 'list', 'remove']
  },
  
  export: {
    id: 'export',
    name: 'Export & Transform',
    description: 'Export content to various formats and transform data',
    prefix: 'export',
    color: '#b8e986',
    priority: 7,
    capabilities: ['markdown', 'html', 'pdf', 'transform']
  },
  
  system: {
    id: 'system',
    name: 'System & Utility',
    description: 'System configuration, utilities, and workspace management',
    prefix: 'system',
    color: '#8b572a',
    priority: 8,
    capabilities: ['configure', 'monitor', 'utility', 'admin']
  }
};

/**
 * Tool naming convention: {category}_{action}_{object}
 * Examples:
 * - notebook_create_new
 * - block_insert_markdown
 * - search_fulltext_blocks
 * - system_get_config
 */
export const NAMING_PATTERNS = {
  // Common action verbs for consistent naming
  actions: {
    create: ['create', 'new', 'add'],
    read: ['get', 'read', 'fetch', 'list'],
    update: ['update', 'modify', 'set', 'change'],
    delete: ['delete', 'remove', 'clear'],
    search: ['search', 'find', 'query'],
    export: ['export', 'convert', 'transform'],
    upload: ['upload', 'import', 'load'],
    move: ['move', 'relocate', 'transfer']
  },
  
  // Common object types
  objects: {
    notebook: ['notebook', 'book'],
    document: ['document', 'doc', 'file'],
    block: ['block', 'content', 'element'],
    asset: ['asset', 'media', 'attachment'],
    config: ['config', 'setting', 'conf'],
    data: ['data', 'info', 'details']
  }
};

/**
 * Smart validation rules by category
 */
export const VALIDATION_RULES = {
  notebook: {
    name: { minLength: 1, maxLength: 255, pattern: /^[^\\/:"*?<>|]+$/ },
    id: { pattern: /^[0-9]{14}$/ } // SiYuan ID format
  },
  
  block: {
    id: { pattern: /^[0-9]{14}$/ },
    type: { enum: ['NodeDocument', 'NodeHeading', 'NodeParagraph', 'NodeCodeBlock', 'NodeMathBlock', 'NodeTable', 'NodeList', 'NodeListItem'] },
    content: { maxLength: 100000 }
  },
  
  search: {
    query: { minLength: 1, maxLength: 1000 },
    method: { enum: [0, 1, 2, 3] }, // SiYuan search methods
    limit: { min: 1, max: 500 }
  },
  
  filesystem: {
    path: { pattern: /^[^<>:"|?*\x00-\x1f]+$/ },
    filename: { pattern: /^[^\\/:*?"<>|]+$/ }
  }
};

/**
 * Error code mappings for unified responses
 */
export const ERROR_CODES = {
  // SiYuan API error codes -> MCP error codes
  SIYUAN_TO_MCP: {
    '-1': -32603, // Internal error
    '404': -32602, // Invalid params (not found)
    '403': -32001, // Server error (forbidden)
    '401': -32001, // Server error (unauthorized)
    '500': -32603  // Internal error
  },
  
  // Custom MCP error codes for schema validation
  VALIDATION: {
    INVALID_CATEGORY: -32100,
    INVALID_TOOL_NAME: -32101,
    INVALID_PARAMETERS: -32102,
    MISSING_REQUIRED: -32103,
    RATE_LIMIT_EXCEEDED: -32104
  }
};

/**
 * Response formatting templates by category
 */
export const RESPONSE_TEMPLATES = {
  notebook: {
    success: (data: any) => ({
      type: 'text',
      text: `Notebook operation completed successfully. Result: ${JSON.stringify(data, null, 2)}`
    }),
    list: (notebooks: any[]) => ({
      type: 'text', 
      text: `Found ${notebooks.length} notebooks:\n${notebooks.map(nb => `- ${nb.name} (${nb.id})`).join('\n')}`
    })
  },
  
  block: {
    success: (data: any) => ({
      type: 'text',
      text: `Block operation completed. Block ID: ${data.id || 'N/A'}`
    }),
    content: (content: string) => ({
      type: 'text',
      text: `Block content:\n${content}`
    })
  },
  
  search: {
    results: (results: any[], query: string) => ({
      type: 'text',
      text: `Search results for "${query}":\n${results.length} matches found\n${results.slice(0, 5).map(r => `- ${r.content?.substring(0, 100)}...`).join('\n')}`
    })
  },
  
  error: (message: string, code?: number) => ({
    type: 'text',
    text: `Error: ${message}`,
    isError: true,
    metadata: { errorCode: code }
  })
};

/**
 * Auto-documentation metadata
 */
export const DOCUMENTATION_METADATA = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  totalCategories: Object.keys(TOOL_CATEGORIES).length,
  supportedAPIs: 42,
  namingConvention: '{category}_{action}_{object}',
  authenticationRequired: true,
  rateLimits: {
    default: 100, // requests per minute
    search: 30,   // search operations
    filesystem: 50 // file operations
  }
}; 