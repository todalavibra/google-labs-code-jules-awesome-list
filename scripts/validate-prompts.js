#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class PromptValidator {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.prompts = [];
    }

    async validate() {
        console.log(chalk.blue('🔍 Validating Jules Prompts...\n'));

        try {
            await this.loadAndParseReadme();
            this.validatePromptStructure();
            this.validatePromptContent();
            this.checkForDuplicates();
            this.validateCategories();
            this.generateReport();
        } catch (error) {
            console.error(chalk.red('❌ Validation failed:'), error.message);
            process.exit(1);
        }
    }

    async loadAndParseReadme() {
        const readmePath = path.join(process.cwd(), 'README.md');
        
        if (!fs.existsSync(readmePath)) {
            throw new Error('README.md not found');
        }

        const content = fs.readFileSync(readmePath, 'utf8');
        this.parsePrompts(content);
    }

    parsePrompts(content) {
        const lines = content.split('\n');
        let currentCategory = '';
        let lineNumber = 0;

        for (const line of lines) {
            lineNumber++;
            
            if (line.startsWith('## ') && !line.includes('Table of Contents')) {
                currentCategory = line.replace('## ', '').trim();
                continue;
            }

            if (line.trim().startsWith('- `')) {
                const promptMatch = line.match(/- `([^`]+)`/);
                if (promptMatch) {
                    this.prompts.push({
                        text: promptMatch[1],
                        category: currentCategory,
                        lineNumber,
                        fullLine: line
                    });
                }
            }
        }
    }

    validatePromptStructure() {
        this.prompts.forEach(prompt => {
            // Check for proper formatting
            if (!prompt.text.startsWith('//')) {
                this.warnings.push(`Line ${prompt.lineNumber}: Prompt should start with '//' - "${prompt.text}"`);
            }

            // Check for placeholder syntax
            if (!prompt.text.includes('{') && !prompt.text.includes('...')) {
                this.warnings.push(`Line ${prompt.lineNumber}: Consider adding placeholders {like this} or ellipsis - "${prompt.text}"`);
            }

            // Check length
            if (prompt.text.length > 100) {
                this.warnings.push(`Line ${prompt.lineNumber}: Prompt might be too long (${prompt.text.length} chars) - "${prompt.text}"`);
            }

            if (prompt.text.length < 10) {
                this.warnings.push(`Line ${prompt.lineNumber}: Prompt might be too short - "${prompt.text}"`);
            }
        });
    }

    validatePromptContent() {
        const commonIssues = [
            { pattern: /\bthis\b/g, message: 'Consider being more specific than "this"' },
            { pattern: /\bstuff\b/g, message: 'Avoid vague terms like "stuff"' },
            { pattern: /\bthing\b/g, message: 'Avoid vague terms like "thing"' },
        ];

        this.prompts.forEach(prompt => {
            commonIssues.forEach(issue => {
                if (issue.pattern.test(prompt.text)) {
                    this.warnings.push(`Line ${prompt.lineNumber}: ${issue.message} - "${prompt.text}"`);
                }
            });
        });
    }

    checkForDuplicates() {
        const seen = new Map();
        
        this.prompts.forEach(prompt => {
            const normalized = prompt.text.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            if (seen.has(normalized)) {
                this.errors.push(`Duplicate prompt detected:\n  Line ${seen.get(normalized)}: "${seen.get(normalized + '_text')}"\n  Line ${prompt.lineNumber}: "${prompt.text}"`);
            } else {
                seen.set(normalized, prompt.lineNumber);
                seen.set(normalized + '_text', prompt.text);
            }
        });
    }

    validateCategories() {
        const categories = [...new Set(this.prompts.map(p => p.category))];
        const expectedCategories = [
            'Everyday Dev Tasks',
            'Debugging',
            'Documentation',
            'Testing',
            'Package Management',
            'AI-Native Tasks',
            'Context',
            'Fun & Experimental',
            'Start from Scratch'
        ];

        categories.forEach(category => {
            if (!expectedCategories.includes(category)) {
                this.warnings.push(`Unexpected category: "${category}"`);
            }
        });

        // Check for empty categories
        categories.forEach(category => {
            const promptsInCategory = this.prompts.filter(p => p.category === category);
            if (promptsInCategory.length === 0) {
                this.warnings.push(`Empty category: "${category}"`);
            }
        });
    }

    generateReport() {
        console.log(chalk.green(`✅ Found ${this.prompts.length} prompts across ${[...new Set(this.prompts.map(p => p.category))].length} categories\n`));

        if (this.errors.length > 0) {
            console.log(chalk.red('❌ ERRORS:'));
            this.errors.forEach(error => console.log(chalk.red(`  ${error}`)));
            console.log();
        }

        if (this.warnings.length > 0) {
            console.log(chalk.yellow('⚠️  WARNINGS:'));
            this.warnings.forEach(warning => console.log(chalk.yellow(`  ${warning}`)));
            console.log();
        }

        // Category breakdown
        const categoryStats = {};
        this.prompts.forEach(prompt => {
            categoryStats[prompt.category] = (categoryStats[prompt.category] || 0) + 1;
        });

        console.log(chalk.blue('📊 CATEGORY BREAKDOWN:'));
        Object.entries(categoryStats)
            .sort(([,a], [,b]) => b - a)
            .forEach(([category, count]) => {
                console.log(chalk.blue(`  ${category}: ${count} prompts`));
            });

        if (this.errors.length > 0) {
            console.log(chalk.red('\n❌ Validation failed with errors'));
            process.exit(1);
        } else {
            console.log(chalk.green('\n✅ All validations passed!'));
        }
    }
}

// Run validation
const validator = new PromptValidator();
validator.validate();