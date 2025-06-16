/**
 * Core Type Definitions for SiYuan MCP Server Plugin
 * Based on Creative Phase decisions and SiYuan API analysis
 */

// ===== PLUGIN SETTINGS TYPES =====

export interface MCPPluginSettings {
  /** MCP Server port configuration */
  port: number;
  /** Legacy port field for backward compatibility */
  serverPort?: number;
  /** SiYuan API token for authentication */
  apiToken: string;
  /** Whether MCP server is enabled */
  enabled: boolean;
  /** Whether caching is enabled */
  enableCaching: boolean;
  /** SSE endpoint path */
  sseEndpoint: string;
  /** CORS origin whitelist for remote access */
  allowedOrigins: string[];
  /** Rate limiting configuration */
  rateLimiting: {
    enabled: boolean;
    requestsPerMinute: number;
  };
  /** Security settings */
  security: {
    requireAuth: boolean;
    sessionTimeout: number; // in minutes
  };
  autoStart: boolean;
  debugMode: boolean;
}

// ===== MCP SERVER STATE TYPES =====

export interface MCPServerState {
  /** Server running status */
  status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
  /** Server port */
  port: number;
  /** Active connections count */
  activeConnections: number;
  /** Error information if status is 'error' */
  error?: string;
  /** Server start time */
  startTime?: Date;
  /** Server statistics */
  stats: {
    totalRequests: number;
    totalErrors: number;
    uptime: number;
  };
}

// ===== SSE TRANSPORT TYPES =====

export interface SSEConnection {
  id: string;
  clientAddress: string;
  connectedAt: Date;
  lastActivity: Date;
  authenticated: boolean;
  sessionToken?: string;
}

export interface SSEMessage {
  id: string;
  type: 'request' | 'response' | 'notification' | 'error';
  correlationId?: string;
  timestamp: number;
  data: any;
}

// ===== SIYUAN API TYPES =====

export interface SiYuanAPIRequest {
  method: string;
  path: string;
  data?: any;
  headers?: Record<string, string>;
}

export interface SiYuanAPIResponse {
  code: number;
  msg: string;
  data?: any;
}

// ===== SECURITY TYPES =====

export interface AuthSession {
  sessionId: string;
  clientId: string;
  createdAt: Date;
  expiresAt: Date;
  isValid: boolean;
}

export interface SecurityAuditLog {
  timestamp: Date;
  event: 'auth_success' | 'auth_failure' | 'api_call' | 'error';
  clientId: string;
  details: string;
  endpoint?: string;
}

// ===== MCP PROTOCOL TYPES =====

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPRequest {
  method: string;
  params?: any;
}

export interface MCPResponse {
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// ===== PLUGIN LIFECYCLE TYPES =====

export interface PluginLifecycleEvents {
  onLoad: () => Promise<void>;
  onUnload: () => Promise<void>;
  onSettingsChanged: (newSettings: MCPPluginSettings) => Promise<void>;
  onServerStatusChanged: (newStatus: MCPServerState) => void;
}

// ===== UI COMPONENT TYPES =====

export interface SettingsUIProps {
  settings: MCPPluginSettings;
  serverState: MCPServerState;
  onSettingsChange: (settings: MCPPluginSettings) => void;
  onServerControl: (action: 'start' | 'stop' | 'restart') => void;
}

export interface StatusIndicatorProps {
  serverState: MCPServerState;
  compact?: boolean;
}

// ===== UTILITY TYPES =====

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  component: string;
  message: string;
  data?: any;
}

export interface PluginConfig {
  version: string;
  mcpSDKVersion: string;
  supportedSiYuanVersion: string;
  defaultSettings: MCPPluginSettings;
}

// ===== DEFAULT VALUES =====

export const DEFAULT_SETTINGS: MCPPluginSettings = {
  port: 3000,
  serverPort: 3000, // Legacy compatibility
  apiToken: '',
  enabled: false,
  enableCaching: true,
  sseEndpoint: '/sse',
  allowedOrigins: ['*'],
  rateLimiting: {
    enabled: true,
    requestsPerMinute: 60
  },
  security: {
    requireAuth: true,
    sessionTimeout: 60
  },
  autoStart: true,
  debugMode: false
};

export const INITIAL_SERVER_STATE: MCPServerState = {
  status: 'stopped',
  port: 0,
  activeConnections: 0,
  stats: {
    totalRequests: 0,
    totalErrors: 0,
    uptime: 0
  }
}; 