/**
 * Security Manager for SiYuan MCP Server
 * Implements multi-layer security architecture from Creative Phase 3
 * JWT + API Token Hybrid security with audit trail
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { MCPPluginSettings, AuthSession, SecurityAuditLog } from '../types';

export class SecurityManager {
  private settings: MCPPluginSettings;
  private activeSessions = new Map<string, AuthSession>();
  private auditLogs: SecurityAuditLog[] = [];
  private rateLimitStore = new Map<string, RateLimitEntry>();
  private jwtSecret: string;

  constructor(settings: MCPPluginSettings) {
    this.settings = settings;
    this.jwtSecret = this.generateJWTSecret();
  }

  /**
   * Initialize security manager
   */
  async initialize(): Promise<void> {
    // Clean up expired sessions
    this.setupSessionCleanup();
    
    // Set up rate limiting cleanup
    this.setupRateLimitCleanup();
    
    console.log('Security Manager initialized');
  }

  /**
   * Update security settings
   */
  updateSettings(newSettings: MCPPluginSettings): void {
    this.settings = newSettings;
    console.log('Security settings updated');
  }

  /**
   * Validate incoming request (Express middleware)
   */
  validateRequest = (req: Request, res: Response, next: NextFunction): void => {
    const clientId = this.getClientIdentifier(req);
    
    try {
      // Layer 1: Rate limiting
      if (!this.checkRateLimit(clientId)) {
        this.logSecurityEvent('auth_failure', clientId, `Rate limit exceeded for ${req.path}`);
        res.status(429).json({
          error: {
            code: -32000,
            message: 'Rate limit exceeded',
            data: 'Too many requests'
          }
        });
        return;
      }

      // Layer 2: Authentication (skip for health check and public endpoints)
      if (this.requiresAuthentication(req.path)) {
        const authResult = this.authenticateRequest(req);
        if (!authResult.success) {
          this.logSecurityEvent('auth_failure', clientId, authResult.error || 'Authentication failed');
          res.status(401).json({
            error: {
              code: -32001,
              message: 'Authentication required',
              data: authResult.error
            }
          });
          return;
        }

        // Add authentication info to request
        (req as any).auth = authResult.session;
      }

      // Layer 3: Authorization (endpoint-specific)
      if (!this.authorizeRequest(req)) {
        this.logSecurityEvent('auth_failure', clientId, `Unauthorized access to ${req.path}`);
        res.status(403).json({
          error: {
            code: -32002,
            message: 'Insufficient permissions',
            data: 'Access denied'
          }
        });
        return;
      }

      // Log successful API call
      this.logSecurityEvent('api_call', clientId, `${req.method} ${req.path}`, req.path);

      next();
    } catch (error: any) {
      this.logSecurityEvent('error', clientId, `Security validation error: ${error.message}`);
      res.status(500).json({
        error: {
          code: -32603,
          message: 'Internal security error'
        }
      });
    }
  };

  /**
   * Check rate limiting for client
   */
  private checkRateLimit(clientId: string): boolean {
    if (!this.settings.rateLimiting.enabled) {
      return true;
    }

    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const limit = this.settings.rateLimiting.requestsPerMinute;

    let entry = this.rateLimitStore.get(clientId);
    if (!entry) {
      entry = { count: 0, resetTime: now + windowMs };
      this.rateLimitStore.set(clientId, entry);
    }

    // Reset counter if window has expired
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + windowMs;
    }

    entry.count++;
    return entry.count <= limit;
  }

  /**
   * Authenticate request using Bearer token
   */
  private authenticateRequest(req: Request): { success: boolean; session?: AuthSession; error?: string } {
    if (!this.settings.security.requireAuth) {
      return { success: true };
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.substring(7);
    const validation = this.validateSessionToken(token);
    
    if (!validation.valid) {
      return { success: false, error: 'Invalid or expired session token' };
    }

    return { success: true, session: validation.session };
  }

  /**
   * Validate session token
   */
  validateSessionToken(token: string): { valid: boolean; session?: AuthSession } {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      const session = this.activeSessions.get(decoded.sessionId);
      
      if (!session || !session.isValid || new Date() > session.expiresAt) {
        return { valid: false };
      }

      return { valid: true, session };
    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Check if endpoint requires authentication
   */
  private requiresAuthentication(path: string): boolean {
    const publicEndpoints = ['/health', '/api/docs'];
    return !publicEndpoints.includes(path);
  }

  /**
   * Authorize request based on session and endpoint
   */
  private authorizeRequest(req: Request): boolean {
    // For now, all authenticated requests are authorized
    // This can be extended for more granular permissions
    return true;
  }

  /**
   * Get client identifier from request
   */
  private getClientIdentifier(req: Request): string {
    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  /**
   * Log security event
   */
  private logSecurityEvent(
    event: SecurityAuditLog['event'], 
    clientId: string, 
    details: string, 
    endpoint?: string
  ): void {
    const logEntry: SecurityAuditLog = {
      timestamp: new Date(),
      event,
      clientId,
      details,
      endpoint
    };

    this.auditLogs.push(logEntry);

    // Keep only last 1000 log entries
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }

    console.log(`Security [${event}] ${clientId}: ${details}`);
  }

  /**
   * Generate JWT secret
   */
  private generateJWTSecret(): string {
    return `siyuan_mcp_${Date.now()}_${Math.random().toString(36).substr(2, 32)}`;
  }

  /**
   * Setup periodic session cleanup
   */
  private setupSessionCleanup(): void {
    setInterval(() => {
      const now = new Date();
      for (const [sessionId, session] of this.activeSessions) {
        if (!session.isValid || now > session.expiresAt) {
          this.activeSessions.delete(sessionId);
        }
      }
    }, 5 * 60 * 1000); // Clean up every 5 minutes
  }

  /**
   * Setup periodic rate limit cleanup
   */
  private setupRateLimitCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [clientId, entry] of this.rateLimitStore) {
        if (now > entry.resetTime) {
          this.rateLimitStore.delete(clientId);
        }
      }
    }, 5 * 60 * 1000); // Clean up every 5 minutes
  }
}

/**
 * Rate limiting entry interface
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
} 