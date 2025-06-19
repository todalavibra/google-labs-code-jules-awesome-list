#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const natural = require('natural');

class PromptOptimizer {
    constructor() {
        this.prompts = [];
        this.optimizations = [];
        this.stemmer = natural.PorterStemmer;
    }

    async optimize() {
        console.log(chalk.blue('🚀 Jules Prompt Optimization Engine\n'));
        
        await this.loadPrompts();
        this.analyzePrompts();
        this.generateOptimizations();
        this.suggestImprovements();
        this.generateOptimizationReport();
    }

    async loadPrompts() {
        const readmePath = path.join(process.cwd(), 'README.md');
        const content = fs.readFileSync(readmePath, 'utf8');
        
        const lines = content.split('\n');
        let currentCategory = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('## ') && !line.includes('Table of Contents')) {
                currentCategory = line.replace('## ', '').trim();
                continue;
            }

            if (line.startsWith('- `')) {
                const promptMatch = line.match(/- `([^`]+)`/);
                const descMatch = lines[i + 1]?.match(/<sub>([^<]+)<\/sub>/);
                
                if (promptMatch) {
                    this.prompts.push({
                        text: promptMatch[1],
                        description: descMatch ? descMatch[1] : '',
                        category: currentCategory,
                        lineNumber: i + 1,
                        tokens: this.tokenize(promptMatch[1]),
                        sentiment: this.analyzeSentiment(promptMatch[1])
                    });
                }
            }
        }

        console.log(chalk.green(`✅ Loaded ${this.prompts.length} prompts for optimization\n`));
    }

    tokenize(text) {
        return natural.WordTokenizer.tokenize(text.toLowerCase())
            .filter(token => token.length > 2)
            .map(token => this.stemmer.stem(token));
    }

    analyzeSentiment(text) {
        // Simple sentiment analysis
        const positiveWords = ['add', 'create', 'build', 'improve', 'optimize', 'enhance', 'generate'];
        const negativeWords = ['fix', 'debug', 'remove', 'delete', 'error', 'problem', 'issue'];
        
        const words = text.toLowerCase().split(/\s+/);
        let score = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) score += 1;
            if (negativeWords.includes(word)) score -= 0.5; // Debugging is still valuable
        });
        
        return score;
    }

    analyzePrompts() {
        console.log(chalk.yellow('🔍 Analyzing prompt patterns...\n'));

        // Find common patterns
        const tokenFrequency = {};
        const categoryPatterns = {};
        
        this.prompts.forEach(prompt => {
            prompt.tokens.forEach(token => {
                tokenFrequency[token] = (tokenFrequency[token] || 0) + 1;
            });
            
            if (!categoryPatterns[prompt.category]) {
                categoryPatterns[prompt.category] = [];
            }
            categoryPatterns[prompt.category].push(prompt.tokens);
        });

        // Identify overused terms
        const totalTokens = Object.values(tokenFrequency).reduce((sum, count) => sum + count, 0);
        const overusedTerms = Object.entries(tokenFrequency)
            .filter(([token, count]) => count / totalTokens > 0.05)
            .map(([token]) => token);

        console.log(chalk.blue('📊 Analysis Results:'));
        console.log(chalk.blue(`   Most common terms: ${Object.entries(tokenFrequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([token, count]) => `${token}(${count})`)
            .join(', ')}`));
        
        if (overusedTerms.length > 0) {
            console.log(chalk.yellow(`   ⚠️  Potentially overused: ${overusedTerms.join(', ')}`));
        }
        console.log();
    }

    generateOptimizations() {
        console.log(chalk.yellow('⚡ Generating optimizations...\n'));

        this.prompts.forEach(prompt => {
            const optimizations = [];

            // Length optimization
            if (prompt.text.length > 80) {
                optimizations.push({
                    type: 'length',
                    severity: 'medium',
                    suggestion: 'Consider shortening this prompt for better readability',
                    original: prompt.text,
                    optimized: this.shortenPrompt(prompt.text)
                });
            }

            // Clarity optimization
            if (this.hasVagueTerms(prompt.text)) {
                optimizations.push({
                    type: 'clarity',
                    severity: 'high',
                    suggestion: 'Replace vague terms with specific descriptions',
                    original: prompt.text,
                    optimized: this.clarifyPrompt(prompt.text)
                });
            }

            // Placeholder optimization
            if (!prompt.text.includes('{') && !prompt.text.includes('...')) {
                optimizations.push({
                    type: 'flexibility',
                    severity: 'low',
                    suggestion: 'Add placeholders to make this prompt more flexible',
                    original: prompt.text,
                    optimized: this.addPlaceholders(prompt.text)
                });
            }

            // Action verb optimization
            if (!this.hasStrongActionVerb(prompt.text)) {
                optimizations.push({
                    type: 'action',
                    severity: 'medium',
                    suggestion: 'Use stronger action verbs for clearer intent',
                    original: prompt.text,
                    optimized: this.strengthenAction(prompt.text)
                });
            }

            if (optimizations.length > 0) {
                this.optimizations.push({
                    prompt,
                    optimizations
                });
            }
        });
    }

    hasVagueTerms(text) {
        return /\b(this|that|stuff|thing|something|anything)\b/i.test(text);
    }

    hasStrongActionVerb(text) {
        return /\b(create|build|implement|generate|add|write|develop|design|construct)\b/i.test(text);
    }

    shortenPrompt(text) {
        // Simple shortening by removing redundant words
        return text
            .replace(/\b(please|kindly|could you)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    clarifyPrompt(text) {
        return text
            .replace(/\bthis\b/gi, '{specific item}')
            .replace(/\bthat\b/gi, '{specific element}')
            .replace(/\bstuff\b/gi, '{content}')
            .replace(/\bthing\b/gi, '{component}');
    }

    addPlaceholders(text) {
        // Add placeholders to common patterns
        return text
            .replace(/\bfile\b/gi, '{specific file}')
            .replace(/\bfunction\b/gi, '{function name}')
            .replace(/\bcomponent\b/gi, '{component name}')
            .replace(/\bAPI\b/gi, '{API endpoint}');
    }

    strengthenAction(text) {
        return text
            .replace(/^\/\/ Make/, '// Create')
            .replace(/^\/\/ Do/, '// Implement')
            .replace(/^\/\/ Handle/, '// Process')
            .replace(/^\/\/ Work with/, '// Integrate');
    }

    suggestImprovements() {
        console.log(chalk.green('💡 Optimization Suggestions:\n'));

        this.optimizations.forEach(({ prompt, optimizations }) => {
            console.log(chalk.white(`📝 Line ${prompt.lineNumber}: "${prompt.text}"`));
            
            optimizations.forEach(opt => {
                const severityColor = opt.severity === 'high' ? chalk.red : 
                                    opt.severity === 'medium' ? chalk.yellow : chalk.blue;
                
                console.log(severityColor(`   ${opt.severity.toUpperCase()}: ${opt.suggestion}`));
                console.log(chalk.gray(`   Suggested: "${opt.optimized}"`));
            });
            console.log();
        });
    }

    generateOptimizationReport() {
        const report = {
            summary: {
                totalPrompts: this.prompts.length,
                promptsNeedingOptimization: this.optimizations.length,
                optimizationRate: Math.round((this.optimizations.length / this.prompts.length) * 100),
                commonIssues: this.getCommonIssues()
            },
            optimizations: this.optimizations.map(opt => ({
                prompt: opt.prompt.text,
                category: opt.prompt.category,
                lineNumber: opt.prompt.lineNumber,
                issues: opt.optimizations.map(o => ({
                    type: o.type,
                    severity: o.severity,
                    suggestion: o.suggestion,
                    optimized: o.optimized
                }))
            })),
            recommendations: this.generateRecommendations(),
            timestamp: new Date().toISOString()
        };

        fs.writeFileSync('optimization-report.json', JSON.stringify(report, null, 2));
        
        console.log(chalk.green('\n📊 OPTIMIZATION SUMMARY\n'));
        console.log(chalk.green(`✅ Total Prompts Analyzed: ${report.summary.totalPrompts}`));
        console.log(chalk.yellow(`🔧 Prompts Needing Optimization: ${report.summary.promptsNeedingOptimization}`));
        console.log(chalk.blue(`📈 Optimization Rate: ${report.summary.optimizationRate}%`));
        
        console.log(chalk.blue('\n🎯 Common Issues:'));
        report.summary.commonIssues.forEach(issue => {
            console.log(chalk.blue(`   • ${issue.type}: ${issue.count} occurrences`));
        });

        console.log(chalk.blue('\n💡 Top Recommendations:'));
        report.recommendations.slice(0, 5).forEach((rec, index) => {
            console.log(chalk.blue(`   ${index + 1}. ${rec}`));
        });

        console.log(chalk.green('\n📄 Detailed report saved to optimization-report.json'));
    }

    getCommonIssues() {
        const issues = {};
        
        this.optimizations.forEach(({ optimizations }) => {
            optimizations.forEach(opt => {
                issues[opt.type] = (issues[opt.type] || 0) + 1;
            });
        });

        return Object.entries(issues)
            .sort(([,a], [,b]) => b - a)
            .map(([type, count]) => ({ type, count }));
    }

    generateRecommendations() {
        const recommendations = [
            'Use specific placeholders like {file name} instead of generic terms',
            'Start prompts with strong action verbs (create, implement, generate)',
            'Keep prompts between 20-80 characters for optimal readability',
            'Include context about when to use each prompt',
            'Avoid vague terms like "this", "that", "stuff"',
            'Add ellipsis (...) for open-ended prompts',
            'Group related prompts in logical categories',
            'Test prompts with Jules before adding to collection',
            'Include technology-specific keywords for better searchability',
            'Provide clear descriptions for complex prompts'
        ];

        return recommendations;
    }
}

// Run optimization
const optimizer = new PromptOptimizer();
optimizer.optimize();