import { marked } from 'marked';
import Fuse from 'fuse.js';

class JulesPromptsApp {
    constructor() {
        this.prompts = [];
        this.filteredPrompts = [];
        this.categories = [];
        this.favorites = JSON.parse(localStorage.getItem('jules-favorites') || '[]');
        this.searchIndex = null;
        this.init();
    }

    async init() {
        await this.loadPrompts();
        this.setupSearch();
        this.render();
        this.bindEvents();
    }

    async loadPrompts() {
        try {
            const response = await fetch('/README.md');
            const markdown = await response.text();
            this.parseMarkdown(markdown);
        } catch (error) {
            console.error('Failed to load prompts:', error);
        }
    }

    parseMarkdown(markdown) {
        const lines = markdown.split('\n');
        let currentCategory = '';
        let inPromptsSection = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip until we reach the first category
            if (line.startsWith('## ') && !line.includes('Table of Contents')) {
                currentCategory = line.replace('## ', '').trim();
                inPromptsSection = true;
                if (!this.categories.includes(currentCategory)) {
                    this.categories.push(currentCategory);
                }
                continue;
            }

            if (inPromptsSection && line.startsWith('- `')) {
                const promptMatch = line.match(/- `([^`]+)`/);
                const descMatch = lines[i + 1]?.match(/<sub>([^<]+)<\/sub>/);
                
                if (promptMatch) {
                    const prompt = {
                        id: this.generateId(promptMatch[1]),
                        text: promptMatch[1],
                        description: descMatch ? descMatch[1] : '',
                        category: currentCategory,
                        tags: this.extractTags(promptMatch[1] + ' ' + (descMatch?.[1] || '')),
                        isFavorite: this.favorites.includes(this.generateId(promptMatch[1]))
                    };
                    this.prompts.push(prompt);
                }
            }
        }

        this.filteredPrompts = [...this.prompts];
        this.setupSearchIndex();
    }

    generateId(text) {
        return text.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    }

    extractTags(text) {
        const commonTags = ['javascript', 'python', 'react', 'api', 'test', 'debug', 'async', 'performance'];
        return commonTags.filter(tag => text.toLowerCase().includes(tag));
    }

    setupSearchIndex() {
        const options = {
            keys: ['text', 'description', 'category', 'tags'],
            threshold: 0.3,
            includeMatches: true
        };
        this.searchIndex = new Fuse(this.prompts, options);
    }

    setupSearch() {
        const searchInput = document.getElementById('search-input');
        const categoryFilter = document.getElementById('category-filter');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => this.handleCategoryFilter(e.target.value));
        }
    }

    handleSearch(query) {
        if (!query.trim()) {
            this.filteredPrompts = [...this.prompts];
        } else {
            const results = this.searchIndex.search(query);
            this.filteredPrompts = results.map(result => ({
                ...result.item,
                matches: result.matches
            }));
        }
        this.renderPrompts();
    }

    handleCategoryFilter(category) {
        if (category === 'all') {
            this.filteredPrompts = [...this.prompts];
        } else {
            this.filteredPrompts = this.prompts.filter(prompt => prompt.category === category);
        }
        this.renderPrompts();
    }

    toggleFavorite(promptId) {
        const prompt = this.prompts.find(p => p.id === promptId);
        if (prompt) {
            prompt.isFavorite = !prompt.isFavorite;
            
            if (prompt.isFavorite) {
                this.favorites.push(promptId);
            } else {
                this.favorites = this.favorites.filter(id => id !== promptId);
            }
            
            localStorage.setItem('jules-favorites', JSON.stringify(this.favorites));
            this.renderPrompts();
        }
    }

    copyPrompt(promptText) {
        navigator.clipboard.writeText(promptText).then(() => {
            this.showToast('Prompt copied to clipboard!');
        });
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    getCategoryIcon(category) {
        const icons = {
            'Everyday Dev Tasks': 'fas fa-code',
            'Debugging': 'fas fa-bug',
            'Documentation': 'fas fa-book',
            'Testing': 'fas fa-vial',
            'Package Management': 'fas fa-box',
            'AI-Native Tasks': 'fas fa-robot',
            'Context': 'fas fa-info-circle',
            'Fun & Experimental': 'fas fa-flask',
            'Start from Scratch': 'fas fa-rocket'
        };
        return icons[category] || 'fas fa-folder';
    }

    highlightMatches(text, matches) {
        if (!matches) return text;
        
        let highlightedText = text;
        matches.forEach(match => {
            if (match.key === 'text') {
                match.indices.forEach(([start, end]) => {
                    const before = text.substring(0, start);
                    const highlighted = text.substring(start, end + 1);
                    const after = text.substring(end + 1);
                    highlightedText = before + `<span class="search-highlight">${highlighted}</span>` + after;
                });
            }
        });
        
        return highlightedText;
    }

    render() {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="container mx-auto px-4 py-8">
                <!-- Header -->
                <div class="text-center mb-12">
                    <h1 class="text-5xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-star text-yellow-500"></i>
                        Awesome Jules Prompts
                    </h1>
                    <p class="text-xl text-gray-600 mb-8">Interactive browser for Jules AI coding prompts</p>
                    
                    <!-- Search and Filters -->
                    <div class="max-w-4xl mx-auto mb-8">
                        <div class="flex flex-col md:flex-row gap-4">
                            <div class="flex-1 relative">
                                <i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                <input 
                                    type="text" 
                                    id="search-input"
                                    placeholder="Search prompts..." 
                                    class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                            </div>
                            <select id="category-filter" class="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                <option value="all">All Categories</option>
                                ${this.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <!-- Stats -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
                        <div class="bg-white rounded-lg p-6 shadow-md">
                            <div class="text-3xl font-bold text-blue-600">${this.prompts.length}</div>
                            <div class="text-gray-600">Total Prompts</div>
                        </div>
                        <div class="bg-white rounded-lg p-6 shadow-md">
                            <div class="text-3xl font-bold text-green-600">${this.categories.length}</div>
                            <div class="text-gray-600">Categories</div>
                        </div>
                        <div class="bg-white rounded-lg p-6 shadow-md">
                            <div class="text-3xl font-bold text-purple-600">${this.favorites.length}</div>
                            <div class="text-gray-600">Favorites</div>
                        </div>
                    </div>
                </div>

                <!-- Prompts Grid -->
                <div id="prompts-container">
                    ${this.renderPrompts()}
                </div>
            </div>
        `;
    }

    renderPrompts() {
        const container = document.getElementById('prompts-container');
        if (!container) return '';

        const promptsHtml = this.filteredPrompts.map(prompt => `
            <div class="prompt-card bg-white rounded-lg p-6 shadow-md mb-6 fade-in">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center">
                        <div class="category-icon w-10 h-10 rounded-full flex items-center justify-center text-white mr-3">
                            <i class="${this.getCategoryIcon(prompt.category)}"></i>
                        </div>
                        <div>
                            <span class="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">${prompt.category}</span>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button 
                            onclick="app.toggleFavorite('${prompt.id}')"
                            class="text-gray-400 hover:text-yellow-500 transition-colors"
                            title="${prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
                        >
                            <i class="fas fa-star ${prompt.isFavorite ? 'text-yellow-500' : ''}"></i>
                        </button>
                        <button 
                            onclick="app.copyPrompt('${prompt.text.replace(/'/g, "\\'")}')"
                            class="text-gray-400 hover:text-blue-500 transition-colors"
                            title="Copy prompt"
                        >
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
                
                <div class="mb-3">
                    <code class="text-lg font-mono bg-gray-100 px-3 py-2 rounded block">
                        ${this.highlightMatches(prompt.text, prompt.matches)}
                    </code>
                </div>
                
                <p class="text-gray-600 mb-3">${prompt.description}</p>
                
                ${prompt.tags.length > 0 ? `
                    <div class="flex flex-wrap gap-2">
                        ${prompt.tags.map(tag => `
                            <span class="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">${tag}</span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');

        container.innerHTML = promptsHtml || `
            <div class="text-center py-12">
                <i class="fas fa-search text-6xl text-gray-300 mb-4"></i>
                <p class="text-xl text-gray-500">No prompts found matching your criteria</p>
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        // Re-bind search events after rendering
        this.setupSearch();
    }
}

// Initialize the app
window.app = new JulesPromptsApp();