#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const natural = require('natural');

class JulesOptimizer {
    constructor() {
        this.prompts = [];
        this.optimizations = [];
        this.qualityMetrics = {};
        this.stemmer = natural.PorterStemmer;
    }

    async optimize() {
        console.log(chalk.blue('🚀 Jules AI Prompt Optimization Engine\n'));
        
        await this.loadPrompts();
        this.analyzePromptEffectiveness();
        this.generateOptimizations();
        this.createImprovedPrompts();
        this.generateOptimizationReport();
    }

    async loadPrompts() {
        // Load existing prompts from README or create sample prompts
        this.prompts = [
            {
                id: 'basic-function',
                original: '// Create a function',
                category: 'Basic',
                effectiveness: 30,
                issues: ['Too vague', 'No context', 'No requirements']
            },
            {
                id: 'add-auth',
                original: '// Add authentication',
                category: 'Security',
                effectiveness: 35,
                issues: ['No tech stack specified', 'No error handling mentioned', 'No implementation details']
            },
            {
                id: 'fix-bug',
                original: '// Fix this bug',
                category: 'Debugging',
                effectiveness: 25,
                issues: ['No bug description', 'No context provided', 'No expected behavior']
            },
            {
                id: 'create-component',
                original: '// Create a React component',
                category: 'Frontend',
                effectiveness: 45,
                issues: ['No component purpose', 'No props specified', 'No state management mentioned']
            },
            {
                id: 'api-endpoint',
                original: '// Create an API endpoint',
                category: 'Backend',
                effectiveness: 40,
                issues: ['No HTTP method', 'No data structure', 'No error handling']
            }
        ];

        console.log(chalk.green(`✅ Loaded ${this.prompts.length} prompts for optimization\n`));
    }

    analyzePromptEffectiveness() {
        console.log(chalk.yellow('🔍 Analyzing Prompt Effectiveness...\n'));

        this.prompts.forEach(prompt => {
            const analysis = this.analyzePrompt(prompt.original);
            prompt.analysis = analysis;
            prompt.effectiveness = this.calculateEffectiveness(analysis);
        });

        const avgEffectiveness = Math.round(
            this.prompts.reduce((sum, p) => sum + p.effectiveness, 0) / this.prompts.length
        );

        this.qualityMetrics.averageEffectiveness = avgEffectiveness;
        console.log(chalk.blue(`📊 Average Prompt Effectiveness: ${avgEffectiveness}%`));
    }

    analyzePrompt(promptText) {
        const analysis = {
            length: promptText.length,
            hasContext: this.hasContext(promptText),
            hasSpecificity: this.hasSpecificity(promptText),
            hasRequirements: this.hasRequirements(promptText),
            hasErrorHandling: this.hasErrorHandling(promptText),
            hasTypeInfo: this.hasTypeInfo(promptText),
            hasExamples: this.hasExamples(promptText),
            complexity: this.calculateComplexity(promptText),
            clarity: this.calculateClarity(promptText)
        };

        return analysis;
    }

    hasContext(text) {
        const contextKeywords = ['for', 'in', 'using', 'with', 'that', 'which', 'when'];
        return contextKeywords.some(keyword => text.toLowerCase().includes(keyword));
    }

    hasSpecificity(text) {
        const specificKeywords = ['specific', 'detailed', 'comprehensive', 'exact', 'particular'];
        return specificKeywords.some(keyword => text.toLowerCase().includes(keyword)) ||
               text.includes('{') || text.includes('...');
    }

    hasRequirements(text) {
        const requirementKeywords = ['with', 'including', 'that', 'should', 'must', 'requirements'];
        return requirementKeywords.some(keyword => text.toLowerCase().includes(keyword));
    }

    hasErrorHandling(text) {
        const errorKeywords = ['error', 'exception', 'try', 'catch', 'validation', 'handle'];
        return errorKeywords.some(keyword => text.toLowerCase().includes(keyword));
    }

    hasTypeInfo(text) {
        const typeKeywords = ['typescript', 'interface', 'type', 'types', 'typed'];
        return typeKeywords.some(keyword => text.toLowerCase().includes(keyword));
    }

    hasExamples(text) {
        const exampleKeywords = ['example', 'like', 'such as', 'similar to', 'following'];
        return exampleKeywords.some(keyword => text.toLowerCase().includes(keyword));
    }

    calculateComplexity(text) {
        // Simple complexity based on length and structure
        const words = text.split(/\s+/).length;
        const sentences = text.split(/[.!?]+/).length;
        return Math.min(100, (words * 2) + (sentences * 5));
    }

    calculateClarity(text) {
        // Clarity based on specific terms and structure
        let clarity = 50;
        
        if (text.includes('//')) clarity += 10;
        if (text.length > 20) clarity += 10;
        if (text.length < 100) clarity += 10;
        if (!/\b(this|that|stuff|thing)\b/i.test(text)) clarity += 20;
        
        return Math.min(100, clarity);
    }

    calculateEffectiveness(analysis) {
        let score = 0;
        const weights = {
            hasContext: 15,
            hasSpecificity: 20,
            hasRequirements: 15,
            hasErrorHandling: 20,
            hasTypeInfo: 10,
            hasExamples: 10,
            clarity: 0.1,
            complexity: 0.05
        };

        Object.entries(weights).forEach(([key, weight]) => {
            if (analysis[key] === true) {
                score += weight;
            } else if (typeof analysis[key] === 'number') {
                score += (analysis[key] * weight) / 100;
            }
        });

        return Math.min(100, Math.round(score));
    }

    generateOptimizations() {
        console.log(chalk.yellow('⚡ Generating Optimizations...\n'));

        this.prompts.forEach(prompt => {
            const optimization = {
                original: prompt,
                improvements: [],
                optimizedPrompt: '',
                expectedImprovement: 0
            };

            // Generate specific improvements
            if (!prompt.analysis.hasContext) {
                optimization.improvements.push({
                    type: 'context',
                    description: 'Add specific context and purpose',
                    impact: 15
                });
            }

            if (!prompt.analysis.hasSpecificity) {
                optimization.improvements.push({
                    type: 'specificity',
                    description: 'Add placeholders and specific requirements',
                    impact: 20
                });
            }

            if (!prompt.analysis.hasErrorHandling) {
                optimization.improvements.push({
                    type: 'error-handling',
                    description: 'Request error handling and validation',
                    impact: 20
                });
            }

            if (!prompt.analysis.hasTypeInfo) {
                optimization.improvements.push({
                    type: 'types',
                    description: 'Specify TypeScript types and interfaces',
                    impact: 10
                });
            }

            // Generate optimized prompt
            optimization.optimizedPrompt = this.createOptimizedPrompt(prompt);
            optimization.expectedImprovement = optimization.improvements.reduce((sum, imp) => sum + imp.impact, 0);

            this.optimizations.push(optimization);
        });
    }

    createOptimizedPrompt(prompt) {
        const optimizationTemplates = {
            'basic-function': '// Create a {specific function name} that {purpose/functionality} with: 1) Input validation for {parameters}, 2) Proper error handling, 3) TypeScript types, 4) JSDoc documentation, 5) Unit tests',
            
            'add-auth': '// Implement JWT authentication for {Express.js/Next.js/etc} application with: 1) Login/logout endpoints, 2) Token validation middleware, 3) Refresh token logic, 4) Proper error responses, 5) TypeScript interfaces, 6) Rate limiting, 7) Security best practices',
            
            'fix-bug': '// Debug and fix {specific issue description} in {component/function name}. The expected behavior is {description}. Current error: {error message}. Please: 1) Identify root cause, 2) Provide fix with explanation, 3) Add prevention measures, 4) Include tests',
            
            'create-component': '// Create a React {component type} component for {specific purpose} with: 1) TypeScript props interface, 2) State management using {useState/useReducer}, 3) Error boundaries, 4) Accessibility features, 5) Responsive design, 6) Unit tests with React Testing Library',
            
            'api-endpoint': '// Create a {HTTP method} API endpoint at {/path} for {specific purpose} with: 1) Input validation using {validation library}, 2) Database operations with {ORM/database}, 3) Proper error responses, 4) Authentication/authorization, 5) TypeScript types, 6) API documentation, 7) Integration tests'
        };

        return optimizationTemplates[prompt.id] || this.generateGenericOptimization(prompt);
    }

    generateGenericOptimization(prompt) {
        let optimized = prompt.original;
        
        // Add context
        if (!prompt.analysis.hasContext) {
            optimized = optimized.replace('//', '// Create/Implement {specific item} for {specific purpose} in {technology stack} with:');
        }

        // Add requirements
        const requirements = [
            '1) Proper error handling and validation',
            '2) TypeScript types and interfaces',
            '3) Input validation for all parameters',
            '4) Comprehensive documentation',
            '5) Unit tests with appropriate framework'
        ];

        if (!prompt.analysis.hasRequirements) {
            optimized += '\n// Requirements:\n// ' + requirements.join('\n// ');
        }

        return optimized;
    }

    createImprovedPrompts() {
        console.log(chalk.yellow('🎯 Creating Improved Prompt Library...\n'));

        const improvedPrompts = {
            'High-Quality Function Creation': {
                template: '// Create a {function name} function that {specific purpose} with: 1) Input validation for {parameter types}, 2) Comprehensive error handling, 3) TypeScript interfaces, 4) JSDoc documentation, 5) Unit tests covering edge cases, 6) Performance optimization',
                example: '// Create a validateUserData function that validates user registration data with: 1) Input validation for email, password, and name, 2) Comprehensive error handling for invalid formats, 3) TypeScript interfaces for UserData and ValidationResult, 4) JSDoc documentation, 5) Unit tests covering edge cases, 6) Performance optimization for large datasets',
                effectiveness: 95
            },
            
            'Robust API Development': {
                template: '// Implement a {HTTP method} API endpoint at {path} for {purpose} using {framework} with: 1) Request validation using {validation library}, 2) Database operations with {ORM}, 3) Proper HTTP status codes and error responses, 4) Authentication/authorization, 5) Rate limiting, 6) TypeScript types, 7) OpenAPI documentation, 8) Integration tests',
                example: '// Implement a POST API endpoint at /api/users for user registration using Express.js with: 1) Request validation using Joi, 2) Database operations with Prisma, 3) Proper HTTP status codes and error responses, 4) JWT authentication, 5) Rate limiting with express-rate-limit, 6) TypeScript types, 7) OpenAPI documentation, 8) Integration tests with Jest and Supertest',
                effectiveness: 98
            },
            
            'Advanced React Components': {
                template: '// Create a {component type} React component for {specific purpose} with: 1) TypeScript props and state interfaces, 2) Custom hooks for {functionality}, 3) Error boundaries and loading states, 4) Accessibility features (ARIA labels, keyboard navigation), 5) Responsive design with {CSS framework}, 6) Performance optimization (memo, useMemo, useCallback), 7) Unit tests with React Testing Library',
                example: '// Create a DataTable React component for displaying user data with: 1) TypeScript props and state interfaces, 2) Custom hooks for sorting and filtering, 3) Error boundaries and loading states, 4) Accessibility features (ARIA labels, keyboard navigation), 5) Responsive design with Tailwind CSS, 6) Performance optimization (memo, useMemo, useCallback), 7) Unit tests with React Testing Library',
                effectiveness: 96
            },
            
            'Comprehensive Error Handling': {
                template: '// Add comprehensive error handling to {function/component} with: 1) Specific error types for different failure scenarios, 2) Proper error logging with context, 3) User-friendly error messages, 4) Recovery mechanisms where possible, 5) Error boundaries (for React), 6) Monitoring integration, 7) TypeScript error interfaces',
                example: '// Add comprehensive error handling to the payment processing function with: 1) Specific error types for network, validation, and payment failures, 2) Proper error logging with user context, 3) User-friendly error messages, 4) Retry mechanisms for transient failures, 5) Payment failure recovery, 6) Sentry monitoring integration, 7) TypeScript error interfaces',
                effectiveness: 94
            },
            
            'Database Integration': {
                template: '// Implement database operations for {entity} using {ORM/database} with: 1) CRUD operations with proper validation, 2) Transaction handling for complex operations, 3) Query optimization and indexing, 4) Connection pooling configuration, 5) Migration scripts, 6) TypeScript types for entities, 7) Integration tests with test database',
                example: '// Implement database operations for User entity using Prisma with: 1) CRUD operations with proper validation, 2) Transaction handling for user registration with profile creation, 3) Query optimization and indexing for search operations, 4) Connection pooling configuration, 5) Migration scripts for schema changes, 6) TypeScript types for User and Profile entities, 7) Integration tests with test database',
                effectiveness: 97
            }
        };

        this.improvedPrompts = improvedPrompts;
    }

    generateOptimizationReport() {
        console.log(chalk.green('\n📋 JULES OPTIMIZATION REPORT\n'));

        console.log(chalk.green(`🎯 Average Effectiveness Improvement: ${Math.round(this.optimizations.reduce((sum, opt) => sum + opt.expectedImprovement, 0) / this.optimizations.length)}%`));
        console.log(chalk.green(`📊 Prompts Analyzed: ${this.prompts.length}`));
        console.log(chalk.green(`⚡ Optimizations Generated: ${this.optimizations.length}`));

        console.log(chalk.blue('\n🔧 Common Optimization Areas:'));
        const improvementTypes = {};
        this.optimizations.forEach(opt => {
            opt.improvements.forEach(imp => {
                improvementTypes[imp.type] = (improvementTypes[imp.type] || 0) + 1;
            });
        });

        Object.entries(improvementTypes)
            .sort(([,a], [,b]) => b - a)
            .forEach(([type, count]) => {
                console.log(chalk.blue(`  • ${type}: ${count} prompts need improvement`));
            });

        console.log(chalk.yellow('\n💡 Sample Optimizations:'));
        this.optimizations.slice(0, 2).forEach((opt, index) => {
            console.log(chalk.yellow(`\n${index + 1}. ${opt.original.category} Prompt:`));
            console.log(chalk.red(`   Before: ${opt.original.original}`));
            console.log(chalk.green(`   After: ${opt.optimizedPrompt.substring(0, 100)}...`));
            console.log(chalk.blue(`   Expected Improvement: +${opt.expectedImprovement}%`));
        });

        console.log(chalk.green('\n🏆 High-Quality Prompt Templates:'));
        Object.entries(this.improvedPrompts).slice(0, 3).forEach(([name, prompt]) => {
            console.log(chalk.green(`  • ${name}: ${prompt.effectiveness}% effectiveness`));
        });

        // Save detailed report
        const report = {
            summary: {
                totalPrompts: this.prompts.length,
                averageEffectiveness: this.qualityMetrics.averageEffectiveness,
                optimizationsGenerated: this.optimizations.length,
                improvementAreas: improvementTypes
            },
            optimizations: this.optimizations,
            improvedPrompts: this.improvedPrompts,
            recommendations: this.generateRecommendations(),
            timestamp: new Date().toISOString()
        };

        fs.writeFileSync('jules-optimization-report.json', JSON.stringify(report, null, 2));
        console.log(chalk.green('\n📄 Detailed optimization report saved to jules-optimization-report.json'));
    }

    generateRecommendations() {
        return [
            {
                title: 'Use Specific Context',
                description: 'Always provide specific context about your project, tech stack, and requirements',
                impact: 'high',
                example: 'Instead of "Create a function", use "Create a validateEmail function for user registration in a Node.js Express API"'
            },
            {
                title: 'Request Quality Attributes',
                description: 'Explicitly request error handling, validation, types, and tests',
                impact: 'high',
                example: 'Add "with proper error handling, TypeScript types, input validation, and unit tests"'
            },
            {
                title: 'Specify Implementation Details',
                description: 'Include specific libraries, frameworks, and patterns to follow',
                impact: 'medium',
                example: 'Mention "using Joi for validation, Prisma for database, and Jest for testing"'
            },
            {
                title: 'Use Iterative Improvement',
                description: 'Use Jules to review and improve generated code',
                impact: 'medium',
                example: 'Follow up with "Review this code for security issues and performance optimizations"'
            }
        ];
    }
}

// Run the optimization
const optimizer = new JulesOptimizer();
optimizer.optimize();