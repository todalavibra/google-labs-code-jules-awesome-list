#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { program } = require('commander');

class PromptImporter {
    constructor() {
        this.importedPrompts = [];
        this.existingPrompts = [];
    }

    async import(filePath, options = {}) {
        console.log(chalk.blue(`📥 Importing prompts from ${filePath}...\n`));
        
        await this.loadExistingPrompts();
        await this.loadImportFile(filePath);
        this.processImport(options);
        this.generateImportReport();
    }

    async loadExistingPrompts() {
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
                if (promptMatch) {
                    this.existingPrompts.push({
                        text: promptMatch[1],
                        category: currentCategory
                    });
                }
            }
        }

        console.log(chalk.green(`✅ Loaded ${this.existingPrompts.length} existing prompts\n`));
    }

    async loadImportFile(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const extension = path.extname(filePath).toLowerCase();
        const content = fs.readFileSync(filePath, 'utf8');

        switch (extension) {
            case '.json':
                this.parseJSON(content);
                break;
            case '.csv':
                this.parseCSV(content);
                break;
            case '.md':
                this.parseMarkdown(content);
                break;
            case '.yaml':
            case '.yml':
                this.parseYAML(content);
                break;
            case '.txt':
                this.parseTXT(content);
                break;
            default:
                throw new Error(`Unsupported file format: ${extension}`);
        }

        console.log(chalk.green(`✅ Parsed ${this.importedPrompts.length} prompts from import file\n`));
    }

    parseJSON(content) {
        const data = JSON.parse(content);
        
        if (data.prompts && Array.isArray(data.prompts)) {
            this.importedPrompts = data.prompts;
        } else if (Array.isArray(data)) {
            this.importedPrompts = data;
        } else {
            throw new Error('Invalid JSON format. Expected array of prompts or object with prompts property.');
        }
    }

    parseCSV(content) {
        const lines = content.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
        
        const textIndex = headers.findIndex(h => h.includes('prompt') || h.includes('text'));
        const categoryIndex = headers.findIndex(h => h.includes('category'));
        const descriptionIndex = headers.findIndex(h => h.includes('description'));
        
        if (textIndex === -1) {
            throw new Error('CSV must contain a column with "prompt" or "text" in the header');
        }

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const columns = this.parseCSVLine(line);
            
            this.importedPrompts.push({
                text: columns[textIndex] || '',
                category: columns[categoryIndex] || 'Imported',
                description: columns[descriptionIndex] || '',
                tags: []
            });
        }
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result.map(col => col.replace(/^"|"$/g, ''));
    }

    parseMarkdown(content) {
        const lines = content.split('\n');
        let currentCategory = 'Imported';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('## ')) {
                currentCategory = line.replace('## ', '').trim();
                continue;
            }
            
            if (line.startsWith('- `') || line.startsWith('* `')) {
                const promptMatch = line.match(/[*-] `([^`]+)`/);
                if (promptMatch) {
                    const descMatch = lines[i + 1]?.match(/<sub>([^<]+)<\/sub>/);
                    
                    this.importedPrompts.push({
                        text: promptMatch[1],
                        category: currentCategory,
                        description: descMatch ? descMatch[1] : '',
                        tags: []
                    });
                }
            }
        }
    }

    parseYAML(content) {
        // Simple YAML parser for our specific format
        const lines = content.split('\n');
        let currentPrompt = null;
        let inPrompts = false;
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            if (trimmed === 'prompts:') {
                inPrompts = true;
                continue;
            }
            
            if (!inPrompts) continue;
            
            if (trimmed.startsWith('- text:')) {
                if (currentPrompt) {
                    this.importedPrompts.push(currentPrompt);
                }
                currentPrompt = {
                    text: trimmed.replace('- text:', '').replace(/"/g, '').trim(),
                    category: 'Imported',
                    description: '',
                    tags: []
                };
            } else if (currentPrompt && trimmed.startsWith('description:')) {
                currentPrompt.description = trimmed.replace('description:', '').replace(/"/g, '').trim();
            } else if (currentPrompt && trimmed.startsWith('category:')) {
                currentPrompt.category = trimmed.replace('category:', '').replace(/"/g, '').trim();
            }
        }
        
        if (currentPrompt) {
            this.importedPrompts.push(currentPrompt);
        }
    }

    parseTXT(content) {
        const lines = content.split('\n');
        let currentCategory = 'Imported';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Detect category headers (all caps with underlines)
            if (line === line.toUpperCase() && line.length > 0 && 
                i + 1 < lines.length && lines[i + 1].trim().match(/^=+$/)) {
                currentCategory = line;
                continue;
            }
            
            // Detect numbered prompts
            const promptMatch = line.match(/^\d+\.\s*(.+)/);
            if (promptMatch) {
                const description = lines[i + 1]?.trim().startsWith('   ') ? 
                    lines[i + 1].trim() : '';
                
                this.importedPrompts.push({
                    text: promptMatch[1],
                    category: currentCategory,
                    description: description,
                    tags: []
                });
            }
        }
    }

    processImport(options) {
        console.log(chalk.yellow('🔄 Processing import...\n'));
        
        const duplicates = [];
        const newPrompts = [];
        
        this.importedPrompts.forEach(importedPrompt => {
            const isDuplicate = this.existingPrompts.some(existing => 
                this.normalizeText(existing.text) === this.normalizeText(importedPrompt.text)
            );
            
            if (isDuplicate && !options.allowDuplicates) {
                duplicates.push(importedPrompt);
            } else {
                newPrompts.push(importedPrompt);
            }
        });

        if (duplicates.length > 0) {
            console.log(chalk.yellow(`⚠️  Found ${duplicates.length} duplicate prompts:`));
            duplicates.forEach(dup => {
                console.log(chalk.gray(`   • "${dup.text}"`));
            });
            console.log();
        }

        if (newPrompts.length > 0 && !options.dryRun) {
            this.addPromptsToReadme(newPrompts);
            console.log(chalk.green(`✅ Added ${newPrompts.length} new prompts to README.md`));
        } else if (options.dryRun) {
            console.log(chalk.blue(`🔍 Dry run: Would add ${newPrompts.length} new prompts`));
        }

        this.stats = {
            imported: this.importedPrompts.length,
            duplicates: duplicates.length,
            added: options.dryRun ? 0 : newPrompts.length
        };
    }

    normalizeText(text) {
        return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
    }

    addPromptsToReadme(prompts) {
        const readmePath = path.join(process.cwd(), 'README.md');
        let content = fs.readFileSync(readmePath, 'utf8');
        
        // Group prompts by category
        const promptsByCategory = {};
        prompts.forEach(prompt => {
            if (!promptsByCategory[prompt.category]) {
                promptsByCategory[prompt.category] = [];
            }
            promptsByCategory[prompt.category].push(prompt);
        });

        // Add prompts to appropriate sections
        Object.entries(promptsByCategory).forEach(([category, categoryPrompts]) => {
            const sectionRegex = new RegExp(`(## ${category}[\\s\\S]*?)(?=## |$)`, 'i');
            const match = content.match(sectionRegex);
            
            if (match) {
                // Add to existing section
                const sectionContent = match[1];
                const newPrompts = categoryPrompts.map(prompt => 
                    `- \`${prompt.text}\`\n  <sub>${prompt.description}</sub>`
                ).join('\n\n');
                
                const updatedSection = sectionContent.trim() + '\n\n' + newPrompts;
                content = content.replace(sectionRegex, updatedSection);
            } else {
                // Create new section
                const newSection = `\n## ${category}\n\n${categoryPrompts.map(prompt => 
                    `- \`${prompt.text}\`\n  <sub>${prompt.description}</sub>`
                ).join('\n\n')}\n`;
                
                content += newSection;
            }
        });

        fs.writeFileSync(readmePath, content);
    }

    generateImportReport() {
        console.log(chalk.green('\n📊 IMPORT SUMMARY\n'));
        console.log(chalk.green(`✅ Prompts in import file: ${this.stats.imported}`));
        console.log(chalk.yellow(`⚠️  Duplicates found: ${this.stats.duplicates}`));
        console.log(chalk.green(`➕ New prompts added: ${this.stats.added}`));
        
        if (this.stats.duplicates > 0) {
            console.log(chalk.blue('\n💡 Use --allow-duplicates flag to import duplicates anyway'));
        }
    }
}

// CLI setup
program
    .name('import-prompts')
    .description('Import prompts from various file formats')
    .version('2.0.0');

program
    .command('import <file>')
    .description('Import prompts from file (json, csv, md, yaml, txt)')
    .option('--dry-run', 'Preview import without making changes')
    .option('--allow-duplicates', 'Import duplicate prompts')
    .action(async (file, options) => {
        try {
            const importer = new PromptImporter();
            await importer.import(file, options);
        } catch (error) {
            console.error(chalk.red('❌ Import failed:'), error.message);
            process.exit(1);
        }
    });

program.parse();