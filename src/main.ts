import {
  Plugin,
} from "siyuan";
import { createApp } from 'vue'
import App from './App.vue'
import Dashboard from './components/Dashboard.vue'
import { 
  EnhancedMCPPluginIntegration, 
  createDefaultEnhancedIntegration, 
  setGlobalEnhancedIntegration 
} from './mcp/integration/enhancedPluginIntegration.js';
import { DEFAULT_SETTINGS } from './mcp/types/index.js';

let plugin = null;
let enhancedMcpIntegration: EnhancedMCPPluginIntegration | null = null;

export function usePlugin(pluginProps?: Plugin): Plugin {
  console.log('usePlugin', pluginProps, plugin)
  if (pluginProps) {
    plugin = pluginProps
  }
  if (!plugin && !pluginProps) {
    console.error('need bind plugin')
  }
  return plugin;
}


let app = null
export async function init(plugin: Plugin) {
  // bind plugin hook
  usePlugin(plugin);

  // Initialize Enhanced MCP Integration
  try {
    console.log('🚀 Initializing Enhanced MCP Plugin Integration...');
    enhancedMcpIntegration = await createDefaultEnhancedIntegration(plugin, DEFAULT_SETTINGS);
    setGlobalEnhancedIntegration(enhancedMcpIntegration);
    
    // Start Enhanced MCP server if enabled
    if (DEFAULT_SETTINGS.enabled && DEFAULT_SETTINGS.autoStart) {
      await enhancedMcpIntegration.startServer();
    }
    
    // Dashboard will connect to MCP server via HTTP API
    console.log('✅ Dashboard ready to connect to MCP server');
    
    console.log('✅ Enhanced MCP Integration initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Enhanced MCP integration:', error);
  }

  const div = document.createElement('div')
  div.classList.toggle('plugin-sample-vite-vue-app')
  div.id = 'mcp-plugin-app'
  app = createApp(App)
  app.mount(div)
  document.body.appendChild(div)
}

export function destroy() {
  // Cleanup Enhanced MCP Integration
  if (enhancedMcpIntegration) {
    enhancedMcpIntegration.destroy().catch(error => {
      console.error('Error destroying Enhanced MCP integration:', error);
    });
  }

  app.unmount()
  const div = document.getElementById('mcp-plugin-app')
  if (div) {
    document.body.removeChild(div)
  }
}
