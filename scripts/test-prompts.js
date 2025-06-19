#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { createInterface } = require('readline');

class PromptTester {
    constructor() {
        this.prompts = [];
        this.testResults = [];
    }

    async runTests() {
        console.log(chalk.blue('🧪 Jules Prompt Testing Suite\n'));
        
        await this.loadPrompts();
        await this.runQualityTests();
        await this.runEffectivenessTests();
        await this.runUsabilityTests();
        this.generateTestReport();
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
                        lineNumber: i + 1
                    });
                }
            }
        }

        console.log(chalk.green(`✅ Loaded ${this.prompts.length} prompts for testing\n`));
    }

    async runQualityTests() {
        console.log(chalk.yellow('🔍 Running Quality Tests...\n'));

        this.prompts.forEach((prompt, index) => {
            const tests = {
                hasCommentPrefix: prompt.text.startsWith('//'),
                hasPlaceholders: prompt.text.includes('{') || prompt.text.includes('...'),
                properLength: prompt.text.length >= 15 && prompt.text.length <= 100,
                avoidsVagueTerms: !/\b(this|that|stuff|thing)\b/i.test(prompt.text),
                hasActionVerb: /\b(add|create|fix|debug|refactor|optimize|implement|generate|write|build)\b/i.test(prompt.text),
                hasDescription: prompt.description.length > 0
            };

            const passedTests = Object.values(tests).filter(Boolean).length;
            const totalTests = Object.keys(tests).length;
            const score = Math.round((passedTests / totalTests) * 100);

            this.testResults.push({
                prompt,
                tests,
                score,
                category: 'quality'
            });

            if (score < 70) {
                console.log(chalk.red(`❌ Quality Issue (${score}%): Line ${prompt.lineNumber}`));
                console.log(chalk.gray(`   "${prompt.text}"`));
                
                Object.entries(tests).forEach(([test, passed]) => {
                    if (!passed) {
                        console.log(chalk.red(`   • Failed: ${this.getTestDescription(test)}`));
                    }
                });
                console.log();
            }
        });
    }

    async runEffectivenessTests() {
        console.log(chalk.yellow('⚡ Running Effectiveness Tests...\n'));

        this.prompts.forEach(prompt => {
            const effectiveness = this.calculateEffectiveness(prompt.text);
            
            this.testResults.push({
                prompt,
                effectiveness,
                category: 'effectiveness'
            });

            if (effectiveness < 60) {
                console.log(chalk.orange(`⚠️  Low Effectiveness (${effectiveness}%): "${prompt.text}"`));
            }
        });
    }

    async runUsabilityTests() {
        console.log(chalk.yellow('👥 Running Usability Tests...\n'));

        const duplicates = this.findDuplicates();
        const categoryDistribution = this.analyzeCategoryDistribution();
        
        if (duplicates.length > 0) {
            console.log(chalk.red('❌ Duplicate prompts found:'));
            duplicates.forEach(group => {
                console.log(chalk.red(`   Similar prompts:`));
                group.forEach(prompt => {
                    console.log(chalk.gray(`   • Line ${prompt.lineNumber}: "${prompt.text}"`));
                });
                console.log();
            });
        }

        console.log(chalk.blue('📊 Category Distribution:'));
        Object.entries(categoryDistribution).forEach(([category, count]) => {
            const percentage = Math.round((count / this.prompts.length) * 100);
            console.log(chalk.blue(`   ${category}: ${count} prompts (${percentage}%)`));
        });
    }

    calculateEffectiveness(promptText) {
        let score = 50;
        
        if (promptText.includes('{')) score += 15;
        if (promptText.includes('...')) score += 10;
        if (promptText.length > 20 && promptText.length < 80) score += 15;
        if (/\b(specific|detailed|comprehensive)\b/i.test(promptText)) score += 10;
        if (/\b(add|create|implement|generate)\b/i.test(promptText)) score += 10;
        
        return Math.min(100, score);
    }

    findDuplicates() {
        const groups = [];
        const processed = new Set();

        this.prompts.forEach((prompt, i) => {
            if (processed.has(i)) return;

            const similar = [prompt];
            const normalized = this.normalizeText(prompt.text);

            this.prompts.forEach((otherPrompt, j) => {
                if (i !== j && !processed.has(j)) {
                    const otherNormalized = this.normalizeText(otherPrompt.text);
                    const similarity = this.calculateSimilarity(normalized, otherNormalized);
                    
                    if (similarity > 0.8) {
                        similar.push(otherPrompt);
                        processed.add(j);
                    }
                }
            });

            if (similar.length > 1) {
                groups.push(similar);
            }
            processed.add(i);
        });

        return groups;
    }

    normalizeText(text) {
        return text.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    calculateSimilarity(text1, text2) {
        const words1 = text1.split(' ');
        const words2 = text2.split(' ');
        const intersection = words1.filter(word => words2.includes(word));
        const union = [...new Set([...words1, ...words2])];
        
        return intersection.length / union.length;
    }

    analyzeCategoryDistribution() {
        return this.prompts.reduce((acc, prompt) => {
            acc[prompt.category] = (acc[prompt.category] || 0) + 1;
            return acc;
        }, {});
    }

    getTestDescription(test) {
        const descriptions = {
            hasCommentPrefix: 'Should start with "//"',
            hasPlaceholders: 'Should include placeholders {like this} or ellipsis',
            properLength: 'Should be 15-100 characters long',
            avoidsVagueTerms: 'Should avoid vague terms like "this", "stuff"',
            hasActionVerb: 'Should include action verbs like "add", "create", "fix"',
            hasDescription: 'Should have a description'
        };
        return descriptions[test] || test;
    }

    generateTestReport() {
        console.log(chalk.green('\n📋 TEST SUMMARY\n'));

        const qualityResults = this.testResults.filter(r => r.category === 'quality');
        const avgQuality = Math.round(qualityResults.reduce((sum, r) => sum + r.score, 0) / qualityResults.length);
        
        const effectivenessResults = this.testResults.filter(r => r.category === 'effectiveness');
        const avgEffectiveness = Math.round(effectivenessResults.reduce((sum, r) => sum + r.effectiveness, 0) / effectivenessResults.length);

        console.log(chalk.green(`✅ Total Prompts Tested: ${this.prompts.length}`));
        console.log(chalk.green(`📊 Average Quality Score: ${avgQuality}%`));
        console.log(chalk.green(`⚡ Average Effectiveness: ${avgEffectiveness}%`));

        const highQuality = qualityResults.filter(r => r.score >= 80).length;
        const lowQuality = qualityResults.filter(r => r.score < 60).length;

        console.log(chalk.green(`🌟 High Quality Prompts: ${highQuality}`));
        console.log(chalk.yellow(`⚠️  Low Quality Prompts: ${lowQuality}`));

        // Save detailed report
        const report = {
            summary: {
                totalPrompts: this.prompts.length,
                averageQuality: avgQuality,
                averageEffectiveness: avgEffectiveness,
                highQualityCount: highQuality,
                lowQualityCount: lowQuality
            },
            results: this.testResults,
            timestamp: new Date().toISOString()
        };

        fs.writeFileSync('test-results.json', JSON.stringify(report, null, 2));
        console.log(chalk.blue('\n📄 Detailed results saved to test-results.json'));
    }
}

// Run tests
const tester = new PromptTester();
tester.runTests();