import { marked } from 'marked';
import Fuse from 'fuse.js';

class JulesPromptCraftingPlatform {
    constructor() {
        this.prompts = [];
        this.filteredPrompts = [];
        this.categories = [];
        this.favorites = JSON.parse(localStorage.getItem('jules-favorites') || '[]');
        this.customPrompts = JSON.parse(localStorage.getItem('jules-custom-prompts') || '[]');
        this.promptHistory = JSON.parse(localStorage.getItem('jules-prompt-history') || '[]');
        this.searchIndex = null;
        this.currentView = 'browse';
        this.currentPrompt = null;
        this.analytics = JSON.parse(localStorage.getItem('jules-analytics') || '{}');
        this.init();
    }

    async init() {
        await this.loadPrompts();
        this.setupSearch();
        this.render();
        this.bindEvents();
        this.initializeAnalytics();
    }

    async loadPrompts() {
        try {
            const response = await fetch('/README.md');
            const markdown = await response.text();
            this.parseMarkdown(markdown);
            this.mergeCustomPrompts();
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
                        isFavorite: this.favorites.includes(this.generateId(promptMatch[1])),
                        isCustom: false,
                        quality: this.analyzePromptQuality(promptMatch[1]),
                        effectiveness: this.calculateEffectiveness(promptMatch[1]),
                        createdAt: new Date().toISOString(),
                        usageCount: this.analytics[this.generateId(promptMatch[1])]?.usageCount || 0
                    };
                    this.prompts.push(prompt);
                }
            }
        }

        this.filteredPrompts = [...this.prompts];
        this.setupSearchIndex();
    }

    mergeCustomPrompts() {
        this.customPrompts.forEach(customPrompt => {
            const prompt = {
                ...customPrompt,
                isFavorite: this.favorites.includes(customPrompt.id),
                isCustom: true,
                usageCount: this.analytics[customPrompt.id]?.usageCount || 0
            };
            this.prompts.push(prompt);
        });
        
        this.filteredPrompts = [...this.prompts];
        this.setupSearchIndex();
    }

    generateId(text) {
        return text.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + Date.now();
    }

    extractTags(text) {
        const techKeywords = [
            'javascript', 'js', 'typescript', 'ts', 'python', 'react', 'vue', 'angular',
            'node', 'express', 'fastapi', 'django', 'flask', 'api', 'rest', 'graphql',
            'html', 'css', 'tailwind', 'bootstrap', 'sass', 'jest', 'mocha', 'pytest',
            'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'git', 'github', 'gitlab',
            'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'debug', 'test',
            'performance', 'security', 'optimization', 'refactor', 'documentation'
        ];
        
        const lowerText = text.toLowerCase();
        return techKeywords.filter(tech => lowerText.includes(tech));
    }

    analyzePromptQuality(promptText) {
        let score = 0;
        const factors = {
            hasPlaceholders: promptText.includes('{') || promptText.includes('...'),
            properLength: promptText.length >= 15 && promptText.length <= 100,
            startsWithComment: promptText.startsWith('//'),
            hasSpecificAction: /\b(add|create|fix|debug|refactor|optimize|implement|generate)\b/i.test(promptText),
            avoidsVagueTerms: !/\b(this|that|stuff|thing)\b/i.test(promptText)
        };

        Object.values(factors).forEach(factor => {
            if (factor) score += 20;
        });

        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        return 'poor';
    }

    calculateEffectiveness(promptText) {
        // Simple effectiveness calculation based on clarity and specificity
        let effectiveness = 50;
        
        if (promptText.includes('{')) effectiveness += 15;
        if (promptText.includes('...')) effectiveness += 10;
        if (promptText.length > 20 && promptText.length < 80) effectiveness += 15;
        if (/\b(specific|detailed|comprehensive)\b/i.test(promptText)) effectiveness += 10;
        
        return Math.min(100, effectiveness);
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
        this.renderCurrentView();
    }

    handleCategoryFilter(category) {
        if (category === 'all') {
            this.filteredPrompts = [...this.prompts];
        } else if (category === 'custom') {
            this.filteredPrompts = this.prompts.filter(prompt => prompt.isCustom);
        } else if (category === 'favorites') {
            this.filteredPrompts = this.prompts.filter(prompt => prompt.isFavorite);
        } else {
            this.filteredPrompts = this.prompts.filter(prompt => prompt.category === category);
        }
        this.renderCurrentView();
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
            this.renderCurrentView();
        }
    }

    copyPrompt(promptText, promptId) {
        navigator.clipboard.writeText(promptText).then(() => {
            this.showToast('Prompt copied to clipboard!', 'success');
            this.trackUsage(promptId);
        });
    }

    trackUsage(promptId) {
        if (!this.analytics[promptId]) {
            this.analytics[promptId] = { usageCount: 0, lastUsed: null };
        }
        
        this.analytics[promptId].usageCount++;
        this.analytics[promptId].lastUsed = new Date().toISOString();
        
        localStorage.setItem('jules-analytics', JSON.stringify(this.analytics));
        
        // Update prompt usage count
        const prompt = this.prompts.find(p => p.id === promptId);
        if (prompt) {
            prompt.usageCount = this.analytics[promptId].usageCount;
        }
    }

    showToast(message, type = 'info') {
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    switchView(view) {
        this.currentView = view;
        this.render();
    }

    createNewPrompt() {
        this.currentPrompt = {
            id: this.generateId('new-prompt'),
            text: '',
            description: '',
            category: 'Custom',
            tags: [],
            isCustom: true,
            quality: 'poor',
            effectiveness: 50,
            createdAt: new Date().toISOString(),
            usageCount: 0
        };
        this.switchView('editor');
    }

    editPrompt(promptId) {
        this.currentPrompt = { ...this.prompts.find(p => p.id === promptId) };
        this.switchView('editor');
    }

    savePrompt() {
        const promptText = document.getElementById('prompt-text')?.value || '';
        const promptDesc = document.getElementById('prompt-description')?.value || '';
        const promptCategory = document.getElementById('prompt-category')?.value || 'Custom';
        
        if (!promptText.trim()) {
            this.showToast('Prompt text is required', 'error');
            return;
        }

        this.currentPrompt.text = promptText;
        this.currentPrompt.description = promptDesc;
        this.currentPrompt.category = promptCategory;
        this.currentPrompt.tags = this.extractTags(promptText + ' ' + promptDesc);
        this.currentPrompt.quality = this.analyzePromptQuality(promptText);
        this.currentPrompt.effectiveness = this.calculateEffectiveness(promptText);

        // Update or add prompt
        const existingIndex = this.prompts.findIndex(p => p.id === this.currentPrompt.id);
        if (existingIndex >= 0) {
            this.prompts[existingIndex] = this.currentPrompt;
        } else {
            this.prompts.push(this.currentPrompt);
        }

        // Update custom prompts storage
        this.customPrompts = this.prompts.filter(p => p.isCustom);
        localStorage.setItem('jules-custom-prompts', JSON.stringify(this.customPrompts));

        this.setupSearchIndex();
        this.showToast('Prompt saved successfully!', 'success');
        this.switchView('browse');
    }

    deletePrompt(promptId) {
        if (confirm('Are you sure you want to delete this prompt?')) {
            this.prompts = this.prompts.filter(p => p.id !== promptId);
            this.customPrompts = this.prompts.filter(p => p.isCustom);
            localStorage.setItem('jules-custom-prompts', JSON.stringify(this.customPrompts));
            this.setupSearchIndex();
            this.showToast('Prompt deleted successfully!', 'success');
            this.renderCurrentView();
        }
    }

    exportPrompts() {
        const exportData = {
            prompts: this.customPrompts,
            favorites: this.favorites,
            analytics: this.analytics,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jules-prompts-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('Prompts exported successfully!', 'success');
    }

    importPrompts(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importData = JSON.parse(e.target.result);
                
                if (importData.prompts) {
                    importData.prompts.forEach(prompt => {
                        if (!this.prompts.find(p => p.text === prompt.text)) {
                            this.prompts.push({ ...prompt, id: this.generateId(prompt.text) });
                        }
                    });
                    
                    this.customPrompts = this.prompts.filter(p => p.isCustom);
                    localStorage.setItem('jules-custom-prompts', JSON.stringify(this.customPrompts));
                }
                
                this.setupSearchIndex();
                this.showToast('Prompts imported successfully!', 'success');
                this.renderCurrentView();
            } catch (error) {
                this.showToast('Failed to import prompts. Invalid file format.', 'error');
            }
        };
        reader.readAsText(file);
    }

    initializeAnalytics() {
        // Initialize analytics if not present
        if (!this.analytics.initialized) {
            this.analytics = {
                initialized: true,
                totalUsage: 0,
                createdPrompts: 0,
                lastActivity: new Date().toISOString()
            };
            localStorage.setItem('jules-analytics', JSON.stringify(this.analytics));
        }
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
            'Start from Scratch': 'fas fa-rocket',
            'Performance & Optimization': 'fas fa-tachometer-alt',
            'Security': 'fas fa-shield-alt',
            'DevOps & Deployment': 'fas fa-cloud',
            'Custom': 'fas fa-star'
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
        app.innerHTML = this.renderLayout();
        this.renderCurrentView();
    }

    renderLayout() {
        return `
            <div class="min-h-screen bg-gray-50">
                <!-- Navigation -->
                <nav class="gradient-bg shadow-lg">
                    <div class="container mx-auto px-4">
                        <div class="flex items-center justify-between h-16">
                            <div class="flex items-center space-x-4">
                                <i class="fas fa-magic text-white text-2xl"></i>
                                <h1 class="text-white text-xl font-bold">Jules Prompt Crafting Platform</h1>
                            </div>
                            <div class="flex items-center space-x-4">
                                <button 
                                    onclick="app.switchView('browse')"
                                    class="px-4 py-2 rounded-lg transition-colors ${this.currentView === 'browse' ? 'bg-white text-blue-600' : 'text-white hover:bg-white hover:bg-opacity-20'}"
                                >
                                    <i class="fas fa-search mr-2"></i>Browse
                                </button>
                                <button 
                                    onclick="app.switchView('analytics')"
                                    class="px-4 py-2 rounded-lg transition-colors ${this.currentView === 'analytics' ? 'bg-white text-blue-600' : 'text-white hover:bg-white hover:bg-opacity-20'}"
                                >
                                    <i class="fas fa-chart-bar mr-2"></i>Analytics
                                </button>
                                <button 
                                    onclick="app.createNewPrompt()"
                                    class="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <i class="fas fa-plus mr-2"></i>Create Prompt
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                <!-- Main Content -->
                <div id="main-content" class="container mx-auto px-4 py-8">
                    <!-- Content will be rendered here -->
                </div>

                <!-- Floating Action Button -->
                <div class="floating-action">
                    <button 
                        onclick="app.createNewPrompt()"
                        class="bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                        title="Create New Prompt"
                    >
                        <i class="fas fa-plus text-xl"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderCurrentView() {
        const content = document.getElementById('main-content');
        if (!content) return;

        switch (this.currentView) {
            case 'browse':
                content.innerHTML = this.renderBrowseView();
                break;
            case 'editor':
                content.innerHTML = this.renderEditorView();
                break;
            case 'analytics':
                content.innerHTML = this.renderAnalyticsView();
                break;
        }

        this.bindEvents();
    }

    renderBrowseView() {
        return `
            <!-- Search and Filters -->
            <div class="mb-8">
                <div class="flex flex-col lg:flex-row gap-4 mb-6">
                    <div class="flex-1 relative">
                        <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        <input 
                            type="text" 
                            id="search-input"
                            placeholder="Search prompts by text, description, or technology..." 
                            class="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                        >
                    </div>
                    <select id="category-filter" class="px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-lg">
                        <option value="all">All Categories</option>
                        <option value="favorites">⭐ Favorites</option>
                        <option value="custom">🎨 Custom Prompts</option>
                        ${this.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                    </select>
                </div>

                <!-- Quick Actions -->
                <div class="flex flex-wrap gap-3 mb-6">
                    <button onclick="app.exportPrompts()" class="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                        <i class="fas fa-download mr-2"></i>Export Prompts
                    </button>
                    <label class="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors cursor-pointer">
                        <i class="fas fa-upload mr-2"></i>Import Prompts
                        <input type="file" accept=".json" onchange="app.importPrompts(event)" class="hidden">
                    </label>
                    <button onclick="app.handleCategoryFilter('favorites')" class="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors">
                        <i class="fas fa-star mr-2"></i>View Favorites (${this.favorites.length})
                    </button>
                </div>
            </div>

            <!-- Stats Dashboard -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="metric-card rounded-xl p-6 text-center">
                    <div class="text-3xl font-bold text-blue-600 mb-2">${this.prompts.length}</div>
                    <div class="text-gray-600">Total Prompts</div>
                </div>
                <div class="metric-card rounded-xl p-6 text-center">
                    <div class="text-3xl font-bold text-green-600 mb-2">${this.customPrompts.length}</div>
                    <div class="text-gray-600">Custom Prompts</div>
                </div>
                <div class="metric-card rounded-xl p-6 text-center">
                    <div class="text-3xl font-bold text-purple-600 mb-2">${this.favorites.length}</div>
                    <div class="text-gray-600">Favorites</div>
                </div>
                <div class="metric-card rounded-xl p-6 text-center">
                    <div class="text-3xl font-bold text-orange-600 mb-2">${this.categories.length}</div>
                    <div class="text-gray-600">Categories</div>
                </div>
            </div>

            <!-- Prompts Grid -->
            <div id="prompts-container">
                ${this.renderPrompts()}
            </div>
        `;
    }

    renderPrompts() {
        if (this.filteredPrompts.length === 0) {
            return `
                <div class="text-center py-16">
                    <i class="fas fa-search text-6xl text-gray-300 mb-6"></i>
                    <h3 class="text-2xl font-semibold text-gray-500 mb-4">No prompts found</h3>
                    <p class="text-gray-400 mb-8">Try adjusting your search criteria or create a new prompt</p>
                    <button onclick="app.createNewPrompt()" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-plus mr-2"></i>Create Your First Prompt
                    </button>
                </div>
            `;
        }

        return this.filteredPrompts.map(prompt => `
            <div class="prompt-card bg-white rounded-xl p-6 shadow-md mb-6 fade-in">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center">
                        <div class="category-icon w-12 h-12 rounded-xl flex items-center justify-center text-white mr-4">
                            <i class="${this.getCategoryIcon(prompt.category)}"></i>
                        </div>
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <span class="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">${prompt.category}</span>
                                ${prompt.isCustom ? '<span class="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full">Custom</span>' : ''}
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="quality-indicator quality-${prompt.quality}"></span>
                                <span class="text-xs text-gray-500 capitalize">${prompt.quality} Quality</span>
                                <span class="text-xs text-gray-400">•</span>
                                <span class="text-xs text-gray-500">${prompt.effectiveness}% Effective</span>
                                ${prompt.usageCount > 0 ? `<span class="text-xs text-gray-400">• Used ${prompt.usageCount}x</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button 
                            onclick="app.toggleFavorite('${prompt.id}')"
                            class="text-gray-400 hover:text-yellow-500 transition-colors p-2"
                            title="${prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
                        >
                            <i class="fas fa-star ${prompt.isFavorite ? 'text-yellow-500' : ''}"></i>
                        </button>
                        ${prompt.isCustom ? `
                            <button 
                                onclick="app.editPrompt('${prompt.id}')"
                                class="text-gray-400 hover:text-blue-500 transition-colors p-2"
                                title="Edit prompt"
                            >
                                <i class="fas fa-edit"></i>
                            </button>
                            <button 
                                onclick="app.deletePrompt('${prompt.id}')"
                                class="text-gray-400 hover:text-red-500 transition-colors p-2"
                                title="Delete prompt"
                            >
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                        <button 
                            onclick="app.copyPrompt('${prompt.text.replace(/'/g, "\\'")}', '${prompt.id}')"
                            class="text-gray-400 hover:text-green-500 transition-colors p-2"
                            title="Copy prompt"
                        >
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
                
                <div class="mb-4">
                    <code class="text-lg font-mono bg-gray-100 px-4 py-3 rounded-lg block leading-relaxed">
                        ${this.highlightMatches(prompt.text, prompt.matches)}
                    </code>
                </div>
                
                <p class="text-gray-600 mb-4 leading-relaxed">${prompt.description}</p>
                
                ${prompt.tags.length > 0 ? `
                    <div class="flex flex-wrap gap-2">
                        ${prompt.tags.map(tag => `
                            <span class="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-300 transition-colors cursor-pointer">${tag}</span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    renderEditorView() {
        const prompt = this.currentPrompt || {};
        
        return `
            <div class="max-w-4xl mx-auto">
                <div class="bg-white rounded-xl shadow-lg p-8">
                    <div class="flex items-center justify-between mb-8">
                        <h2 class="text-3xl font-bold text-gray-800">
                            <i class="fas fa-edit text-blue-600 mr-3"></i>
                            ${prompt.id ? 'Edit Prompt' : 'Create New Prompt'}
                        </h2>
                        <button 
                            onclick="app.switchView('browse')"
                            class="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>

                    <div class="space-y-6">
                        <!-- Prompt Text -->
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-3">
                                Prompt Text <span class="text-red-500">*</span>
                            </label>
                            <div class="editor-container">
                                <textarea 
                                    id="prompt-text"
                                    placeholder="// Enter your Jules prompt here..."
                                    class="w-full p-4 border-0 focus:ring-0 font-mono text-lg resize-none"
                                    rows="4"
                                    oninput="app.updatePromptPreview()"
                                >${prompt.text || ''}</textarea>
                            </div>
                            <div class="mt-2 text-sm text-gray-500">
                                <span id="char-count">0</span> characters • 
                                Use {placeholders} for customizable parts
                            </div>
                        </div>

                        <!-- Description -->
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-3">Description</label>
                            <textarea 
                                id="prompt-description"
                                placeholder="Describe when and how to use this prompt..."
                                class="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows="3"
                            >${prompt.description || ''}</textarea>
                        </div>

                        <!-- Category and Tags -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-3">Category</label>
                                <select 
                                    id="prompt-category"
                                    class="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Custom">Custom</option>
                                    ${this.categories.map(cat => `
                                        <option value="${cat}" ${prompt.category === cat ? 'selected' : ''}>${cat}</option>
                                    `).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-3">Auto-detected Tags</label>
                                <div id="tags-preview" class="p-4 border border-gray-300 rounded-lg bg-gray-50 min-h-[56px] flex flex-wrap gap-2">
                                    <!-- Tags will be populated by JavaScript -->
                                </div>
                            </div>
                        </div>

                        <!-- Quality Metrics -->
                        <div class="bg-gray-50 rounded-lg p-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">Quality Analysis</h3>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div class="text-center">
                                    <div id="quality-score" class="text-2xl font-bold text-gray-600 mb-1">-</div>
                                    <div class="text-sm text-gray-500">Quality Score</div>
                                </div>
                                <div class="text-center">
                                    <div id="effectiveness-score" class="text-2xl font-bold text-gray-600 mb-1">-</div>
                                    <div class="text-sm text-gray-500">Effectiveness</div>
                                </div>
                                <div class="text-center">
                                    <div id="length-score" class="text-2xl font-bold text-gray-600 mb-1">-</div>
                                    <div class="text-sm text-gray-500">Length</div>
                                </div>
                            </div>
                            <div id="quality-suggestions" class="mt-4 space-y-2">
                                <!-- Suggestions will be populated by JavaScript -->
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="flex justify-between pt-6 border-t">
                            <button 
                                onclick="app.switchView('browse')"
                                class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onclick="app.savePrompt()"
                                class="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <i class="fas fa-save mr-2"></i>Save Prompt
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderAnalyticsView() {
        const totalUsage = Object.values(this.analytics).reduce((sum, data) => {
            return sum + (data.usageCount || 0);
        }, 0);

        const topPrompts = this.prompts
            .filter(p => p.usageCount > 0)
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, 5);

        const qualityDistribution = this.prompts.reduce((acc, prompt) => {
            acc[prompt.quality] = (acc[prompt.quality] || 0) + 1;
            return acc;
        }, {});

        return `
            <div class="space-y-8">
                <div class="text-center">
                    <h2 class="text-3xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-chart-bar text-blue-600 mr-3"></i>
                        Analytics Dashboard
                    </h2>
                    <p class="text-gray-600">Insights into your prompt usage and effectiveness</p>
                </div>

                <!-- Key Metrics -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div class="metric-card rounded-xl p-6 text-center">
                        <div class="text-3xl font-bold text-blue-600 mb-2">${totalUsage}</div>
                        <div class="text-gray-600">Total Usage</div>
                    </div>
                    <div class="metric-card rounded-xl p-6 text-center">
                        <div class="text-3xl font-bold text-green-600 mb-2">${this.customPrompts.length}</div>
                        <div class="text-gray-600">Created Prompts</div>
                    </div>
                    <div class="metric-card rounded-xl p-6 text-center">
                        <div class="text-3xl font-bold text-purple-600 mb-2">${Math.round(this.prompts.reduce((sum, p) => sum + p.effectiveness, 0) / this.prompts.length)}%</div>
                        <div class="text-gray-600">Avg Effectiveness</div>
                    </div>
                    <div class="metric-card rounded-xl p-6 text-center">
                        <div class="text-3xl font-bold text-orange-600 mb-2">${this.favorites.length}</div>
                        <div class="text-gray-600">Favorites</div>
                    </div>
                </div>

                <!-- Charts Row -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- Quality Distribution -->
                    <div class="bg-white rounded-xl p-6 shadow-lg">
                        <h3 class="text-xl font-semibold text-gray-800 mb-6">Quality Distribution</h3>
                        <div class="space-y-4">
                            ${Object.entries(qualityDistribution).map(([quality, count]) => `
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center">
                                        <span class="quality-indicator quality-${quality}"></span>
                                        <span class="capitalize font-medium">${quality}</span>
                                    </div>
                                    <div class="flex items-center">
                                        <div class="w-32 bg-gray-200 rounded-full h-2 mr-3">
                                            <div class="bg-blue-600 h-2 rounded-full" style="width: ${(count / this.prompts.length) * 100}%"></div>
                                        </div>
                                        <span class="text-sm font-medium">${count}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Top Used Prompts -->
                    <div class="bg-white rounded-xl p-6 shadow-lg">
                        <h3 class="text-xl font-semibold text-gray-800 mb-6">Most Used Prompts</h3>
                        <div class="space-y-4">
                            ${topPrompts.length > 0 ? topPrompts.map((prompt, index) => `
                                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div class="flex items-center">
                                        <span class="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">${index + 1}</span>
                                        <div>
                                            <div class="font-medium text-sm truncate max-w-xs">${prompt.text}</div>
                                            <div class="text-xs text-gray-500">${prompt.category}</div>
                                        </div>
                                    </div>
                                    <span class="text-sm font-bold text-blue-600">${prompt.usageCount}x</span>
                                </div>
                            `).join('') : '<p class="text-gray-500 text-center py-8">No usage data yet</p>'}
                        </div>
                    </div>
                </div>

                <!-- Category Breakdown -->
                <div class="bg-white rounded-xl p-6 shadow-lg">
                    <h3 class="text-xl font-semibold text-gray-800 mb-6">Category Breakdown</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${this.categories.map(category => {
                            const categoryPrompts = this.prompts.filter(p => p.category === category);
                            const categoryUsage = categoryPrompts.reduce((sum, p) => sum + p.usageCount, 0);
                            return `
                                <div class="p-4 border border-gray-200 rounded-lg">
                                    <div class="flex items-center mb-2">
                                        <i class="${this.getCategoryIcon(category)} text-blue-600 mr-2"></i>
                                        <span class="font-medium text-sm">${category}</span>
                                    </div>
                                    <div class="text-2xl font-bold text-gray-800">${categoryPrompts.length}</div>
                                    <div class="text-xs text-gray-500">${categoryUsage} total uses</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    updatePromptPreview() {
        const promptText = document.getElementById('prompt-text')?.value || '';
        const charCount = document.getElementById('char-count');
        const qualityScore = document.getElementById('quality-score');
        const effectivenessScore = document.getElementById('effectiveness-score');
        const lengthScore = document.getElementById('length-score');
        const tagsPreview = document.getElementById('tags-preview');
        const qualitySuggestions = document.getElementById('quality-suggestions');

        if (charCount) charCount.textContent = promptText.length;

        if (promptText) {
            const quality = this.analyzePromptQuality(promptText);
            const effectiveness = this.calculateEffectiveness(promptText);
            const tags = this.extractTags(promptText);

            if (qualityScore) qualityScore.textContent = quality.toUpperCase();
            if (effectivenessScore) effectivenessScore.textContent = effectiveness + '%';
            if (lengthScore) lengthScore.textContent = promptText.length;

            if (tagsPreview) {
                tagsPreview.innerHTML = tags.length > 0 
                    ? tags.map(tag => `<span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">${tag}</span>`).join('')
                    : '<span class="text-gray-400 text-sm">No tags detected</span>';
            }

            if (qualitySuggestions) {
                const suggestions = this.generateQualitySuggestions(promptText);
                qualitySuggestions.innerHTML = suggestions.map(suggestion => 
                    `<div class="text-sm text-gray-600"><i class="fas fa-lightbulb text-yellow-500 mr-2"></i>${suggestion}</div>`
                ).join('');
            }
        }
    }

    generateQualitySuggestions(promptText) {
        const suggestions = [];
        
        if (!promptText.startsWith('//')) {
            suggestions.push('Consider starting with "//" to follow Jules prompt conventions');
        }
        
        if (!promptText.includes('{') && !promptText.includes('...')) {
            suggestions.push('Add placeholders like {specific item} or ellipsis (...) for flexibility');
        }
        
        if (promptText.length < 15) {
            suggestions.push('Prompt might be too short - consider adding more context');
        }
        
        if (promptText.length > 100) {
            suggestions.push('Prompt might be too long - consider making it more concise');
        }
        
        if (/\b(this|that|stuff|thing)\b/i.test(promptText)) {
            suggestions.push('Replace vague terms like "this" or "stuff" with specific descriptions');
        }
        
        if (suggestions.length === 0) {
            suggestions.push('Great! Your prompt follows best practices');
        }
        
        return suggestions;
    }

    bindEvents() {
        this.setupSearch();
        
        // Update prompt preview in real-time
        const promptTextArea = document.getElementById('prompt-text');
        if (promptTextArea) {
            promptTextArea.addEventListener('input', () => this.updatePromptPreview());
            this.updatePromptPreview(); // Initial update
        }
    }
}

// Initialize the app
window.app = new JulesPromptCraftingPlatform();