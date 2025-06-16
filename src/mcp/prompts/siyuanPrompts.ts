/**
 * SiYuan MCP Prompts Implementation
 * Intelligent prompt templates for SiYuan content operations
 * Based on Context7 documentation and creative phase decisions
 */

import { z } from 'zod';
import { SiYuanAPIAdapter } from '../server/apiAdapter.js';
import { CacheManager } from '../utils/cacheManager.js';

/**
 * Prompt response interface compatible with MCP SDK
 */
export interface PromptResponse {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: {
      type: 'text' | 'image';
      text?: string;
      data?: string;
      mimeType?: string;
    };
  }>;
  metadata?: Record<string, any>;
}

/**
 * SiYuan Prompts Manager
 * Implements intelligent prompt templates for SiYuan operations
 */
export class SiYuanPromptsManager {
  private apiAdapter: SiYuanAPIAdapter;
  private cacheManager: CacheManager;

  constructor(apiAdapter: SiYuanAPIAdapter, cacheManager: CacheManager) {
    this.apiAdapter = apiAdapter;
    this.cacheManager = cacheManager;
  }

  /**
   * Get all prompt definitions for MCP server registration
   */
  getPromptDefinitions() {
    return [
      // Content Analysis Prompts
      {
        name: 'analyze-document',
        description: 'Analyze a SiYuan document and provide insights',
        inputSchema: z.object({
          documentId: z.string().describe('Document ID to analyze'),
          analysisType: z.enum(['summary', 'structure', 'keywords', 'quality']).default('summary').describe('Type of analysis to perform')
        }),
        handler: this.analyzeDocument.bind(this)
      },

      {
        name: 'analyze-block',
        description: 'Analyze a specific block and provide detailed insights',
        inputSchema: z.object({
          blockId: z.string().describe('Block ID to analyze'),
          context: z.boolean().default(true).describe('Include surrounding context in analysis')
        }),
        handler: this.analyzeBlock.bind(this)
      },

      // Content Generation Prompts
      {
        name: 'generate-summary',
        description: 'Generate a comprehensive summary of SiYuan content',
        inputSchema: z.object({
          contentId: z.string().describe('Document or block ID to summarize'),
          length: z.enum(['brief', 'detailed', 'comprehensive']).default('detailed').describe('Summary length'),
          format: z.enum(['paragraph', 'bullets', 'outline']).default('paragraph').describe('Summary format')
        }),
        handler: this.generateSummary.bind(this)
      },

      {
        name: 'generate-outline',
        description: 'Generate a structured outline from SiYuan content',
        inputSchema: z.object({
          documentId: z.string().describe('Document ID to create outline from'),
          depth: z.number().default(3).describe('Maximum outline depth'),
          includeContent: z.boolean().default(false).describe('Include content snippets in outline')
        }),
        handler: this.generateOutline.bind(this)
      },

      // Search and Query Prompts
      {
        name: 'smart-search',
        description: 'Perform intelligent search with natural language query',
        inputSchema: z.object({
          query: z.string().describe('Natural language search query'),
          scope: z.enum(['workspace', 'notebook', 'document']).default('workspace').describe('Search scope'),
          scopeId: z.string().optional().describe('Specific notebook or document ID for scoped search')
        }),
        handler: this.smartSearch.bind(this)
      },

      {
        name: 'find-related',
        description: 'Find content related to a specific document or block',
        inputSchema: z.object({
          contentId: z.string().describe('Reference document or block ID'),
          relationshipType: z.enum(['similar', 'referenced', 'linked', 'semantic']).default('similar').describe('Type of relationship to find'),
          limit: z.number().default(10).describe('Maximum number of related items to find')
        }),
        handler: this.findRelated.bind(this)
      },

      // Content Organization Prompts
      {
        name: 'suggest-tags',
        description: 'Suggest relevant tags for SiYuan content',
        inputSchema: z.object({
          contentId: z.string().describe('Document or block ID to suggest tags for'),
          maxTags: z.number().default(5).describe('Maximum number of tags to suggest'),
          includeExisting: z.boolean().default(true).describe('Include analysis of existing tags')
        }),
        handler: this.suggestTags.bind(this)
      },

      {
        name: 'organize-content',
        description: 'Suggest content organization and structure improvements',
        inputSchema: z.object({
          documentId: z.string().describe('Document ID to analyze for organization'),
          organizationType: z.enum(['structure', 'categorization', 'hierarchy', 'workflow']).default('structure').describe('Type of organization analysis')
        }),
        handler: this.organizeContent.bind(this)
      },

      // Writing and Editing Prompts
      {
        name: 'improve-writing',
        description: 'Suggest improvements for writing quality and clarity',
        inputSchema: z.object({
          contentId: z.string().describe('Document or block ID to improve'),
          focusArea: z.enum(['clarity', 'grammar', 'style', 'structure', 'all']).default('all').describe('Area to focus improvement on'),
          tone: z.enum(['formal', 'casual', 'academic', 'technical', 'creative']).optional().describe('Desired tone for the content')
        }),
        handler: this.improveWriting.bind(this)
      },

      {
        name: 'expand-content',
        description: 'Generate suggestions to expand and enrich content',
        inputSchema: z.object({
          contentId: z.string().describe('Document or block ID to expand'),
          expansionType: z.enum(['details', 'examples', 'explanations', 'connections', 'research']).default('details').describe('Type of expansion to suggest'),
          targetLength: z.enum(['short', 'medium', 'long']).default('medium').describe('Target expansion length')
        }),
        handler: this.expandContent.bind(this)
      },

      // Knowledge Management Prompts
      {
        name: 'knowledge-graph',
        description: 'Generate knowledge graph insights from SiYuan content',
        inputSchema: z.object({
          scope: z.enum(['workspace', 'notebook', 'document']).default('workspace').describe('Scope for knowledge graph'),
          scopeId: z.string().optional().describe('Specific ID for scoped analysis'),
          relationshipTypes: z.array(z.string()).default(['links', 'references', 'tags', 'semantic']).describe('Types of relationships to analyze')
        }),
        handler: this.knowledgeGraph.bind(this)
      },

      {
        name: 'learning-path',
        description: 'Generate a learning path from SiYuan knowledge base',
        inputSchema: z.object({
          topic: z.string().describe('Topic or subject for learning path'),
          level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner').describe('Target learning level'),
          format: z.enum(['linear', 'branched', 'modular']).default('linear').describe('Learning path structure')
        }),
        handler: this.learningPath.bind(this)
      }
    ];
  }

  /**
   * Analyze document prompt
   */
  private async analyzeDocument(args: any): Promise<PromptResponse> {
    try {
      // Get document content
      const kramdown = await this.apiAdapter.callTool('siyuan_get_block_kramdown', {
        id: args.documentId
      });

      const docInfo = await this.apiAdapter.callTool('siyuan_get_doc', {
        id: args.documentId,
        mode: 0
      });

      const content = kramdown?.kramdown || '';
      const title = docInfo?.name || 'Untitled Document';

      let analysisPrompt = '';
      switch (args.analysisType) {
        case 'summary':
          analysisPrompt = `Please provide a comprehensive summary of this SiYuan document titled "${title}". Focus on the main ideas, key points, and overall structure.`;
          break;
        case 'structure':
          analysisPrompt = `Please analyze the structure and organization of this SiYuan document titled "${title}". Identify the hierarchy, flow, and logical organization of the content.`;
          break;
        case 'keywords':
          analysisPrompt = `Please extract and analyze the key terms, concepts, and topics from this SiYuan document titled "${title}". Identify the most important keywords and themes.`;
          break;
        case 'quality':
          analysisPrompt = `Please evaluate the quality of this SiYuan document titled "${title}". Assess clarity, completeness, accuracy, and suggest improvements.`;
          break;
      }

      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `${analysisPrompt}\n\nDocument Content:\n${content}`
          }
        }],
        metadata: {
          prompt: 'analyze-document',
          documentId: args.documentId,
          analysisType: args.analysisType,
          title: title
        }
      };
    } catch (error: any) {
      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Error analyzing document ${args.documentId}: ${error.message}`
          }
        }],
        metadata: { prompt: 'analyze-document', error: error.message }
      };
    }
  }

  /**
   * Analyze block prompt
   */
  private async analyzeBlock(args: any): Promise<PromptResponse> {
    try {
      const kramdown = await this.apiAdapter.callTool('siyuan_get_block_kramdown', {
        id: args.blockId
      });

      const attrs = await this.apiAdapter.callTool('siyuan_get_block_attrs', {
        id: args.blockId
      });

      let contextContent = '';
      if (args.context) {
        // Get parent and sibling blocks for context
        const children = await this.apiAdapter.callTool('siyuan_get_block_children', {
          id: attrs?.parentID || args.blockId
        });
        contextContent = `\n\nContext (surrounding blocks):\n${JSON.stringify(children, null, 2)}`;
      }

      const content = kramdown?.kramdown || '';
      const blockType = attrs?.type || 'unknown';

      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Please analyze this SiYuan block (type: ${blockType}) and provide detailed insights about its content, purpose, and quality. Consider its role within the document structure.

Block Content:
${content}${contextContent}`
          }
        }],
        metadata: {
          prompt: 'analyze-block',
          blockId: args.blockId,
          blockType: blockType,
          includeContext: args.context
        }
      };
    } catch (error: any) {
      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Error analyzing block ${args.blockId}: ${error.message}`
          }
        }],
        metadata: { prompt: 'analyze-block', error: error.message }
      };
    }
  }

  /**
   * Generate summary prompt
   */
  private async generateSummary(args: any): Promise<PromptResponse> {
    try {
      const kramdown = await this.apiAdapter.callTool('siyuan_get_block_kramdown', {
        id: args.contentId
      });

      const content = kramdown?.kramdown || '';
      
      let lengthInstruction = '';
      switch (args.length) {
        case 'brief':
          lengthInstruction = 'Keep the summary concise and to the point (1-2 paragraphs).';
          break;
        case 'detailed':
          lengthInstruction = 'Provide a detailed summary covering all major points (3-5 paragraphs).';
          break;
        case 'comprehensive':
          lengthInstruction = 'Create a comprehensive summary that captures all important details and nuances.';
          break;
      }

      let formatInstruction = '';
      switch (args.format) {
        case 'paragraph':
          formatInstruction = 'Format the summary as flowing paragraphs.';
          break;
        case 'bullets':
          formatInstruction = 'Format the summary as bullet points.';
          break;
        case 'outline':
          formatInstruction = 'Format the summary as a structured outline with headings and subpoints.';
          break;
      }

      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Please generate a summary of the following SiYuan content. ${lengthInstruction} ${formatInstruction}

Content to summarize:
${content}`
          }
        }],
        metadata: {
          prompt: 'generate-summary',
          contentId: args.contentId,
          length: args.length,
          format: args.format
        }
      };
    } catch (error: any) {
      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Error generating summary for ${args.contentId}: ${error.message}`
          }
        }],
        metadata: { prompt: 'generate-summary', error: error.message }
      };
    }
  }

  /**
   * Generate outline prompt
   */
  private async generateOutline(args: any): Promise<PromptResponse> {
    try {
      const kramdown = await this.apiAdapter.callTool('siyuan_get_block_kramdown', {
        id: args.documentId
      });

      const docInfo = await this.apiAdapter.callTool('siyuan_get_doc', {
        id: args.documentId,
        mode: 0
      });

      const content = kramdown?.kramdown || '';
      const title = docInfo?.name || 'Untitled Document';

      const depthInstruction = `Create an outline with up to ${args.depth} levels of depth.`;
      const contentInstruction = args.includeContent 
        ? 'Include brief content snippets under each outline point.'
        : 'Focus on the structure and main points without detailed content.';

      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Please create a structured outline for this SiYuan document titled "${title}". ${depthInstruction} ${contentInstruction}

Document Content:
${content}`
          }
        }],
        metadata: {
          prompt: 'generate-outline',
          documentId: args.documentId,
          depth: args.depth,
          includeContent: args.includeContent,
          title: title
        }
      };
    } catch (error: any) {
      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Error generating outline for ${args.documentId}: ${error.message}`
          }
        }],
        metadata: { prompt: 'generate-outline', error: error.message }
      };
    }
  }

  /**
   * Smart search prompt
   */
  private async smartSearch(args: any): Promise<PromptResponse> {
    try {
      // Perform search based on scope
      let searchResults;
      if (args.scope === 'workspace') {
        searchResults = await this.apiAdapter.callTool('siyuan_fulltext_search_block', {
          query: args.query,
          method: 0,
          types: { document: true, heading: true, paragraph: true },
          paths: [],
          page: 1,
          pageSize: 20
        });
      } else {
        // Scoped search would need additional implementation
        searchResults = { blocks: [] };
      }

      const resultsText = searchResults?.blocks?.map((block: any, index: number) => 
        `${index + 1}. ${block.content?.substring(0, 200)}...`
      ).join('\n') || 'No results found';

      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Based on the search query "${args.query}" in my SiYuan ${args.scope}, please help me understand and analyze the following search results. Provide insights, connections, and suggestions for further exploration.

Search Results:
${resultsText}`
          }
        }],
        metadata: {
          prompt: 'smart-search',
          query: args.query,
          scope: args.scope,
          resultCount: searchResults?.blocks?.length || 0
        }
      };
    } catch (error: any) {
      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Error performing smart search for "${args.query}": ${error.message}`
          }
        }],
        metadata: { prompt: 'smart-search', error: error.message }
      };
    }
  }

  /**
   * Find related content prompt
   */
  private async findRelated(args: any): Promise<PromptResponse> {
    try {
      // Get the reference content
      const kramdown = await this.apiAdapter.callTool('siyuan_get_block_kramdown', {
        id: args.contentId
      });

      const content = kramdown?.kramdown || '';

      // Extract keywords for related search
      const keywords = this.extractKeywords(content);
      const searchQuery = keywords.slice(0, 5).join(' ');

      // Search for related content
      const searchResults = await this.apiAdapter.callTool('siyuan_fulltext_search_block', {
        query: searchQuery,
        method: 0,
        types: { document: true, heading: true, paragraph: true },
        paths: [],
        page: 1,
        pageSize: args.limit
      });

      const relatedContent = searchResults?.blocks?.filter((block: any) => 
        block.id !== args.contentId
      ).slice(0, args.limit) || [];

      const relatedText = relatedContent.map((block: any, index: number) => 
        `${index + 1}. ${block.content?.substring(0, 150)}...`
      ).join('\n') || 'No related content found';

      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Based on this reference content from my SiYuan knowledge base, please analyze the following related content and explain the connections, relationships, and insights. Focus on ${args.relationshipType} relationships.

Reference Content:
${content.substring(0, 500)}...

Related Content Found:
${relatedText}`
          }
        }],
        metadata: {
          prompt: 'find-related',
          contentId: args.contentId,
          relationshipType: args.relationshipType,
          relatedCount: relatedContent.length
        }
      };
    } catch (error: any) {
      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Error finding related content for ${args.contentId}: ${error.message}`
          }
        }],
        metadata: { prompt: 'find-related', error: error.message }
      };
    }
  }

  /**
   * Suggest tags prompt
   */
  private async suggestTags(args: any): Promise<PromptResponse> {
    try {
      const kramdown = await this.apiAdapter.callTool('siyuan_get_block_kramdown', {
        id: args.contentId
      });

      const attrs = await this.apiAdapter.callTool('siyuan_get_block_attrs', {
        id: args.contentId
      });

      const content = kramdown?.kramdown || '';
      const existingTags = attrs?.tags || '';

      const existingTagsText = args.includeExisting && existingTags 
        ? `\n\nExisting tags: ${existingTags}`
        : '';

      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Please suggest up to ${args.maxTags} relevant tags for this SiYuan content. Consider the main topics, concepts, and themes. Provide tags that would be useful for organization and discovery.${existingTagsText}

Content:
${content}`
          }
        }],
        metadata: {
          prompt: 'suggest-tags',
          contentId: args.contentId,
          maxTags: args.maxTags,
          existingTags: existingTags
        }
      };
    } catch (error: any) {
      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Error suggesting tags for ${args.contentId}: ${error.message}`
          }
        }],
        metadata: { prompt: 'suggest-tags', error: error.message }
      };
    }
  }

  /**
   * Organize content prompt
   */
  private async organizeContent(args: any): Promise<PromptResponse> {
    try {
      const kramdown = await this.apiAdapter.callTool('siyuan_get_block_kramdown', {
        id: args.documentId
      });

      const docInfo = await this.apiAdapter.callTool('siyuan_get_doc', {
        id: args.documentId,
        mode: 0
      });

      const content = kramdown?.kramdown || '';
      const title = docInfo?.name || 'Untitled Document';

      let organizationPrompt = '';
      switch (args.organizationType) {
        case 'structure':
          organizationPrompt = 'Analyze the document structure and suggest improvements for better organization, flow, and readability.';
          break;
        case 'categorization':
          organizationPrompt = 'Suggest how to categorize and group the content into logical sections or themes.';
          break;
        case 'hierarchy':
          organizationPrompt = 'Recommend a hierarchical organization with proper heading levels and nested structure.';
          break;
        case 'workflow':
          organizationPrompt = 'Suggest a workflow-based organization that follows a logical process or sequence.';
          break;
      }

      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Please analyze this SiYuan document titled "${title}" and ${organizationPrompt} Provide specific recommendations for improvement.

Document Content:
${content}`
          }
        }],
        metadata: {
          prompt: 'organize-content',
          documentId: args.documentId,
          organizationType: args.organizationType,
          title: title
        }
      };
    } catch (error: any) {
      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Error organizing content for ${args.documentId}: ${error.message}`
          }
        }],
        metadata: { prompt: 'organize-content', error: error.message }
      };
    }
  }

  /**
   * Improve writing prompt
   */
  private async improveWriting(args: any): Promise<PromptResponse> {
    try {
      const kramdown = await this.apiAdapter.callTool('siyuan_get_block_kramdown', {
        id: args.contentId
      });

      const content = kramdown?.kramdown || '';

      let focusInstruction = '';
      switch (args.focusArea) {
        case 'clarity':
          focusInstruction = 'Focus on improving clarity, removing ambiguity, and making the content easier to understand.';
          break;
        case 'grammar':
          focusInstruction = 'Focus on grammar, spelling, punctuation, and language mechanics.';
          break;
        case 'style':
          focusInstruction = 'Focus on writing style, voice, and consistency.';
          break;
        case 'structure':
          focusInstruction = 'Focus on sentence structure, paragraph organization, and logical flow.';
          break;
        case 'all':
          focusInstruction = 'Provide comprehensive writing improvements covering all aspects.';
          break;
      }

      const toneInstruction = args.tone 
        ? ` Maintain a ${args.tone} tone throughout the content.`
        : '';

      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Please review this SiYuan content and suggest improvements to enhance the writing quality. ${focusInstruction}${toneInstruction} Provide specific suggestions and examples.

Content to improve:
${content}`
          }
        }],
        metadata: {
          prompt: 'improve-writing',
          contentId: args.contentId,
          focusArea: args.focusArea,
          tone: args.tone
        }
      };
    } catch (error: any) {
      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Error improving writing for ${args.contentId}: ${error.message}`
          }
        }],
        metadata: { prompt: 'improve-writing', error: error.message }
      };
    }
  }

  /**
   * Expand content prompt
   */
  private async expandContent(args: any): Promise<PromptResponse> {
    try {
      const kramdown = await this.apiAdapter.callTool('siyuan_get_block_kramdown', {
        id: args.contentId
      });

      const content = kramdown?.kramdown || '';

      let expansionInstruction = '';
      switch (args.expansionType) {
        case 'details':
          expansionInstruction = 'Suggest additional details, specifics, and elaborations to make the content more comprehensive.';
          break;
        case 'examples':
          expansionInstruction = 'Suggest relevant examples, case studies, and illustrations to support the content.';
          break;
        case 'explanations':
          expansionInstruction = 'Suggest deeper explanations, background information, and context to enhance understanding.';
          break;
        case 'connections':
          expansionInstruction = 'Suggest connections to related topics, cross-references, and broader implications.';
          break;
        case 'research':
          expansionInstruction = 'Suggest research directions, sources, and additional information to explore.';
          break;
      }

      const lengthInstruction = `Aim for ${args.targetLength} expansions that add meaningful value.`;

      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Please analyze this SiYuan content and suggest ways to expand and enrich it. ${expansionInstruction} ${lengthInstruction}

Content to expand:
${content}`
          }
        }],
        metadata: {
          prompt: 'expand-content',
          contentId: args.contentId,
          expansionType: args.expansionType,
          targetLength: args.targetLength
        }
      };
    } catch (error: any) {
      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Error expanding content for ${args.contentId}: ${error.message}`
          }
        }],
        metadata: { prompt: 'expand-content', error: error.message }
      };
    }
  }

  /**
   * Knowledge graph prompt
   */
  private async knowledgeGraph(args: any): Promise<PromptResponse> {
    try {
      let searchResults;
      if (args.scope === 'workspace') {
        searchResults = await this.apiAdapter.callTool('siyuan_sql_query', {
          stmt: 'SELECT * FROM blocks WHERE type="d" LIMIT 50'
        });
      } else {
        searchResults = [];
      }

      const contentSample = searchResults?.slice(0, 10).map((block: any) => 
        `- ${block.content?.substring(0, 100)}...`
      ).join('\n') || 'No content found';

      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Please analyze my SiYuan ${args.scope} and create a knowledge graph visualization showing the relationships between concepts, topics, and ideas. Focus on ${args.relationshipTypes.join(', ')} relationships. Identify key nodes, connections, and clusters.

Sample content from the knowledge base:
${contentSample}`
          }
        }],
        metadata: {
          prompt: 'knowledge-graph',
          scope: args.scope,
          relationshipTypes: args.relationshipTypes,
          contentCount: searchResults?.length || 0
        }
      };
    } catch (error: any) {
      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Error generating knowledge graph: ${error.message}`
          }
        }],
        metadata: { prompt: 'knowledge-graph', error: error.message }
      };
    }
  }

  /**
   * Learning path prompt
   */
  private async learningPath(args: any): Promise<PromptResponse> {
    try {
      // Search for content related to the topic
      const searchResults = await this.apiAdapter.callTool('siyuan_fulltext_search_block', {
        query: args.topic,
        method: 0,
        types: { document: true, heading: true },
        paths: [],
        page: 1,
        pageSize: 20
      });

      const topicContent = searchResults?.blocks?.map((block: any, index: number) => 
        `${index + 1}. ${block.content?.substring(0, 150)}...`
      ).join('\n') || 'No related content found';

      let levelInstruction = '';
      switch (args.level) {
        case 'beginner':
          levelInstruction = 'Create a beginner-friendly learning path with foundational concepts first.';
          break;
        case 'intermediate':
          levelInstruction = 'Create an intermediate learning path that builds on basic knowledge.';
          break;
        case 'advanced':
          levelInstruction = 'Create an advanced learning path for deep, specialized knowledge.';
          break;
      }

      let formatInstruction = '';
      switch (args.format) {
        case 'linear':
          formatInstruction = 'Organize as a step-by-step linear progression.';
          break;
        case 'branched':
          formatInstruction = 'Create multiple learning branches for different aspects.';
          break;
        case 'modular':
          formatInstruction = 'Design modular units that can be studied independently.';
          break;
      }

      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Based on the content in my SiYuan knowledge base about "${args.topic}", please create a comprehensive learning path. ${levelInstruction} ${formatInstruction} Include prerequisites, learning objectives, and suggested study sequence.

Related content found:
${topicContent}`
          }
        }],
        metadata: {
          prompt: 'learning-path',
          topic: args.topic,
          level: args.level,
          format: args.format,
          contentCount: searchResults?.blocks?.length || 0
        }
      };
    } catch (error: any) {
      return {
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `Error creating learning path for "${args.topic}": ${error.message}`
          }
        }],
        metadata: { prompt: 'learning-path', error: error.message }
      };
    }
  }

  /**
   * Extract keywords from content (simple implementation)
   */
  private extractKeywords(content: string): string[] {
    // Simple keyword extraction - in a real implementation, this could be more sophisticated
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'will', 'would', 'could', 'should'].includes(word));
    
    // Return unique words, sorted by frequency (simplified)
    const wordCount = words.reduce((acc: Record<string, number>, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});
    
    return Object.keys(wordCount)
      .sort((a, b) => wordCount[b] - wordCount[a])
      .slice(0, 10);
  }
} 