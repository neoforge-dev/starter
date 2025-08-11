import * as markedModule from '/vendor/marked.min.js';
const marked = markedModule.default || markedModule;
import { Logger } from '../utils/logger.js';

class DocsService {
  constructor() {
    this.baseUrl = '/docs';
    this.cache = new Map();
  }

  /**
   * Fetches and processes a documentation file
   * @param {string} path - Path to the documentation file
   * @returns {Promise<{content: string, title: string, toc: Array}>}
   */
  async getDoc(path) {
    try {
      // Check cache first
      const cached = this.cache.get(path);
      if (cached) {
        return cached;
      }

      // Fetch the document
      const response = await fetch(`${this.baseUrl}/${path}`);
      if (!response.ok) {
        throw new Error(`Failed to load document: ${response.statusText}`);
      }

      const markdown = await response.text();
      const { content, frontMatter } = this._extractFrontMatter(markdown);
      const processedContent = await this._processMarkdown(content);
      const toc = this._generateToc(content);

      const result = {
        content: processedContent,
        title: frontMatter.title || this._generateTitle(path),
        toc
      };

      // Cache the result
      this.cache.set(path, result);

      return result;
    } catch (error) {
      Logger.error('Failed to fetch document:', error);
      throw error;
    }
  }

  /**
   * Extracts front matter from markdown content
   * @param {string} markdown 
   * @returns {{content: string, frontMatter: Object}}
   */
  _extractFrontMatter(markdown) {
    const frontMatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = markdown.match(frontMatterRegex);

    if (!match) {
      return { content: markdown, frontMatter: {} };
    }

    try {
      const frontMatter = {};
      const frontMatterContent = match[1];
      frontMatterContent.split('\n').forEach(line => {
        const [key, ...values] = line.split(':');
        if (key && values.length) {
          frontMatter[key.trim()] = values.join(':').trim();
        }
      });

      return {
        content: match[2],
        frontMatter
      };
    } catch (error) {
      Logger.warn('Failed to parse front matter:', error);
      return { content: markdown, frontMatter: {} };
    }
  }

  /**
   * Processes markdown content
   * @param {string} markdown 
   * @returns {Promise<string>}
   */
  async _processMarkdown(markdown) {
    try {
      const escapeHtml = this._escapeHtml.bind(this);
      // Create a custom renderer
      const renderer = new marked.Renderer();
      renderer.code = (code, infostring) => {
        const langMatch = (infostring || '').match(/\S*/);
        const lang = langMatch ? langMatch[0] : 'plaintext';
        return `<code-snippet language="${lang}" code="${escapeHtml(code)}"></code-snippet>`;
      };
      
      // Parse the markdown with custom renderer and options
      const html = marked.parse(markdown, {
        renderer: renderer,
        headerIds: true,
        mangle: false
      });
      return html;
    } catch (error) {
      Logger.error('Failed to process markdown:', error);
      throw error;
    }
  }

  /**
   * Generates a table of contents from markdown content
   * @param {string} markdown 
   * @returns {Array<{text: string, level: number, id: string}>}
   */
  _generateToc(markdown) {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const toc = [];
    let match;

    while ((match = headingRegex.exec(markdown)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const id = text.toLowerCase().replace(/[^\w]+/g, '-');

      toc.push({
        text,
        level,
        id
      });
    }

    return toc;
  }

  /**
   * Generates a title from the document path
   * @param {string} path 
   * @returns {string}
   */
  _generateTitle(path) {
    const basename = path.split('/').pop().replace('.md', '');
    return basename
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Escapes HTML special characters
   * @param {string} html 
   * @returns {string}
   */
  _escapeHtml(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  /**
   * Searches documentation content
   * @param {string} query 
   * @returns {Promise<Array>}
   */
  async search(query) {
    try {
      const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const results = await response.json();
      return results;
    } catch (error) {
      Logger.error('Search failed:', error);
      throw error;
    }
  }

  /**
   * Clears the document cache
   */
  clearCache() {
    this.cache.clear();
  }
}

export const docsService = new DocsService();

