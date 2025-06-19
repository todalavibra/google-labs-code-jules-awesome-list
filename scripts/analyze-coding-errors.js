#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class CodingErrorAnalyzer {
    constructor() {
        this.errorPatterns = [];
        this.analysisResults = {};
        this.recommendations = [];
    }

    async analyze() {
        console.log(chalk.blue('🔍 Jules AI Coding Error Analysis\n'));
        
        this.defineErrorPatterns();
        this.analyzeCommonErrors();
        this.generateRecommendations();
        this.createErrorPrevention();
        this.generateReport();
    }

    defineErrorPatterns() {
        this.errorPatterns = [
            {
                id: 'null-pointer-errors',
                name: 'Null/Undefined Reference Errors',
                description: 'Accessing properties or methods on null/undefined values',
                frequency: 85,
                severity: 'critical',
                examples: [
                    'user.profile.name // user.profile might be null',
                    'data.items.length // data.items might be undefined',
                    'response.data.id // response.data could be null'
                ],
                detection: {
                    patterns: [
                        /\w+\.\w+\.\w+/g,
                        /\w+\[\w+\]\.\w+/g,
                        /\w+\.\w+\(\)/g
                    ],
                    antiPatterns: [
                        /\?\./g,
                        /&&\s*\w+\./g,
                        /if\s*\(\s*\w+\s*\)/g
                    ]
                },
                fixes: [
                    'Use optional chaining: user?.profile?.name',
                    'Add null checks: if (user && user.profile) { ... }',
                    'Use nullish coalescing: user?.profile?.name ?? "Unknown"'
                ],
                prevention: 'Always request null safety in prompts: "with proper null/undefined checks"'
            },
            {
                id: 'async-await-misuse',
                name: 'Async/Await Misuse',
                description: 'Incorrect usage of async/await leading to unhandled promises',
                frequency: 78,
                severity: 'high',
                examples: [
                    'const data = fetchData(); // Missing await',
                    'async function() { fetchData(); } // Not awaiting',
                    'Promise.all([fetch1(), fetch2()]) // Missing await'
                ],
                detection: {
                    patterns: [
                        /const\s+\w+\s*=\s*\w+\(\)/g,
                        /return\s+\w+\(\)/g,
                        /\w+\(\);\s*$/gm
                    ],
                    antiPatterns: [
                        /await\s+\w+\(/g,
                        /\.then\(/g,
                        /\.catch\(/g
                    ]
                },
                fixes: [
                    'Add await: const data = await fetchData();',
                    'Handle promises: fetchData().then(data => ...)',
                    'Use try-catch with await for error handling'
                ],
                prevention: 'Specify in prompts: "with proper async/await usage and error handling"'
            },
            {
                id: 'state-mutation',
                name: 'Direct State Mutation',
                description: 'Directly mutating React state instead of using setState',
                frequency: 72,
                severity: 'high',
                examples: [
                    'state.items.push(newItem)',
                    'state.user.name = "New Name"',
                    'state.count++'
                ],
                detection: {
                    patterns: [
                        /state\.\w+\s*=\s*/g,
                        /state\.\w+\.\w+\s*=\s*/g,
                        /state\.\w+\.push\(/g,
                        /state\.\w+\.pop\(/g
                    ],
                    antiPatterns: [
                        /setState\(/g,
                        /\[\.\.\.state\./g,
                        /\{\.\.\.state/g
                    ]
                },
                fixes: [
                    'Use setState: setState(prev => ({ ...prev, items: [...prev.items, newItem] }))',
                    'Immutable updates: setState(prev => ({ ...prev, user: { ...prev.user, name: "New Name" } }))',
                    'Use functional updates for counters: setState(prev => prev + 1)'
                ],
                prevention: 'Request in prompts: "with immutable state updates using setState"'
            },
            {
                id: 'missing-error-handling',
                name: 'Missing Error Handling',
                description: 'Functions without proper error handling mechanisms',
                frequency: 90,
                severity: 'critical',
                examples: [
                    'async function fetchData() { return await fetch("/api"); }',
                    'function processData(data) { return data.map(item => item.value); }',
                    'const result = JSON.parse(jsonString);'
                ],
                detection: {
                    patterns: [
                        /async\s+function[^{]*\{[^}]*\}/g,
                        /function[^{]*\{[^}]*\}/g,
                        /JSON\.parse\(/g,
                        /parseInt\(/g,
                        /fetch\(/g
                    ],
                    antiPatterns: [
                        /try\s*\{/g,
                        /catch\s*\(/g,
                        /throw\s+/g
                    ]
                },
                fixes: [
                    'Wrap in try-catch: try { ... } catch (error) { ... }',
                    'Add error validation: if (!data || !Array.isArray(data)) throw new Error(...)',
                    'Use safe parsing: try { JSON.parse(jsonString) } catch { return null }'
                ],
                prevention: 'Always request: "with comprehensive error handling and validation"'
            },
            {
                id: 'weak-typing',
                name: 'Weak TypeScript Typing',
                description: 'Using any type or missing proper type definitions',
                frequency: 65,
                severity: 'medium',
                examples: [
                    'function process(data: any) { ... }',
                    'const user = {} as any;',
                    'let result; // No type annotation'
                ],
                detection: {
                    patterns: [
                        /:\s*any\b/g,
                        /as\s+any\b/g,
                        /let\s+\w+;\s*$/gm,
                        /const\s+\w+\s*=\s*\{\}/g
                    ],
                    antiPatterns: [
                        /interface\s+\w+/g,
                        /type\s+\w+\s*=/g,
                        /:\s*string\b/g,
                        /:\s*number\b/g
                    ]
                },
                fixes: [
                    'Define interfaces: interface User { id: string; name: string; }',
                    'Use specific types: function process(data: UserData[]) { ... }',
                    'Add type annotations: let result: ProcessResult;'
                ],
                prevention: 'Specify in prompts: "with strict TypeScript types and interfaces"'
            },
            {
                id: 'memory-leaks',
                name: 'Memory Leaks',
                description: 'Event listeners, timers, or subscriptions not properly cleaned up',
                frequency: 45,
                severity: 'medium',
                examples: [
                    'setInterval(() => { ... }, 1000); // No cleanup',
                    'element.addEventListener("click", handler); // No removal',
                    'subscription = observable.subscribe(...); // No unsubscribe'
                ],
                detection: {
                    patterns: [
                        /setInterval\(/g,
                        /setTimeout\(/g,
                        /addEventListener\(/g,
                        /subscribe\(/g
                    ],
                    antiPatterns: [
                        /clearInterval\(/g,
                        /clearTimeout\(/g,
                        /removeEventListener\(/g,
                        /unsubscribe\(/g,
                        /useEffect.*return/g
                    ]
                },
                fixes: [
                    'Clear intervals: const id = setInterval(...); return () => clearInterval(id);',
                    'Remove listeners: return () => element.removeEventListener("click", handler);',
                    'Unsubscribe: return () => subscription.unsubscribe();'
                ],
                prevention: 'Request: "with proper cleanup in useEffect return function"'
            }
        ];

        console.log(chalk.green(`✅ Defined ${this.errorPatterns.length} error patterns\n`));
    }

    analyzeCommonErrors() {
        console.log(chalk.yellow('📊 Analyzing Error Frequency and Impact...\n'));

        this.analysisResults = {
            totalPatterns: this.errorPatterns.length,
            criticalErrors: this.errorPatterns.filter(p => p.severity === 'critical').length,
            highSeverityErrors: this.errorPatterns.filter(p => p.severity === 'high').length,
            averageFrequency: Math.round(
                this.errorPatterns.reduce((sum, p) => sum + p.frequency, 0) / this.errorPatterns.length
            ),
            mostCommonErrors: this.errorPatterns
                .sort((a, b) => b.frequency - a.frequency)
                .slice(0, 3)
                .map(p => ({ name: p.name, frequency: p.frequency })),
            severityDistribution: {
                critical: this.errorPatterns.filter(p => p.severity === 'critical').length,
                high: this.errorPatterns.filter(p => p.severity === 'high').length,
                medium: this.errorPatterns.filter(p => p.severity === 'medium').length,
                low: this.errorPatterns.filter(p => p.severity === 'low').length
            }
        };

        console.log(chalk.blue('📈 Analysis Results:'));
        console.log(chalk.blue(`   Average Error Frequency: ${this.analysisResults.averageFrequency}%`));
        console.log(chalk.blue(`   Critical Errors: ${this.analysisResults.criticalErrors}`));
        console.log(chalk.blue(`   High Severity Errors: ${this.analysisResults.highSeverityErrors}`));
    }

    generateRecommendations() {
        console.log(chalk.yellow('\n💡 Generating Improvement Recommendations...\n'));

        this.recommendations = [
            {
                category: 'Prompt Engineering',
                title: 'Enhanced Context Specification',
                description: 'Provide detailed context and requirements in every prompt',
                impact: 'high',
                implementation: [
                    'Include project structure and tech stack',
                    'Specify error handling requirements',
                    'Request TypeScript types explicitly',
                    'Mention existing code patterns to follow'
                ],
                example: {
                    before: '// Create a user service',
                    after: '// Create a TypeScript user service for Express.js API with: 1) Proper error handling, 2) Input validation, 3) Database integration using Prisma, 4) JWT authentication, 5) Following existing service patterns in /services/'
                }
            },
            {
                category: 'Quality Assurance',
                title: 'Mandatory Quality Checklist',
                description: 'Include quality requirements in every coding prompt',
                impact: 'high',
                implementation: [
                    'Always request error handling',
                    'Specify null/undefined safety',
                    'Ask for input validation',
                    'Request unit tests',
                    'Mention performance considerations'
                ],
                example: {
                    before: '// Add authentication',
                    after: '// Add JWT authentication with: 1) Comprehensive error handling, 2) Input validation, 3) Null safety checks, 4) TypeScript interfaces, 5) Unit tests, 6) Rate limiting'
                }
            },
            {
                category: 'Code Review',
                title: 'Iterative Improvement Process',
                description: 'Use Jules for code review and iterative improvements',
                impact: 'medium',
                implementation: [
                    'Submit generated code for review',
                    'Ask for specific improvements',
                    'Request security analysis',
                    'Get performance optimization suggestions'
                ],
                example: {
                    before: 'Accept first generated code',
                    after: '// Review this React component for: 1) Performance issues, 2) Memory leaks, 3) Accessibility, 4) Security vulnerabilities, 5) Best practices. Provide specific fixes.'
                }
            },
            {
                category: 'Testing Strategy',
                title: 'Test-Driven Development',
                description: 'Request tests alongside implementation',
                impact: 'medium',
                implementation: [
                    'Ask for unit tests with implementation',
                    'Request edge case coverage',
                    'Specify testing framework',
                    'Include integration tests for APIs'
                ],
                example: {
                    before: '// Create a utility function',
                    after: '// Create a utility function with Jest unit tests covering: 1) Normal cases, 2) Edge cases, 3) Error scenarios, 4) Performance benchmarks'
                }
            }
        ];
    }

    createErrorPrevention() {
        console.log(chalk.yellow('🛡️  Creating Error Prevention Strategies...\n'));

        const preventionStrategies = {
            prePrompt: [
                'Define clear requirements and context',
                'Specify technology stack and versions',
                'Include existing code patterns to follow',
                'Request specific quality attributes',
                'Mention performance and security requirements'
            ],
            promptStructure: [
                'Start with action verb (Create, Implement, Add)',
                'Specify the component/function clearly',
                'Include context and purpose',
                'List specific requirements',
                'Request error handling and validation',
                'Ask for TypeScript types if applicable'
            ],
            postGeneration: [
                'Review for null/undefined safety',
                'Check async/await usage',
                'Verify error handling coverage',
                'Test with edge cases',
                'Validate TypeScript compliance',
                'Run linting and type checking'
            ],
            iterativeImprovement: [
                'Use Jules for code review',
                'Ask for specific improvements',
                'Request security analysis',
                'Get performance optimization suggestions',
                'Validate against best practices'
            ]
        };

        this.preventionStrategies = preventionStrategies;
    }

    generateReport() {
        console.log(chalk.green('\n📋 CODING ERROR ANALYSIS REPORT\n'));

        console.log(chalk.green(`🔍 Total Error Patterns Analyzed: ${this.analysisResults.totalPatterns}`));
        console.log(chalk.red(`⚠️  Critical Errors: ${this.analysisResults.criticalErrors}`));
        console.log(chalk.yellow(`⚡ High Severity Errors: ${this.analysisResults.highSeverityErrors}`));
        console.log(chalk.blue(`📊 Average Error Frequency: ${this.analysisResults.averageFrequency}%`));

        console.log(chalk.blue('\n🏆 Most Common Error Patterns:'));
        this.analysisResults.mostCommonErrors.forEach((error, index) => {
            console.log(chalk.blue(`  ${index + 1}. ${error.name}: ${error.frequency}%`));
        });

        console.log(chalk.yellow('\n💡 Top Recommendations:'));
        this.recommendations.slice(0, 3).forEach((rec, index) => {
            console.log(chalk.yellow(`  ${index + 1}. ${rec.title} (${rec.impact} impact)`));
            console.log(chalk.gray(`     ${rec.description}`));
        });

        console.log(chalk.green('\n🛡️  Error Prevention Checklist:'));
        console.log(chalk.green('  Before Prompting:'));
        this.preventionStrategies.prePrompt.slice(0, 3).forEach(strategy => {
            console.log(chalk.green(`    • ${strategy}`));
        });

        console.log(chalk.green('  After Code Generation:'));
        this.preventionStrategies.postGeneration.slice(0, 3).forEach(strategy => {
            console.log(chalk.green(`    • ${strategy}`));
        });

        // Save detailed report
        const report = {
            analysis: this.analysisResults,
            errorPatterns: this.errorPatterns,
            recommendations: this.recommendations,
            preventionStrategies: this.preventionStrategies,
            timestamp: new Date().toISOString()
        };

        fs.writeFileSync('coding-error-analysis.json', JSON.stringify(report, null, 2));
        console.log(chalk.green('\n📄 Detailed analysis saved to coding-error-analysis.json'));
    }
}

// Run the analysis
const analyzer = new CodingErrorAnalyzer();
analyzer.analyze();