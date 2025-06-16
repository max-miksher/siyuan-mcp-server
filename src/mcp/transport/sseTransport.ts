/**
 * SSE Transport Layer for SiYuan MCP Server
 * Implements WebSocket-like bidirectional communication over Server-Sent Events
 * Based on Creative Phase 2 design decisions
 */

import { Request, Response } from 'express';
import { SSEConnection, SSEMessage } from '../types';

export class SSETransport {
  private connections = new Map<string, SSEConnectionState>();
  private messageHandlers = new Map<string, (message: SSEMessage) => Promise<any>>();

  /**
   * Handle new SSE connection
   */
  handleConnection(req: Request, res: Response): void {
    const connectionId = this.generateConnectionId();
    const clientAddress = req.ip || req.socket.remoteAddress || 'unknown';

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Create connection state
    const connection: SSEConnection = {
      id: connectionId,
      clientAddress,
      connectedAt: new Date(),
      lastActivity: new Date(),
      authenticated: false
    };

    const connectionState: SSEConnectionState = {
      connection,
      response: res,
      isAlive: true,
      pingInterval: null
    };

    this.connections.set(connectionId, connectionState);

    // Send connection confirmation
    this.sendMessage(connectionId, {
      id: this.generateMessageId(),
      type: 'notification',
      timestamp: Date.now(),
      data: {
        type: 'connection_established',
        connectionId,
        serverInfo: {
          name: 'SiYuan MCP Server',
          version: '0.1.0',
          capabilities: ['tools', 'resources', 'prompts']
        }
      }
    });

    // Set up periodic ping to keep connection alive
    connectionState.pingInterval = setInterval(() => {
      this.sendPing(connectionId);
    }, 30000); // 30 seconds

    // Handle client disconnect
    req.on('close', () => {
      this.closeConnection(connectionId);
    });

    req.on('error', (error) => {
      console.error(`SSE connection error for ${connectionId}:`, error);
      this.closeConnection(connectionId);
    });

    // Set up message parsing for POST data (for bidirectional communication)
    this.setupBidirectionalListener(connectionId, req);

    console.log(`SSE connection established: ${connectionId} from ${clientAddress}`);
  }

  /**
   * Send message to specific connection
   */
  sendMessage(connectionId: string, message: SSEMessage): boolean {
    const connectionState = this.connections.get(connectionId);
    if (!connectionState || !connectionState.isAlive) {
      return false;
    }

    try {
      const eventData = `data: ${JSON.stringify(message)}\n\n`;
      connectionState.response.write(eventData);
      connectionState.connection.lastActivity = new Date();
      return true;
    } catch (error) {
      console.error(`Failed to send message to ${connectionId}:`, error);
      this.closeConnection(connectionId);
      return false;
    }
  }

  /**
   * Broadcast message to all connections
   */
  broadcastMessage(message: SSEMessage): number {
    let sentCount = 0;
    for (const [connectionId] of this.connections) {
      if (this.sendMessage(connectionId, message)) {
        sentCount++;
      }
    }
    return sentCount;
  }

  /**
   * Close specific connection
   */
  closeConnection(connectionId: string): void {
    const connectionState = this.connections.get(connectionId);
    if (!connectionState) {
      return;
    }

    connectionState.isAlive = false;
    
    if (connectionState.pingInterval) {
      clearInterval(connectionState.pingInterval);
    }

    try {
      connectionState.response.end();
    } catch (error) {
      // Connection might already be closed
    }

    this.connections.delete(connectionId);
    console.log(`SSE connection closed: ${connectionId}`);
  }

  /**
   * Close all connections
   */
  async closeAllConnections(): Promise<void> {
    const connectionIds = Array.from(this.connections.keys());
    for (const connectionId of connectionIds) {
      this.closeConnection(connectionId);
    }
    console.log(`Closed ${connectionIds.length} SSE connections`);
  }

  /**
   * Get active connection count
   */
  getActiveConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Get all active connections
   */
  getActiveConnections(): SSEConnection[] {
    return Array.from(this.connections.values()).map(state => state.connection);
  }

  /**
   * Register message handler for specific message types
   */
  onMessage(messageType: string, handler: (message: SSEMessage) => Promise<any>): void {
    this.messageHandlers.set(messageType, handler);
  }

  /**
   * Process incoming MCP requests via SSE
   */
  async processIncomingMessage(connectionId: string, message: SSEMessage): Promise<void> {
    const connectionState = this.connections.get(connectionId);
    if (!connectionState) {
      return;
    }

    // Update last activity
    connectionState.connection.lastActivity = new Date();

    // Handle authentication messages
    if (message.type === 'request' && message.data?.method === 'auth') {
      await this.handleAuthentication(connectionId, message);
      return;
    }

    // Check if connection is authenticated for other requests
    if (!connectionState.connection.authenticated && message.type === 'request') {
      this.sendMessage(connectionId, {
        id: this.generateMessageId(),
        type: 'error',
        correlationId: message.id,
        timestamp: Date.now(),
        data: {
          code: -32001,
          message: 'Authentication required',
          data: 'Please authenticate before making requests'
        }
      });
      return;
    }

    // Route to appropriate handler
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      try {
        const result = await handler(message);
        
        // Send response if it's a request
        if (message.type === 'request') {
          this.sendMessage(connectionId, {
            id: this.generateMessageId(),
            type: 'response',
            correlationId: message.id,
            timestamp: Date.now(),
            data: result
          });
        }
      } catch (error) {
        console.error('Error processing SSE message:', error);
        
        if (message.type === 'request') {
          this.sendMessage(connectionId, {
            id: this.generateMessageId(),
            type: 'error',
            correlationId: message.id,
            timestamp: Date.now(),
            data: {
              code: -32603,
              message: 'Internal error',
              data: error.message
            }
          });
        }
      }
    }
  }

  /**
   * Send ping to keep connection alive
   */
  private sendPing(connectionId: string): void {
    this.sendMessage(connectionId, {
      id: this.generateMessageId(),
      type: 'notification',
      timestamp: Date.now(),
      data: {
        type: 'ping',
        timestamp: Date.now()
      }
    });
  }

  /**
   * Handle authentication for SSE connection
   */
  private async handleAuthentication(connectionId: string, message: SSEMessage): Promise<void> {
    const connectionState = this.connections.get(connectionId);
    if (!connectionState) {
      return;
    }

    // TODO: Implement actual authentication logic with SecurityManager
    // For now, just mark as authenticated
    connectionState.connection.authenticated = true;
    connectionState.connection.sessionToken = 'dummy-token-' + connectionId;

    this.sendMessage(connectionId, {
      id: this.generateMessageId(),
      type: 'response',
      correlationId: message.id,
      timestamp: Date.now(),
      data: {
        success: true,
        sessionToken: connectionState.connection.sessionToken
      }
    });

    console.log(`SSE connection authenticated: ${connectionId}`);
  }

  /**
   * Set up bidirectional communication listener
   */
  private setupBidirectionalListener(connectionId: string, req: Request): void {
    // This is a placeholder for setting up bidirectional communication
    // In a real implementation, you would set up a separate HTTP endpoint
    // for receiving messages from the client
    console.log(`Bidirectional listener setup for connection: ${connectionId}`);
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `sse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Internal connection state interface
 */
interface SSEConnectionState {
  connection: SSEConnection;
  response: Response;
  isAlive: boolean;
  pingInterval: NodeJS.Timeout | null;
} 