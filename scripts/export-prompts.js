#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { program } = require('commander');

class PromptExporter {
    constructor() {
        this.prompts = [];
    }

    async export(format, options = {}) {
        console.log(chalk.blue(`📤 Exporting prompts in ${format} format...\n`));
        
        await this.loadPrompts();
        
        switch (format) {
            case 'json':
                this.exportJSON(options);
                break;
            case 'csv':
                this.exportCSV(options);
                break;
            case 'markdown':
                this.exportMarkdown(options);
                break;
            case 'yaml':
                this.exportYAML(options);
                break;
            case 'txt':
                this.exportTXT(options);
                break;
            default:
                console.error(chalk.red('❌ Unsupported format'));
                process.exit(1);
        }
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
                        tags: this.extractTags(promptMatch[1] + ' ' + (descMatch?.[1] || ''))
                    });
                }
            }
        }

        console.log(chalk.green(`✅ Loaded ${this.prompts.length} prompts\n`));
    }

    extractTags(text) {
        const techKeywords = [
            'javascript', 'js', 'typescript', 'ts', 'python', 'react', 'vue', 'angular',
            'node', 'express', 'fastapi', 'django', 'flask', 'api', 'rest', 'graphql',
            'html', 'css', 'tailwind', 'bootstrap', 'sass', 'jest', 'mocha', 'pytest',
            'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'git', 'github', 'gitlab',
            'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch'
        ];
        
        const lowerText = text.toLowerCase();
        return techKeywords.filter(tech => lowerText.includes(tech));
    }

    exportJSON(options) {
        const data = {
            metadata: {
                exportDate: new Date().toISOString(),
                totalPrompts: this.prompts.length,
                categories: [...new Set(this.prompts.map(p => p.category))],
                version: '2.0.0'
            },
            prompts: this.prompts
        };

        const filename = options.output || `jules-prompts-${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(filename, JSON.stringify(data, null, 2));
        
        console.log(chalk.green(`✅ Exported to ${filename}`));
        console.log(chalk.gray(`   ${this.prompts.length} prompts in JSON format`));
    }

    exportCSV(options) {
        const headers = ['Category', 'Prompt', 'Description', 'Tags'];
        const rows = [headers.join(',')];
        
        this.prompts.forEach(prompt => {
            const row = [
                `"${prompt.category}"`,
                `"${prompt.text.replace(/"/g, '""')}"`,
                `"${prompt.description.replace(/"/g, '""')}"`,
                `"${prompt.tags.join(';')}"`
            ];
            rows.push(row.join(','));
        });

        const filename = options.output || `jules-prompts-${new Date().toISOString().split('T')[0]}.csv`;
        fs.writeFileSync(filename, rows.join('\n'));
        
        console.log(chalk.green(`✅ Exported to ${filename}`));
        console.log(chalk.gray(`   ${this.prompts.length} prompts in CSV format`));
    }

    exportMarkdown(options) {
        let content = `# Jules Prompts Export\n\n`;
        content += `Generated on: ${new Date().toLocaleDateString()}\n`;
        content += `Total prompts: ${this.prompts.length}\n\n`;

        const categories = [...new Set(this.prompts.map(p => p.category))];
        
        categories.forEach(category => {
            content += `## ${category}\n\n`;
            
            const categoryPrompts = this.prompts.filter(p => p.category === category);
            categoryPrompts.forEach(prompt => {
                content += `### ${prompt.text}\n\n`;
                if (prompt.description) {
                    content += `${prompt.description}\n\n`;
                }
                if (prompt.tags.length > 0) {
                    content += `**Tags:** ${prompt.tags.join(', ')}\n\n`;
                }
                content += `---\n\n`;
            });
        });

        const filename = options.output || `jules-prompts-${new Date().toISOString().split('T')[0]}.md`;
        fs.writeFileSync(filename, content);
        
        console.log(chalk.green(`✅ Exported to ${filename}`));
        console.log(chalk.gray(`   ${this.prompts.length} prompts in Markdown format`));
    }

    exportYAML(options) {
        let content = `# Jules Prompts Export\n`;
        content += `# Generated on: ${new Date().toISOString()}\n\n`;
        content += `metadata:\n`;
        content += `  exportDate: "${new Date().toISOString()}"\n`;
        content += `  totalPrompts: ${this.prompts.length}\n`;
        content += `  version: "2.0.0"\n\n`;
        content += `prompts:\n`;

        this.prompts.forEach(prompt => {
            content += `  - text: "${prompt.text.replace(/"/g, '\\"')}"\n`;
            content += `    description: "${prompt.description.replace(/"/g, '\\"')}"\n`;
            content += `    category: "${prompt.category}"\n`;
            if (prompt.tags.length > 0) {
                content += `    tags:\n`;
                prompt.tags.forEach(tag => {
                    content += `      - "${tag}"\n`;
                });
            }
            content += `\n`;
        });

        const filename = options.output || `jules-prompts-${new Date().toISOString().split('T')[0]}.yaml`;
        fs.writeFileSync(filename, content);
        
        console.log(chalk.green(`✅ Exported to ${filename}`));
        console.log(chalk.gray(`   ${this.prompts.length} prompts in YAML format`));
    }

    exportTXT(options) {
        let content = `JULES PROMPTS COLLECTION\n`;
        content += `========================\n\n`;
        content += `Generated: ${new Date().toLocaleDateString()}\n`;
        content += `Total prompts: ${this.prompts.length}\n\n`;

        const categories = [...new Set(this.prompts.map(p => p.category))];
        
        categories.forEach(category => {
            content += `\n${category.toUpperCase()}\n`;
            content += `${'='.repeat(category.length)}\n\n`;
            
            const categoryPrompts = this.prompts.filter(p => p.category === category);
            categoryPrompts.forEach((prompt, index) => {
                content += `${index + 1}. ${prompt.text}\n`;
                if (prompt.description) {
                    content += `   ${prompt.description}\n`;
                }
                if (prompt.tags.length > 0) {
                    content += `   Tags: ${prompt.tags.join(', ')}\n`;
                }
                content += `\n`;
            });
        });

        const filename = options.output || `jules-prompts-${new Date().toISOString().split('T')[0]}.txt`;
        fs.writeFileSync(filename, content);
        
        console.log(chalk.green(`✅ Exported to ${filename}`));
        console.log(chalk.gray(`   ${this.prompts.length} prompts in plain text format`));
    }
}

// CLI setup
program
    .name('export-prompts')
    .description('Export Jules prompts in various formats')
    .version('2.0.0');

program
    .command('export <format>')
    .description('Export prompts (json, csv, markdown, yaml, txt)')
    .option('-o, --output <filename>', 'Output filename')
    .option('-c, --category <category>', 'Export specific category only')
    .action(async (format, options) => {
        const exporter = new PromptExporter();
        await exporter.export(format, options);
    });

program.parse();