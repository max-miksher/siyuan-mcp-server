<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <h1>SiYuan MCP Server Dashboard</h1>
      <div class="status-indicator" :class="serverStatus.class">
        <span class="status-dot"></span>
        {{ serverStatus.text }}
      </div>
    </header>

    <div class="dashboard-grid">
      <!-- Server Status Panel -->
      <div class="panel status-panel">
        <h2>Server Status</h2>
        <div class="status-metrics">
          <div class="metric">
            <label>Uptime</label>
            <span>{{ formatUptime(serverMetrics.uptime) }}</span>
          </div>
          <div class="metric">
            <label>Active Sessions</label>
            <span>{{ serverMetrics.activeSessions }}</span>
          </div>
          <div class="metric">
            <label>Total Requests</label>
            <span>{{ serverMetrics.totalRequests }}</span>
          </div>
          <div class="metric">
            <label>Cache Hit Rate</label>
            <span>{{ serverMetrics.cacheHitRate }}%</span>
          </div>
        </div>
      </div>

      <!-- Configuration Panel -->
      <div class="panel config-panel">
        <h2>Configuration</h2>
        <div class="config-form">
          <div class="form-group">
            <label for="siyuan-url">SiYuan URL</label>
            <input 
              id="siyuan-url"
              v-model="config.siyuanUrl" 
              type="url" 
              @change="updateConfig"
            />
          </div>
          <div class="form-group">
            <label for="api-token">API Token</label>
            <input 
              id="api-token"
              v-model="config.apiToken" 
              type="password" 
              @change="updateConfig"
            />
          </div>
          <div class="form-group">
            <label for="cache-ttl">Cache TTL (seconds)</label>
            <input 
              id="cache-ttl"
              v-model.number="config.cacheTtl" 
              type="number" 
              min="30" 
              max="3600"
              @change="updateConfig"
            />
          </div>
          <div class="form-group">
            <label for="max-sessions">Max Sessions</label>
            <input 
              id="max-sessions"
              v-model.number="config.maxSessions" 
              type="number" 
              min="1" 
              max="100"
              @change="updateConfig"
            />
          </div>
        </div>
      </div>

      <!-- Performance Monitoring -->
      <div class="panel performance-panel">
        <h2>Performance Metrics</h2>
        <div class="performance-charts">
          <div class="chart-container">
            <h3>Response Times (ms)</h3>
            <div class="chart" ref="responseTimeChart">
              <div 
                v-for="(time, index) in performanceData.responseTimes.slice(-20)" 
                :key="index"
                class="chart-bar"
                :style="{ height: `${Math.min(time / 10, 100)}%` }"
                :title="`${time}ms`"
              ></div>
            </div>
          </div>
          <div class="chart-container">
            <h3>Memory Usage (MB)</h3>
            <div class="memory-usage">
              <div class="memory-bar">
                <div 
                  class="memory-fill"
                  :style="{ width: `${(performanceData.memoryUsage / performanceData.memoryLimit) * 100}%` }"
                ></div>
              </div>
              <span>{{ performanceData.memoryUsage }}MB / {{ performanceData.memoryLimit }}MB</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Resource Explorer -->
      <div class="panel resource-panel">
        <h2>MCP Resources</h2>
        <div class="resource-list">
          <div 
            v-for="resource in mcpResources" 
            :key="resource.uri"
            class="resource-item"
            @click="testResource(resource)"
          >
            <div class="resource-info">
              <span class="resource-uri">{{ resource.uri }}</span>
              <span class="resource-type">{{ resource.mimeType }}</span>
            </div>
            <div class="resource-actions">
              <button class="btn-test" :disabled="resource.testing">
                {{ resource.testing ? 'Testing...' : 'Test' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tools Panel -->
      <div class="panel tools-panel">
        <h2>MCP Tools</h2>
        <div class="tools-grid">
          <div 
            v-for="tool in mcpTools" 
            :key="tool.name"
            class="tool-card"
            @click="executeTool(tool)"
          >
            <h4>{{ tool.name }}</h4>
            <p>{{ tool.description }}</p>
            <div class="tool-stats">
              <span>Used: {{ tool.usageCount }}</span>
              <span>Avg: {{ tool.avgResponseTime }}ms</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Logs Panel -->
      <div class="panel logs-panel">
        <h2>Recent Logs</h2>
        <div class="logs-container">
          <div 
            v-for="log in recentLogs" 
            :key="log.id"
            class="log-entry"
            :class="log.level"
          >
            <span class="log-timestamp">{{ formatTimestamp(log.timestamp) }}</span>
            <span class="log-level">{{ log.level.toUpperCase() }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Toast -->
    <div v-if="errorMessage" class="error-toast" @click="clearError">
      <span>{{ errorMessage }}</span>
      <button class="close-btn">×</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'

// Reactive state management
const serverMetrics = reactive({
  uptime: 0,
  activeSessions: 0,
  totalRequests: 0,
  cacheHitRate: 0
})

const config = reactive({
  siyuanUrl: 'http://127.0.0.1:6806',
  apiToken: '',
  cacheTtl: 300,
  maxSessions: 10
})

const performanceData = reactive({
  responseTimes: [],
  memoryUsage: 0,
  memoryLimit: 512
})

const mcpResources = ref([
  { uri: 'siyuan://notebooks', mimeType: 'application/json', testing: false },
  { uri: 'siyuan://notebook/{id}', mimeType: 'application/json', testing: false },
  { uri: 'siyuan://document/{id}', mimeType: 'text/markdown', testing: false },
  { uri: 'siyuan://block/{id}', mimeType: 'application/json', testing: false },
  { uri: 'siyuan://search?query={q}', mimeType: 'application/json', testing: false },
  { uri: 'siyuan://workspace', mimeType: 'application/json', testing: false }
])

const mcpTools = ref([
  { name: 'create-document', description: 'Create new document', usageCount: 0, avgResponseTime: 0 },
  { name: 'update-document', description: 'Update document content', usageCount: 0, avgResponseTime: 0 },
  { name: 'delete-document', description: 'Delete document', usageCount: 0, avgResponseTime: 0 },
  { name: 'insert-block', description: 'Insert new block', usageCount: 0, avgResponseTime: 0 },
  { name: 'update-block', description: 'Update block content', usageCount: 0, avgResponseTime: 0 },
  { name: 'delete-block', description: 'Delete block', usageCount: 0, avgResponseTime: 0 },
  { name: 'move-block', description: 'Move block position', usageCount: 0, avgResponseTime: 0 },
  { name: 'search-content', description: 'Search content', usageCount: 0, avgResponseTime: 0 },
  { name: 'sql-query', description: 'Execute SQL query', usageCount: 0, avgResponseTime: 0 },
  { name: 'create-notebook', description: 'Create new notebook', usageCount: 0, avgResponseTime: 0 },
  { name: 'rename-notebook', description: 'Rename notebook', usageCount: 0, avgResponseTime: 0 },
  { name: 'export-document', description: 'Export document', usageCount: 0, avgResponseTime: 0 },
  { name: 'upload-asset', description: 'Upload asset file', usageCount: 0, avgResponseTime: 0 },
  { name: 'get-block-info', description: 'Get block information', usageCount: 0, avgResponseTime: 0 },
  { name: 'list-recent-docs', description: 'List recent documents', usageCount: 0, avgResponseTime: 0 },
  { name: 'get-backlinks', description: 'Get document backlinks', usageCount: 0, avgResponseTime: 0 }
])

const recentLogs = ref([])
const errorMessage = ref('')
const startTime = Date.now()

// Computed properties
const serverStatus = computed(() => {
  if (serverMetrics.activeSessions > 0) {
    return { class: 'online', text: 'Online' }
  } else {
    return { class: 'offline', text: 'Offline' }
  }
})

// Methods
const formatUptime = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours}h ${minutes}m ${secs}s`
}

const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString()
}

const updateConfig = async () => {
  try {
    const response = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    })
    
    if (!response.ok) {
      throw new Error('Failed to update configuration')
    }
    
    addLog('info', 'Configuration updated successfully')
  } catch (error) {
    showError(`Configuration update failed: ${error.message}`)
  }
}

const testResource = async (resource) => {
  resource.testing = true
  try {
    const response = await fetch(`/api/test-resource`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uri: resource.uri })
    })
    
    if (response.ok) {
      addLog('info', `Resource test successful: ${resource.uri}`)
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (error) {
    addLog('error', `Resource test failed: ${resource.uri} - ${error.message}`)
  } finally {
    resource.testing = false
  }
}

const executeTool = async (tool) => {
  try {
    const startTime = Date.now()
    const response = await fetch(`/api/execute-tool`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: tool.name, arguments: {} })
    })
    
    const responseTime = Date.now() - startTime
    
    if (response.ok) {
      tool.usageCount++
      tool.avgResponseTime = Math.round((tool.avgResponseTime + responseTime) / 2)
      addLog('info', `Tool executed successfully: ${tool.name} (${responseTime}ms)`)
    } else {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (error) {
    addLog('error', `Tool execution failed: ${tool.name} - ${error.message}`)
  }
}

const addLog = (level, message) => {
  const log = {
    id: Date.now(),
    timestamp: Date.now(),
    level,
    message
  }
  recentLogs.value.unshift(log)
  if (recentLogs.value.length > 100) {
    recentLogs.value = recentLogs.value.slice(0, 100)
  }
}

const showError = (message) => {
  errorMessage.value = message
  setTimeout(() => {
    errorMessage.value = ''
  }, 5000)
}

const clearError = () => {
  errorMessage.value = ''
}

const fetchMetrics = async () => {
  try {
    // Mock data for demonstration since we're in browser environment
    const mockMetrics = {
      uptime: Math.floor((Date.now() - startTime) / 1000),
      activeSessions: Math.floor(Math.random() * 5) + 1,
      totalRequests: Math.floor(Math.random() * 1000) + 100,
      cacheHitRate: Math.floor(Math.random() * 30) + 70,
      avgResponseTime: Math.floor(Math.random() * 100) + 50,
      memoryUsage: Math.floor(Math.random() * 100) + 200
    }
    
    Object.assign(serverMetrics, mockMetrics)
    
    // Update performance data
    performanceData.responseTimes.push(mockMetrics.avgResponseTime || 0)
    if (performanceData.responseTimes.length > 50) {
      performanceData.responseTimes.shift()
    }
    
    performanceData.memoryUsage = mockMetrics.memoryUsage || 0
  } catch (error) {
    console.error('Failed to fetch metrics:', error)
  }
}

const fetchConfig = async () => {
  try {
    // Mock configuration data
    const mockConfig = {
      siyuanUrl: 'http://localhost:6806',
      apiToken: '***hidden***',
      cacheTtl: 300,
      maxSessions: 10
    }
    Object.assign(config, mockConfig)
  } catch (error) {
    console.error('Failed to fetch config:', error)
  }
}

const fetchLogs = async () => {
  try {
    // Mock logs data
    const mockLogs = [
      { timestamp: new Date().toISOString(), level: 'info', message: 'MCP Server started successfully' },
      { timestamp: new Date(Date.now() - 30000).toISOString(), level: 'info', message: 'Cache initialized with 1000 entries' },
      { timestamp: new Date(Date.now() - 60000).toISOString(), level: 'debug', message: 'Resource request: siyuan/notebooks' },
      { timestamp: new Date(Date.now() - 90000).toISOString(), level: 'info', message: 'Tool executed: search_blocks' },
      { timestamp: new Date(Date.now() - 120000).toISOString(), level: 'warn', message: 'Cache hit rate below 80%' }
    ]
    recentLogs.value = mockLogs
  } catch (error) {
    console.error('Failed to fetch logs:', error)
  }
}

// Lifecycle hooks
let metricsInterval
let logsInterval

onMounted(() => {
  // Initial data fetch
  fetchMetrics()
  fetchConfig()
  fetchLogs()
  
  // Set up periodic updates
  metricsInterval = setInterval(fetchMetrics, 5000) // Every 5 seconds
  logsInterval = setInterval(fetchLogs, 10000) // Every 10 seconds
  
  addLog('info', 'Dashboard initialized')
})

onUnmounted(() => {
  if (metricsInterval) clearInterval(metricsInterval)
  if (logsInterval) clearInterval(logsInterval)
})
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  color: white;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 300;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  font-weight: 500;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.status-indicator.online .status-dot {
  background: #4ade80;
}

.status-indicator.offline .status-dot {
  background: #f87171;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.panel {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.panel h2 {
  margin: 0 0 20px 0;
  color: #374151;
  font-size: 1.5rem;
  font-weight: 600;
}

.status-metrics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.metric span {
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-group label {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

.form-group input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.performance-charts {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-container h3 {
  margin: 0 0 12px 0;
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
}

.chart {
  display: flex;
  align-items: end;
  height: 100px;
  gap: 2px;
  padding: 8px;
  background: #f9fafb;
  border-radius: 8px;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(to top, #667eea, #764ba2);
  border-radius: 2px;
  min-height: 4px;
  transition: height 0.3s ease;
}

.memory-usage {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.memory-bar {
  height: 20px;
  background: #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
}

.memory-fill {
  height: 100%;
  background: linear-gradient(to right, #10b981, #059669);
  transition: width 0.3s ease;
}

.resource-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.resource-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.resource-item:hover {
  background: #f3f4f6;
}

.resource-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.resource-uri {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: #111827;
}

.resource-type {
  font-size: 0.75rem;
  color: #6b7280;
}

.btn-test {
  padding: 4px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-test:hover:not(:disabled) {
  background: #5a67d8;
}

.btn-test:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.tool-card {
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e5e7eb;
}

.tool-card:hover {
  background: #f3f4f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tool-card h4 {
  margin: 0 0 8px 0;
  color: #111827;
  font-size: 0.875rem;
  font-weight: 600;
}

.tool-card p {
  margin: 0 0 12px 0;
  color: #6b7280;
  font-size: 0.75rem;
  line-height: 1.4;
}

.tool-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.625rem;
  color: #9ca3af;
}

.logs-container {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.log-entry {
  display: flex;
  gap: 12px;
  padding: 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-family: 'Courier New', monospace;
}

.log-entry.info {
  background: #eff6ff;
  color: #1e40af;
}

.log-entry.error {
  background: #fef2f2;
  color: #dc2626;
}

.log-entry.warn {
  background: #fffbeb;
  color: #d97706;
}

.log-timestamp {
  color: #6b7280;
  min-width: 80px;
}

.log-level {
  min-width: 50px;
  font-weight: 600;
}

.log-message {
  flex: 1;
}

.error-toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #dc2626;
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Responsive design */
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
  
  .dashboard-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .status-metrics {
    grid-template-columns: 1fr;
  }
  
  .tools-grid {
    grid-template-columns: 1fr;
  }
}
</style>