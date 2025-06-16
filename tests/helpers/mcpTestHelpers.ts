/**
 * MCP Test Helpers - Following Context7 Documented Patterns
 * Provides utilities for testing SiYuan MCP Server implementation
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SiYuanMCPServer } from '../../src/mcp/server/mcpServer.js';
import { spawn, ChildProcess } from 'child_process';
import { z } from 'zod';

/**
 * Test Server Factory - Context7 Pattern
 * Creates isolated test server instance following SDK examples
 */
export async function createTestServer(): Promise<SiYuanMCPServer> {
  const server = new SiYuanMCPServer();
  await server.initialize();
  return server;
}

/**
 * Test Client Factory - Context7 Pattern  
 * Creates test client with stdio transport following documented patterns
 */
export async function createTestClient(serverProcess?: ChildProcess): Promise<Client> {
  const client = new Client({
    name: "siyuan-test-client",
    version: "1.0.0"
  });

  // Use stdio transport as per Context7 examples
  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/server.js"]
  });

  await client.connect(transport);
  return client;
}

/**
 * Server Process Management - Context7 Pattern
 * Spawns actual server process for integration testing
 */
export function startTestServerProcess(): Promise<ChildProcess> {
  return new Promise((resolve, reject) => {
    const serverProcess = spawn('npx', ['tsx', 'src/mcp/server/mcpServer.ts'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    serverProcess.on('error', reject);
    
    // Wait for server initialization
    setTimeout(() => resolve(serverProcess), 1000);
  });
}

/**
 * Tool Testing Utilities - Context7 Pattern
 * Follows SDK examples for tool execution testing
 */
export class ToolTestRunner {
  constructor(private client: Client) {}

  async testToolDiscovery(): Promise<{ tools: any[], count: number }> {
    const result = await this.client.listTools();
    return {
      tools: result.tools || [],
      count: (result.tools || []).length
    };
  }

  async testToolExecution(toolName: string, args: Record<string, any> = {}): Promise<any> {
    try {
      const result = await this.client.callTool({
        name: toolName,
        arguments: args
      });
      return {
        success: !result.isError,
        content: result.content,
        isError: result.isError || false
      };
    } catch (error: any) {
      return {
        success: false,
        content: [{ type: 'text', text: error.message }],
        isError: true,
        error: error.message
      };
    }
  }

  async testAllSiYuanTools(): Promise<{ passed: number, failed: number, results: any[] }> {
    const { tools } = await this.testToolDiscovery();
    const results: any[] = [];
    let passed = 0;
    let failed = 0;

    for (const tool of tools) {
      const result = await this.testToolExecution(tool.name, {});
      results.push({
        tool: tool.name,
        result,
        status: result.success ? 'PASS' : 'FAIL'
      });

      if (result.success) passed++;
      else failed++;
    }

    return { passed, failed, results };
  }
}

/**
 * Performance Testing Utilities - Context7 Pattern
 * Measures response times following best practices
 */
export class PerformanceTestRunner {
  constructor(private client: Client) {}

  async measureToolResponseTime(toolName: string, args: Record<string, any> = {}): Promise<number> {
    const start = performance.now();
    
    await this.client.callTool({
      name: toolName,
      arguments: args
    });
    
    return performance.now() - start;
  }

  async benchmarkAllTools(): Promise<{ averageResponseTime: number, results: any[] }> {
    const { tools } = await this.client.listTools();
    const results: any[] = [];
    let totalTime = 0;

    for (const tool of tools) {
      const responseTime = await this.measureToolResponseTime(tool.name);
      results.push({
        tool: tool.name,
        responseTime,
        status: responseTime < 200 ? 'PASS' : 'SLOW'
      });
      totalTime += responseTime;
    }

    return {
      averageResponseTime: totalTime / tools.length,
      results
    };
  }
}

/**
 * Test Cleanup Utilities
 * Ensures proper cleanup of test resources
 */
export class TestCleanup {
  private processes: ChildProcess[] = [];
  private clients: Client[] = [];

  addProcess(process: ChildProcess): void {
    this.processes.push(process);
  }

  addClient(client: Client): void {
    this.clients.push(client);
  }

  async cleanup(): Promise<void> {
    // Close all clients
    for (const client of this.clients) {
      try {
        await client.close?.();
      } catch (error) {
        console.warn('Error closing client:', error);
      }
    }

    // Kill all processes
    for (const process of this.processes) {
      try {
        process.kill('SIGTERM');
      } catch (error) {
        console.warn('Error killing process:', error);
      }
    }

    this.clients = [];
    this.processes = [];
  }
}

/**
 * Mock SiYuan API Responses
 * Provides consistent test data for API responses
 */
export const mockSiYuanResponses = {
  notebooks: {
    data: [
      { id: "test-notebook-1", name: "Test Notebook 1", icon: "📓", sort: 0 },
      { id: "test-notebook-2", name: "Test Notebook 2", icon: "📔", sort: 1 }
    ]
  },
  
  documents: {
    data: [
      { id: "test-doc-1", title: "Test Document 1", content: "Test content" },
      { id: "test-doc-2", title: "Test Document 2", content: "More test content" }
    ]
  },

  blocks: {
    data: [
      { id: "test-block-1", type: "p", content: "Test paragraph block" },
      { id: "test-block-2", type: "h", content: "Test heading block" }
    ]
  }
};

/**
 * Test Data Generators
 * Generate consistent test data for various scenarios
 */
export const testDataGenerators = {
  generateToolArgs: (toolName: string): Record<string, any> => {
    const baseArgs: Record<string, Record<string, any>> = {
      'notebook_lsNotebooks': {},
      'notebook_getDoc': { id: 'test-doc-1' },
      'block_getBlockByID': { id: 'test-block-1' },
      'filetree_listDocsByPath': { path: '/' }
    };
    
    return baseArgs[toolName] || {};
  },

  generateTestNotebook: () => ({
    id: `test-nb-${Date.now()}`,
    name: `Test Notebook ${Date.now()}`,
    icon: "🧪",
    sort: 999
  }),

  generateTestDocument: () => ({
    id: `test-doc-${Date.now()}`,
    title: `Test Document ${Date.now()}`,
    content: `# Test Document\n\nGenerated at ${new Date().toISOString()}`
  })
};

export default {
  createTestServer,
  createTestClient,
  startTestServerProcess,
  ToolTestRunner,
  PerformanceTestRunner,
  TestCleanup,
  mockSiYuanResponses,
  testDataGenerators
}; 