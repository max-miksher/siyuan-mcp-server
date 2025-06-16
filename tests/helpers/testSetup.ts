/**
 * Test Setup - Global Configuration for MCP Testing
 * Following Context7 documented testing patterns
 */

import { TestCleanup } from './mcpTestHelpers';

// Jest globals
declare global {
  var jest: any;
  var beforeAll: any;
  var afterAll: any;
}

// Global test cleanup instance
const globalCleanup = new TestCleanup();

// Extend global timeout for MCP operations
jest.setTimeout(30000);

// Global setup
beforeAll(async () => {
  console.log('🧪 Starting SiYuan MCP Server Test Suite');
  console.log('📋 Test Configuration:');
  console.log('  - MCP SDK Version: @modelcontextprotocol/sdk@1.12.3');
  console.log('  - Test Environment: Node.js');
  console.log('  - Transport: StdioClientTransport');
  console.log('  - Coverage Target: 100%');
});

// Global cleanup
afterAll(async () => {
  console.log('🧹 Cleaning up test resources...');
  await globalCleanup.cleanup();
  console.log('✅ Test suite completed');
});

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Export cleanup for tests to use
export { globalCleanup }; 