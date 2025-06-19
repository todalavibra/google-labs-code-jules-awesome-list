#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const chalk = require('chalk');

class PromptSearcher {
    constructor() {
        this.prompts = [];
    }

    async search(query, options = {}) {
        await this.loadPrompts();
        
        const results = this.prompts.filter(prompt => {
            const searchText = `${prompt.text} ${prompt.description} ${prompt.category}`.toLowerCase();
            const queryLower = query.toLowerCase();
            
            if (options.category && prompt.category !== options.category) {
                return false;
            }
            
            if (options.exact) {
                return searchText.includes(queryLower);
            }
            
            // Fuzzy search - split query into words and check if all are present
            const queryWords = queryLower.split(/\s+/);
            return queryWords.every(word => searchText.includes(word));
        });

        this.displayResults(results, query, options);
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
                        category: currentCategory
                    });
                }
            }
        }
    }

    displayResults(results, query, options) {
        console.log(chalk.blue(`🔍 Search results for: "${query}"`));
        
        if (options.category) {
            console.log(chalk.gray(`   Filtered by category: ${options.category}`));
        }
        
        console.log(chalk.gray(`   Found ${results.length} result(s)\n`));

        if (results.length === 0) {
            console.log(chalk.yellow('No prompts found matching your search criteria.'));
            return;
        }

        results.forEach((prompt, index) => {
            console.log(chalk.green(`${index + 1}. ${prompt.category}`));
            console.log(chalk.white(`   ${prompt.text}`));
            if (prompt.description) {
                console.log(chalk.gray(`   ${prompt.description}`));
            }
            console.log();
        });

        // Show copy command for first result
        if (results.length > 0 && !options.noCopy) {
            console.log(chalk.blue('💡 To copy the first result to clipboard:'));
            console.log(chalk.gray(`   echo "${results[0].text}" | pbcopy`));
        }
    }

    listCategories() {
        this.loadPrompts().then(() => {
            const categories = [...new Set(this.prompts.map(p => p.category))];
            console.log(chalk.blue('📂 Available categories:\n'));
            categories.forEach(category => {
                const count = this.prompts.filter(p => p.category === category).length;
                console.log(chalk.white(`  ${category} (${count} prompts)`));
            });
        });
    }
}

// CLI setup
program
    .name('search-prompts')
    .description('Search through Jules prompts')
    .version('1.0.0');

program
    .command('search <query>')
    .description('Search for prompts')
    .option('-c, --category <category>', 'Filter by category')
    .option('-e, --exact', 'Exact match search')
    .option('--no-copy', 'Don\'t show copy command')
    .action(async (query, options) => {
        const searcher = new PromptSearcher();
        await searcher.search(query, options);
    });

program
    .command('categories')
    .description('List all available categories')
    .action(() => {
        const searcher = new PromptSearcher();
        searcher.listCategories();
    });

program.parse();