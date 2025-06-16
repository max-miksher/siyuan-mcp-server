/**
 * Streamable HTTP Transport for SiYuan MCP Server
 * Modern MCP transport implementation with session management
 * Based on @modelcontextprotocol/sdk v1.12.3 best practices
 */

import express from 'express';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import cors from 'cors';

/**
 * Session management for Streamable HTTP transport
 */
interface SessionInfo {
  id: string;
  transport: StreamableHTTPServerTransport;
  server: McpServer;
  createdAt: Date;
  lastActivity: Date;
}

/**
 * Streamable HTTP Transport Manager
 * Handles session management, request routing, and server lifecycle
 */
export class StreamableHTTPTransportManager {
  private app: express.Application;
  private sessions: Map<string, SessionInfo> = new Map();
  private isRunning = false;
  private port: number;
  private server: any;

  constructor(port: number = 3000) {
    this.port = port;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupCleanup();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Enable CORS for cross-origin requests
    this.app.use(cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'mcp-session-id', 'Last-Event-ID']
    }));

    // Parse JSON bodies
    this.app.use(express.json({ limit: '10mb' }));

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Session: ${req.headers['mcp-session-id'] || 'none'}`);
      next();
    });
  }

  /**
   * Setup Express routes for MCP communication
   */
  private setupRoutes(): void {
    // Handle POST requests for client-to-server communication
    this.app.post('/mcp', async (req, res) => {
      await this.handleClientToServerRequest(req, res);
    });

    // Handle GET requests for server-to-client notifications via SSE
    this.app.get('/mcp', async (req, res) => {
      await this.handleServerToClientRequest(req, res);
    });

    // Handle DELETE requests for session termination
    this.app.delete('/mcp', async (req, res) => {
      await this.handleSessionTermination(req, res);
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        activeSessions: this.sessions.size,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    });

    // Session info endpoint
    this.app.get('/sessions', (req, res) => {
      const sessionList = Array.from(this.sessions.entries()).map(([id, info]) => ({
        id,
        createdAt: info.createdAt,
        lastActivity: info.lastActivity,
        age: Date.now() - info.createdAt.getTime()
      }));

      res.json({
        count: this.sessions.size,
        sessions: sessionList
      });
    });
  }

  /**
   * Handle client-to-server requests (POST /mcp)
   */
  private async handleClientToServerRequest(req: express.Request, res: express.Response): Promise<void> {
    try {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      let sessionInfo: SessionInfo;

      if (sessionId && this.sessions.has(sessionId)) {
        // Reuse existing session
        sessionInfo = this.sessions.get(sessionId)!;
        sessionInfo.lastActivity = new Date();
      } else if (!sessionId && isInitializeRequest(req.body)) {
        // Create new session for initialization request
        sessionInfo = await this.createNewSession();
      } else {
        // Invalid request
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: No valid session ID provided or not an initialization request',
          },
          id: null,
        });
        return;
      }

      // Handle the request through the transport
      await sessionInfo.transport.handleRequest(req, res, req.body);

    } catch (error) {
      console.error('Error handling client-to-server request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    }
  }

  /**
   * Handle server-to-client requests (GET /mcp)
   */
  private async handleServerToClientRequest(req: express.Request, res: express.Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    
    if (!sessionId || !this.sessions.has(sessionId)) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }

    const sessionInfo = this.sessions.get(sessionId)!;
    sessionInfo.lastActivity = new Date();

    try {
      await sessionInfo.transport.handleRequest(req, res);
    } catch (error) {
      console.error('Error handling server-to-client request:', error);
      if (!res.headersSent) {
        res.status(500).send('Internal server error');
      }
    }
  }

  /**
   * Handle session termination (DELETE /mcp)
   */
  private async handleSessionTermination(req: express.Request, res: express.Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    
    if (!sessionId || !this.sessions.has(sessionId)) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }

    try {
      await this.terminateSession(sessionId);
      res.status(200).send('Session terminated successfully');
    } catch (error) {
      console.error('Error terminating session:', error);
      res.status(500).send('Error terminating session');
    }
  }

  /**
   * Create a new MCP session
   */
  private async createNewSession(): Promise<SessionInfo> {
    const sessionId = randomUUID();
    
    // Create transport with session management
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => sessionId,
      onsessioninitialized: (id) => {
        console.log(`✅ Session ${id} initialized successfully`);
      }
    });

    // Create MCP server instance for this session
    const server = new McpServer({
      name: 'siyuan-mcp-server',
      version: '1.0.0',
      description: 'SiYuan Plugin MCP Server with Enhanced Features'
    });

    // Setup server capabilities and handlers
    await this.setupServerCapabilities(server);

    // Clean up transport when closed
    transport.onclose = () => {
      console.log(`🔌 Transport closed for session ${sessionId}`);
      this.sessions.delete(sessionId);
    };

    // Connect server to transport
    await server.connect(transport);

    const sessionInfo: SessionInfo = {
      id: sessionId,
      transport,
      server,
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.sessions.set(sessionId, sessionInfo);
    console.log(`🆕 Created new session: ${sessionId}`);

    return sessionInfo;
  }

  /**
   * Setup MCP server capabilities and handlers
   */
  private async setupServerCapabilities(server: McpServer): Promise<void> {
    // Import and setup SiYuan-specific tools, resources, and prompts
    // This will be implemented in the next phase
    
    // For now, setup basic capabilities
    server.tool('ping', {}, async () => ({
      content: [{ type: 'text', text: 'pong' }]
    }));

    server.resource(
      'server-info',
      'siyuan://server/info',
      async () => ({
        contents: [{
          uri: 'siyuan://server/info',
          text: JSON.stringify({
            name: 'SiYuan MCP Server',
            version: '1.0.0',
            capabilities: ['tools', 'resources', 'prompts'],
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      })
    );
  }

  /**
   * Terminate a session
   */
  private async terminateSession(sessionId: string): Promise<void> {
    const sessionInfo = this.sessions.get(sessionId);
    if (!sessionInfo) {
      throw new Error(`Session ${sessionId} not found`);
    }

    try {
      // Close server connection
      await sessionInfo.server.close();
      
      // Close transport
      sessionInfo.transport.close();
      
      // Remove from sessions map
      this.sessions.delete(sessionId);
      
      console.log(`🗑️ Session ${sessionId} terminated successfully`);
    } catch (error) {
      console.error(`Error terminating session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Setup periodic cleanup of inactive sessions
   */
  private setupCleanup(): void {
    // Clean up inactive sessions every 5 minutes
    setInterval(() => {
      const now = Date.now();
      const maxAge = 30 * 60 * 1000; // 30 minutes

      for (const [sessionId, sessionInfo] of this.sessions.entries()) {
        const age = now - sessionInfo.lastActivity.getTime();
        if (age > maxAge) {
          console.log(`🧹 Cleaning up inactive session: ${sessionId} (age: ${Math.round(age / 1000)}s)`);
          this.terminateSession(sessionId).catch(error => {
            console.error(`Error cleaning up session ${sessionId}:`, error);
          });
        }
      }
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  /**
   * Start the HTTP server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Streamable HTTP Transport already running');
      return;
    }

    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        this.isRunning = true;
        console.log(`🚀 Streamable HTTP Transport listening on port ${this.port}`);
        console.log(`📡 MCP endpoints available at:`);
        console.log(`   POST   http://localhost:${this.port}/mcp`);
        console.log(`   GET    http://localhost:${this.port}/mcp`);
        console.log(`   DELETE http://localhost:${this.port}/mcp`);
        console.log(`   GET    http://localhost:${this.port}/health`);
        console.log(`   GET    http://localhost:${this.port}/sessions`);
        resolve();
      });

      this.server.on('error', (error: any) => {
        console.error('Failed to start Streamable HTTP Transport:', error);
        reject(error);
      });
    });
  }

  /**
   * Stop the HTTP server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    // Terminate all active sessions
    const sessionIds = Array.from(this.sessions.keys());
    for (const sessionId of sessionIds) {
      try {
        await this.terminateSession(sessionId);
      } catch (error) {
        console.error(`Error terminating session ${sessionId} during shutdown:`, error);
      }
    }

    // Close HTTP server
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.isRunning = false;
          console.log('🛑 Streamable HTTP Transport stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get transport statistics
   */
  getStatistics() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      activeSessions: this.sessions.size,
      sessions: Array.from(this.sessions.entries()).map(([id, info]) => ({
        id,
        createdAt: info.createdAt,
        lastActivity: info.lastActivity,
        age: Date.now() - info.createdAt.getTime()
      }))
    };
  }
}

/**
 * Factory function to create and start Streamable HTTP transport
 */
export async function createStreamableHTTPTransport(port: number = 3000): Promise<StreamableHTTPTransportManager> {
  const transport = new StreamableHTTPTransportManager(port);
  await transport.start();
  return transport;
} 