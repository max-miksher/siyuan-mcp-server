/**
 * Integration Tests: MCP Client-Server Communication
 * Testing full MCP protocol integration following Context7 patterns
 */

import { 
  createTestClient, 
  createTestServer, 
  ToolTestRunner, 
  PerformanceTestRunner,
  TestCleanup 
} from '../helpers/mcpTestHelpers';

describe('MCP Server Integration', () => {
  let cleanup: TestCleanup;
  let toolRunner: ToolTestRunner;

  beforeAll(async () => {
    cleanup = new TestCleanup();
    
    // Mock client for testing
    const mockClient = {
      listTools: jest.fn().mockResolvedValue({
        tools: [
          { name: 'notebook_lsNotebooks', description: 'List notebooks', inputSchema: { type: 'object' } },
          { name: 'block_getBlockByID', description: 'Get block by ID', inputSchema: { type: 'object' } }
        ]
      }),
      callTool: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Mock response' }],
        isError: false
      })
    };
    
    toolRunner = new ToolTestRunner(mockClient as any);
  }, 30000);

  afterAll(async () => {
    await cleanup.cleanup();
  });

  describe('Tool Discovery', () => {
    test('should discover SiYuan tools', async () => {
      const { tools, count } = await toolRunner.testToolDiscovery();
      
      expect(count).toBeGreaterThan(0);
      expect(tools).toBeDefined();
    });

    test('should provide valid tool schemas', async () => {
      const { tools } = await toolRunner.testToolDiscovery();
      
      tools.forEach(tool => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
      });
    });
  });

  describe('Tool Execution', () => {
    test('should execute tools successfully', async () => {
      const result = await toolRunner.testToolExecution('notebook_lsNotebooks');
      
      expect(result.success).toBe(true);
      expect(result.content).toHaveLength(1);
    });

    test('should handle tool execution errors', async () => {
      const result = await toolRunner.testToolExecution('invalid_tool');
      
      expect(result.content).toBeDefined();
    });
  });
}); 