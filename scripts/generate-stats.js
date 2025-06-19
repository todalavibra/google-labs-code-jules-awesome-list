#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class StatsGenerator {
    constructor() {
        this.prompts = [];
        this.stats = {};
    }

    async generate() {
        console.log(chalk.blue('📊 Generating Jules Prompts Statistics...\n'));
        
        await this.loadPrompts();
        this.calculateStats();
        this.displayStats();
        this.generateMarkdownReport();
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
                        length: promptMatch[1].length,
                        hasPlaceholders: promptMatch[1].includes('{') || promptMatch[1].includes('...'),
                        technologies: this.extractTechnologies(promptMatch[1] + ' ' + (descMatch?.[1] || ''))
                    });
                }
            }
        }
    }

    extractTechnologies(text) {
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

    calculateStats() {
        this.stats = {
            totalPrompts: this.prompts.length,
            categories: {},
            avgLength: 0,
            lengthDistribution: { short: 0, medium: 0, long: 0 },
            placeholderUsage: 0,
            technologies: {},
            topCategories: [],
            topTechnologies: []
        };

        // Category stats
        this.prompts.forEach(prompt => {
            this.stats.categories[prompt.category] = (this.stats.categories[prompt.category] || 0) + 1;
            
            // Length distribution
            if (prompt.length < 30) this.stats.lengthDistribution.short++;
            else if (prompt.length < 60) this.stats.lengthDistribution.medium++;
            else this.stats.lengthDistribution.long++;
            
            // Placeholder usage
            if (prompt.hasPlaceholders) this.stats.placeholderUsage++;
            
            // Technology mentions
            prompt.technologies.forEach(tech => {
                this.stats.technologies[tech] = (this.stats.technologies[tech] || 0) + 1;
            });
        });

        // Calculate averages
        this.stats.avgLength = Math.round(
            this.prompts.reduce((sum, p) => sum + p.length, 0) / this.prompts.length
        );

        // Top categories and technologies
        this.stats.topCategories = Object.entries(this.stats.categories)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        this.stats.topTechnologies = Object.entries(this.stats.technologies)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
    }

    displayStats() {
        console.log(chalk.green('📈 OVERVIEW'));
        console.log(`  Total Prompts: ${chalk.bold(this.stats.totalPrompts)}`);
        console.log(`  Categories: ${chalk.bold(Object.keys(this.stats.categories).length)}`);
        console.log(`  Average Length: ${chalk.bold(this.stats.avgLength)} characters`);
        console.log(`  Prompts with Placeholders: ${chalk.bold(this.stats.placeholderUsage)} (${Math.round(this.stats.placeholderUsage / this.stats.totalPrompts * 100)}%)`);
        console.log();

        console.log(chalk.blue('📊 LENGTH DISTRIBUTION'));
        console.log(`  Short (<30 chars): ${chalk.bold(this.stats.lengthDistribution.short)}`);
        console.log(`  Medium (30-60 chars): ${chalk.bold(this.stats.lengthDistribution.medium)}`);
        console.log(`  Long (>60 chars): ${chalk.bold(this.stats.lengthDistribution.long)}`);
        console.log();

        console.log(chalk.yellow('🏆 TOP CATEGORIES'));
        this.stats.topCategories.forEach(([category, count], index) => {
            console.log(`  ${index + 1}. ${category}: ${chalk.bold(count)} prompts`);
        });
        console.log();

        console.log(chalk.magenta('💻 TOP TECHNOLOGIES'));
        this.stats.topTechnologies.forEach(([tech, count], index) => {
            console.log(`  ${index + 1}. ${tech}: ${chalk.bold(count)} mentions`);
        });
        console.log();
    }

    generateMarkdownReport() {
        const report = `# Jules Prompts Statistics

Generated on: ${new Date().toISOString().split('T')[0]}

## Overview

- **Total Prompts**: ${this.stats.totalPrompts}
- **Categories**: ${Object.keys(this.stats.categories).length}
- **Average Length**: ${this.stats.avgLength} characters
- **Prompts with Placeholders**: ${this.stats.placeholderUsage} (${Math.round(this.stats.placeholderUsage / this.stats.totalPrompts * 100)}%)

## Length Distribution

| Length | Count | Percentage |
|--------|-------|------------|
| Short (<30 chars) | ${this.stats.lengthDistribution.short} | ${Math.round(this.stats.lengthDistribution.short / this.stats.totalPrompts * 100)}% |
| Medium (30-60 chars) | ${this.stats.lengthDistribution.medium} | ${Math.round(this.stats.lengthDistribution.medium / this.stats.totalPrompts * 100)}% |
| Long (>60 chars) | ${this.stats.lengthDistribution.long} | ${Math.round(this.stats.lengthDistribution.long / this.stats.totalPrompts * 100)}% |

## Category Breakdown

| Category | Prompts | Percentage |
|----------|---------|------------|
${this.stats.topCategories.map(([cat, count]) => 
    `| ${cat} | ${count} | ${Math.round(count / this.stats.totalPrompts * 100)}% |`
).join('\n')}

## Technology Mentions

| Technology | Mentions |
|------------|----------|
${this.stats.topTechnologies.map(([tech, count]) => 
    `| ${tech} | ${count} |`
).join('\n')}

---

*This report was generated automatically by the Jules Prompts statistics tool.*
`;

        fs.writeFileSync('STATS.md', report);
        console.log(chalk.green('📄 Statistics report saved to STATS.md'));
    }
}

// Run stats generation
const generator = new StatsGenerator();
generator.generate();