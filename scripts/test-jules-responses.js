#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

class JulesResponseTester {
    constructor() {
        this.testCases = [];
        this.results = [];
        this.qualityMetrics = {};
    }

    async runTests() {
        console.log(chalk.blue('🧪 Jules AI Response Quality Testing Suite\n'));
        
        this.generateTestCases();
        await this.runQualityTests();
        await this.runStabilityTests();
        await this.runAccuracyTests();
        this.generateReport();
    }

    generateTestCases() {
        this.testCases = [
            {
                id: 'async-handling',
                category: 'Async Operations',
                prompt: '// Create an async function to fetch user data with error handling',
                expectedPatterns: [
                    'async function',
                    'try.*catch',
                    'await',
                    'throw|error',
                    'response\\.ok|status'
                ],
                commonIssues: [
                    'Missing await keyword',
                    'No error handling',
                    'Not checking response status'
                ],
                weight: 10
            },
            {
                id: 'react-state',
                category: 'React Components',
                prompt: '// Create a React component with state management for a todo list',
                expectedPatterns: [
                    'useState',
                    'useEffect',
                    'interface|type',
                    'key=',
                    'onClick|onChange'
                ],
                commonIssues: [
                    'Direct state mutation',
                    'Missing keys in lists',
                    'No TypeScript types'
                ],
                weight: 9
            },
            {
                id: 'error-boundaries',
                category: 'Error Handling',
                prompt: '// Add comprehensive error handling to this API endpoint function',
                expectedPatterns: [
                    'try.*catch',
                    'instanceof',
                    'status.*code',
                    'logger|console',
                    'throw.*Error'
                ],
                commonIssues: [
                    'Generic error handling',
                    'No error logging',
                    'Missing error types'
                ],
                weight: 10
            },
            {
                id: 'typescript-types',
                category: 'TypeScript',
                prompt: '// Define TypeScript interfaces for a user management system',
                expectedPatterns: [
                    'interface',
                    'type',
                    'string|number|boolean',
                    'optional\\?',
                    'extends|implements'
                ],
                commonIssues: [
                    'Using any type',
                    'Missing optional properties',
                    'No interface inheritance'
                ],
                weight: 8
            },
            {
                id: 'input-validation',
                category: 'Validation',
                prompt: '// Add input validation to a form submission function',
                expectedPatterns: [
                    'validate|check',
                    'required|mandatory',
                    'length|min|max',
                    'email|pattern',
                    'throw|return.*error'
                ],
                commonIssues: [
                    'No validation logic',
                    'Missing required field checks',
                    'No format validation'
                ],
                weight: 9
            }
        ];

        console.log(chalk.green(`✅ Generated ${this.testCases.length} test cases\n`));
    }

    async runQualityTests() {
        console.log(chalk.yellow('🔍 Running Quality Tests...\n'));

        for (const testCase of this.testCases) {
            const result = {
                testCase: testCase.id,
                category: testCase.category,
                prompt: testCase.prompt,
                timestamp: new Date().toISOString(),
                qualityScore: 0,
                issues: [],
                suggestions: [],
                patterns: {
                    found: [],
                    missing: []
                }
            };

            // Simulate Jules response analysis
            const mockResponse = this.generateMockJulesResponse(testCase);
            result.response = mockResponse;

            // Analyze response quality
            this.analyzeResponseQuality(testCase, mockResponse, result);
            
            this.results.push(result);
            
            console.log(chalk.blue(`📝 Tested: ${testCase.category} - Score: ${result.qualityScore}%`));
        }
    }

    generateMockJulesResponse(testCase) {
        // Simulate different quality levels of Jules responses
        const qualityLevel = Math.random();
        
        if (qualityLevel > 0.7) {
            // High quality response
            return this.generateHighQualityResponse(testCase);
        } else if (qualityLevel > 0.4) {
            // Medium quality response
            return this.generateMediumQualityResponse(testCase);
        } else {
            // Low quality response
            return this.generateLowQualityResponse(testCase);
        }
    }

    generateHighQualityResponse(testCase) {
        const responses = {
            'async-handling': `async function fetchUserData(userId: string): Promise<User> {
  try {
    const response = await fetch(\`/api/users/\${userId}\`);
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    throw new Error('Unable to retrieve user information');
  }
}`,
            'react-state': `interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');

  const addTodo = () => {
    if (inputValue.trim()) {
      setTodos(prev => [...prev, {
        id: Date.now().toString(),
        text: inputValue,
        completed: false
      }]);
      setInputValue('');
    }
  };

  return (
    <div>
      {todos.map(todo => (
        <div key={todo.id}>{todo.text}</div>
      ))}
    </div>
  );
};`
        };
        
        return responses[testCase.id] || 'High quality mock response';
    }

    generateMediumQualityResponse(testCase) {
        const responses = {
            'async-handling': `async function fetchUserData(userId) {
  try {
    const response = await fetch('/api/users/' + userId);
    return response.json();
  } catch (error) {
    console.log('Error:', error);
  }
}`,
            'react-state': `const TodoList = () => {
  const [todos, setTodos] = useState([]);

  const addTodo = (text) => {
    todos.push({ id: Date.now(), text });
    setTodos(todos);
  };

  return (
    <div>
      {todos.map(todo => <div>{todo.text}</div>)}
    </div>
  );
};`
        };
        
        return responses[testCase.id] || 'Medium quality mock response';
    }

    generateLowQualityResponse(testCase) {
        const responses = {
            'async-handling': `function fetchUserData(userId) {
  fetch('/api/users/' + userId).then(response => {
    return response.json();
  });
}`,
            'react-state': `const TodoList = () => {
  let todos = [];

  const addTodo = (text) => {
    todos.push(text);
  };

  return <div>{todos}</div>;
};`
        };
        
        return responses[testCase.id] || 'Low quality mock response';
    }

    analyzeResponseQuality(testCase, response, result) {
        let score = 0;
        const maxScore = 100;

        // Check for expected patterns
        testCase.expectedPatterns.forEach(pattern => {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(response)) {
                result.patterns.found.push(pattern);
                score += maxScore / testCase.expectedPatterns.length;
            } else {
                result.patterns.missing.push(pattern);
                result.issues.push(`Missing pattern: ${pattern}`);
            }
        });

        // Check for common issues
        testCase.commonIssues.forEach(issue => {
            if (this.detectIssue(issue, response)) {
                result.issues.push(issue);
                score -= 15; // Penalty for each issue
            }
        });

        // Additional quality checks
        if (response.length < 50) {
            result.issues.push('Response too short');
            score -= 20;
        }

        if (!response.includes('//') && !response.includes('/*')) {
            result.issues.push('No comments or documentation');
            score -= 10;
        }

        result.qualityScore = Math.max(0, Math.min(100, Math.round(score)));

        // Generate suggestions
        result.suggestions = this.generateSuggestions(result.issues, testCase);
    }

    detectIssue(issue, response) {
        const issuePatterns = {
            'Missing await keyword': () => response.includes('async') && !response.includes('await'),
            'No error handling': () => !response.includes('try') && !response.includes('catch'),
            'Direct state mutation': () => response.includes('.push(') || response.includes('.pop('),
            'Missing keys in lists': () => response.includes('.map(') && !response.includes('key='),
            'Using any type': () => response.includes(': any'),
            'No validation logic': () => !response.includes('validate') && !response.includes('check')
        };

        const detector = issuePatterns[issue];
        return detector ? detector() : false;
    }

    generateSuggestions(issues, testCase) {
        const suggestions = [];
        
        issues.forEach(issue => {
            const suggestionMap = {
                'Missing await keyword': 'Add await before async function calls',
                'No error handling': 'Wrap async operations in try-catch blocks',
                'Direct state mutation': 'Use setState with immutable updates',
                'Missing keys in lists': 'Add unique key prop to list items',
                'Using any type': 'Define specific TypeScript interfaces',
                'No validation logic': 'Add input validation before processing'
            };
            
            if (suggestionMap[issue]) {
                suggestions.push(suggestionMap[issue]);
            }
        });

        return suggestions;
    }

    async runStabilityTests() {
        console.log(chalk.yellow('\n⚖️  Running Stability Tests...\n'));
        
        // Test consistency across multiple runs
        const consistencyTest = {
            prompt: '// Create a simple React button component',
            runs: 5,
            results: []
        };

        for (let i = 0; i < consistencyTest.runs; i++) {
            const response = this.generateMockJulesResponse({ id: 'consistency-test' });
            consistencyTest.results.push(response);
        }

        // Analyze consistency
        const uniqueResponses = new Set(consistencyTest.results);
        const consistencyScore = ((consistencyTest.runs - uniqueResponses.size + 1) / consistencyTest.runs) * 100;
        
        this.qualityMetrics.consistency = Math.round(consistencyScore);
        console.log(chalk.blue(`📊 Consistency Score: ${this.qualityMetrics.consistency}%`));
    }

    async runAccuracyTests() {
        console.log(chalk.yellow('\n🎯 Running Accuracy Tests...\n'));
        
        // Calculate overall accuracy
        const totalScore = this.results.reduce((sum, result) => sum + result.qualityScore, 0);
        const averageScore = Math.round(totalScore / this.results.length);
        
        this.qualityMetrics.accuracy = averageScore;
        this.qualityMetrics.totalTests = this.results.length;
        this.qualityMetrics.passedTests = this.results.filter(r => r.qualityScore >= 70).length;
        
        console.log(chalk.blue(`📊 Average Accuracy: ${this.qualityMetrics.accuracy}%`));
        console.log(chalk.blue(`📊 Tests Passed: ${this.qualityMetrics.passedTests}/${this.qualityMetrics.totalTests}`));
    }

    generateReport() {
        console.log(chalk.green('\n📋 JULES AI QUALITY TEST REPORT\n'));
        
        console.log(chalk.green(`✅ Overall Accuracy: ${this.qualityMetrics.accuracy}%`));
        console.log(chalk.green(`🔄 Consistency Score: ${this.qualityMetrics.consistency}%`));
        console.log(chalk.green(`📊 Success Rate: ${Math.round((this.qualityMetrics.passedTests / this.qualityMetrics.totalTests) * 100)}%`));
        
        console.log(chalk.blue('\n📊 Category Breakdown:'));
        const categoryStats = {};
        this.results.forEach(result => {
            if (!categoryStats[result.category]) {
                categoryStats[result.category] = { total: 0, sum: 0 };
            }
            categoryStats[result.category].total++;
            categoryStats[result.category].sum += result.qualityScore;
        });

        Object.entries(categoryStats).forEach(([category, stats]) => {
            const avgScore = Math.round(stats.sum / stats.total);
            console.log(chalk.blue(`  ${category}: ${avgScore}% (${stats.total} tests)`));
        });

        console.log(chalk.yellow('\n⚠️  Common Issues Found:'));
        const allIssues = this.results.flatMap(r => r.issues);
        const issueFrequency = {};
        allIssues.forEach(issue => {
            issueFrequency[issue] = (issueFrequency[issue] || 0) + 1;
        });

        Object.entries(issueFrequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .forEach(([issue, count]) => {
                console.log(chalk.yellow(`  • ${issue}: ${count} occurrences`));
            });

        // Save detailed report
        const report = {
            summary: this.qualityMetrics,
            results: this.results,
            timestamp: new Date().toISOString()
        };

        fs.writeFileSync('jules-quality-report.json', JSON.stringify(report, null, 2));
        console.log(chalk.green('\n📄 Detailed report saved to jules-quality-report.json'));
    }
}

// Run the tests
const tester = new JulesResponseTester();
tester.runTests();