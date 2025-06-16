/**
 * Unit Tests: MCPToolRegistry
 * Testing tool registration and API mapping functionality
 * Following Context7 MCP SDK testing patterns
 */

import { MCPToolRegistry } from '../../src/mcp/server/toolRegistry';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { mockSiYuanResponses, testDataGenerators } from '../helpers/mcpTestHelpers';

describe('MCPToolRegistry', () => {
  let registry: MCPToolRegistry;
  let mockServer: Server;

  beforeEach(async () => {
    // Create mock server
    mockServer = new Server(
      { name: 'test-server', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
    
    // Create registry and register tools
    registry = new MCPToolRegistry(mockServer);
    await registry.registerAllTools();
  });

  describe('Tool Registration', () => {
    test('should register all 42 SiYuan APIs as tools', () => {
      const tools = registry.listTools();
      
      expect(tools).toHaveLength(42);
      expect(tools.every(tool => tool.name.includes('_'))).toBe(true);
    });

    test('should organize tools by category', () => {
      const tools = registry.listTools();
      
      const categories = [
        'notebook', 'filetree', 'block', 'asset', 
        'search', 'filesystem', 'export', 'system'
      ];
      
      categories.forEach(category => {
        const categoryTools = tools.filter(tool => tool.name.startsWith(category));
        expect(categoryTools.length).toBeGreaterThan(0);
      });
    });

    test('should provide valid tool descriptions', () => {
      const tools = registry.listTools();
      
      tools.forEach(tool => {
        expect(tool.description).toBeDefined();
        expect(tool.description.length).toBeGreaterThan(10);
        expect(tool.inputSchema).toBeDefined();
      });
    });
  });

  describe('Tool Execution', () => {
    test('should execute notebook_lsNotebooks successfully', async () => {
      // Mock SiYuan API response
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSiYuanResponses.notebooks)
      });
      global.fetch = mockFetch;

      const result = await registry.executeTool('notebook_lsNotebooks', {});
      
      expect(result.isError).toBe(false);
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(JSON.parse(result.content[0].text)).toEqual(mockSiYuanResponses.notebooks);
    });

    test('should execute block_getBlockByID with parameters', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSiYuanResponses.blocks)
      });
      global.fetch = mockFetch;

      const result = await registry.executeTool('block_getBlockByID', { id: 'test-block-1' });
      
      expect(result.isError).toBe(false);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/block/getBlockByID'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ id: 'test-block-1' })
        })
      );
    });

    test('should handle invalid tool name', async () => {
      const result = await registry.executeTool('invalid_tool', {});
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unknown tool');
    });

    test('should handle API errors gracefully', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
      global.fetch = mockFetch;

      const result = await registry.executeTool('notebook_lsNotebooks', {});
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('500');
    });
  });

  describe('Parameter Validation', () => {
    test('should validate required parameters', async () => {
      const result = await registry.executeTool('notebook_getDoc', {});
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('required');
    });

    test('should validate parameter types', async () => {
      const result = await registry.executeTool('notebook_getDoc', { id: 123 });
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('type');
    });

    test('should accept valid parameters', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSiYuanResponses.documents)
      });
      global.fetch = mockFetch;

      const result = await registry.executeTool('notebook_getDoc', { id: 'test-doc-1' });
      
      expect(result.isError).toBe(false);
    });
  });

  describe('Tool Categories', () => {
    const expectedCategories = {
      notebook: 8,
      filetree: 7,
      block: 11,
      asset: 1,
      search: 2,
      filesystem: 4,
      export: 4,
      system: 6
    };

    Object.entries(expectedCategories).forEach(([category, count]) => {
      test(`should have ${count} ${category} tools`, () => {
        const tools = registry.listTools();
        const categoryTools = tools.filter(tool => tool.name.startsWith(category));
        
        expect(categoryTools).toHaveLength(count);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      const result = await registry.executeTool('notebook_lsNotebooks', {});
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Network error');
    });

    test('should handle JSON parsing errors', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });
      global.fetch = mockFetch;

      const result = await registry.executeTool('notebook_lsNotebooks', {});
      
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Invalid JSON');
    });
  });

  describe('Performance', () => {
    test('should complete tool listing in under 10ms', () => {
      const start = performance.now();
      registry.listTools();
      const duration = performance.now() - start;
      
      expect(duration).toBeLessThan(10);
    });

    test('should handle concurrent tool executions', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSiYuanResponses.notebooks)
      });
      global.fetch = mockFetch;

      const promises = Array(5).fill(null).map(() => 
        registry.executeTool('notebook_lsNotebooks', {})
      );

      const results = await Promise.all(promises);
      
      expect(results.every(r => !r.isError)).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });
  });
});

// Mock fetch API
global.fetch = jest.fn();

// Reset mocks after each test
afterEach(() => {
  jest.clearAllMocks();
}); 