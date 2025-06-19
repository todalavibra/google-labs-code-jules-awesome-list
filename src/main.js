import { marked } from 'marked';
import Fuse from 'fuse.js';

class JulesCodingImprovementPlatform {
    constructor() {
        this.codingPatterns = [];
        this.errorPatterns = [];
        this.improvementSuggestions = [];
        this.benchmarkData = [];
        this.qualityMetrics = {};
        this.stabilityScore = 0;
        this.currentView = 'dashboard';
        this.testResults = JSON.parse(localStorage.getItem('jules-test-results') || '[]');
        this.errorAnalysis = JSON.parse(localStorage.getItem('jules-error-analysis') || '{}');
        this.improvementHistory = JSON.parse(localStorage.getItem('jules-improvements') || '[]');
        this.init();
    }

    async init() {
        await this.loadCodingPatterns();
        await this.loadErrorPatterns();
        await this.generateImprovementSuggestions();
        this.calculateStabilityScore();
        this.render();
        this.bindEvents();
        this.startRealTimeMonitoring();
    }

    async loadCodingPatterns() {
        // Load common coding patterns that Jules struggles with
        this.codingPatterns = [
            {
                id: 'async-await-pattern',
                name: 'Async/Await Implementation',
                description: 'Proper async/await usage with error handling',
                commonErrors: [
                    'Missing await keywords',
                    'Improper error handling in async functions',
                    'Not returning promises correctly'
                ],
                improvedPrompt: '// Implement async function with proper error handling and await usage for {specific operation}',
                originalPrompt: '// Make this async',
                stabilityImprovement: 85,
                examples: [
                    {
                        bad: `async function fetchData() {
  const data = fetch('/api/data');
  return data.json();
}`,
                        good: `async function fetchData() {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
}`
                    }
                ]
            },
            {
                id: 'error-handling-pattern',
                name: 'Comprehensive Error Handling',
                description: 'Robust error handling with proper logging and recovery',
                commonErrors: [
                    'Generic try-catch blocks',
                    'Silent error swallowing',
                    'No error recovery mechanisms'
                ],
                improvedPrompt: '// Add comprehensive error handling with specific error types, logging, and recovery strategies for {function/operation}',
                originalPrompt: '// Add error handling',
                stabilityImprovement: 92,
                examples: [
                    {
                        bad: `try {
  processData(data);
} catch (e) {
  console.log('Error');
}`,
                        good: `try {
  processData(data);
} catch (error) {
  if (error instanceof ValidationError) {
    logger.warn('Data validation failed:', error.message);
    return { success: false, error: 'Invalid data format' };
  } else if (error instanceof NetworkError) {
    logger.error('Network error:', error);
    // Retry logic or fallback
    return await retryOperation(() => processData(data));
  } else {
    logger.error('Unexpected error:', error);
    throw new ProcessingError('Failed to process data', { cause: error });
  }
}`
                    }
                ]
            },
            {
                id: 'type-safety-pattern',
                name: 'TypeScript Type Safety',
                description: 'Proper TypeScript usage with strict typing',
                commonErrors: [
                    'Using any type excessively',
                    'Missing interface definitions',
                    'Weak type guards'
                ],
                improvedPrompt: '// Implement {functionality} with strict TypeScript types, interfaces, and proper type guards',
                originalPrompt: '// Add types',
                stabilityImprovement: 78,
                examples: [
                    {
                        bad: `function processUser(user: any) {
  return user.name.toUpperCase();
}`,
                        good: `interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

function processUser(user: User): string {
  if (!user || typeof user.name !== 'string') {
    throw new Error('Invalid user object');
  }
  return user.name.toUpperCase();
}

function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && 
         obj !== null && 
         'id' in obj && 
         'name' in obj && 
         'email' in obj;
}`
                    }
                ]
            },
            {
                id: 'state-management-pattern',
                name: 'React State Management',
                description: 'Proper React state management with hooks',
                commonErrors: [
                    'Direct state mutation',
                    'Missing dependency arrays',
                    'Infinite re-render loops'
                ],
                improvedPrompt: '// Implement React component with proper state management, useEffect dependencies, and immutable updates for {component functionality}',
                originalPrompt: '// Add state management',
                stabilityImprovement: 88,
                examples: [
                    {
                        bad: `const [users, setUsers] = useState([]);

useEffect(() => {
  fetchUsers().then(data => {
    users.push(...data);
    setUsers(users);
  });
});`,
                        good: `const [users, setUsers] = useState<User[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  let isMounted = true;
  
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchUsers();
      
      if (isMounted) {
        setUsers(prevUsers => [...prevUsers, ...data]);
      }
    } catch (err) {
      if (isMounted) {
        setError(err instanceof Error ? err.message : 'Failed to load users');
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  loadUsers();
  
  return () => {
    isMounted = false;
  };
}, []); // Empty dependency array - runs once on mount`
                    }
                ]
            },
            {
                id: 'api-integration-pattern',
                name: 'API Integration Best Practices',
                description: 'Robust API integration with proper error handling and retries',
                commonErrors: [
                    'No retry logic',
                    'Missing timeout handling',
                    'Poor error response handling'
                ],
                improvedPrompt: '// Create API integration for {endpoint} with retry logic, timeout handling, proper error responses, and loading states',
                originalPrompt: '// Add API call',
                stabilityImprovement: 90,
                examples: [
                    {
                        bad: `const fetchData = async () => {
  const response = await fetch('/api/data');
  return response.json();
};`,
                        good: `interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

const fetchData = async <T>(
  url: string, 
  options: RequestInit = {},
  retries = 3,
  timeout = 5000
): Promise<ApiResponse<T>> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
    }
    
    const data = await response.json();
    return { data, success: true };
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (retries > 0 && error.name !== 'AbortError') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchData(url, options, retries - 1, timeout);
    }
    
    return {
      data: null as T,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};`
                    }
                ]
            }
        ];
    }

    async loadErrorPatterns() {
        // Common error patterns Jules makes
        this.errorPatterns = [
            {
                id: 'missing-null-checks',
                name: 'Missing Null/Undefined Checks',
                frequency: 85,
                severity: 'high',
                description: 'Jules often forgets to add null/undefined checks',
                detection: /\.(\w+)\s*\(/g,
                solution: 'Add optional chaining (?.) and null checks before method calls',
                example: {
                    problematic: 'user.profile.getName()',
                    fixed: 'user?.profile?.getName?.()'
                }
            },
            {
                id: 'async-without-await',
                name: 'Async Functions Without Await',
                frequency: 78,
                severity: 'high',
                description: 'Calling async functions without await keyword',
                detection: /(\w+)\(\)(?!\s*\.then)/g,
                solution: 'Add await keyword before async function calls',
                example: {
                    problematic: 'const data = fetchData();',
                    fixed: 'const data = await fetchData();'
                }
            },
            {
                id: 'direct-state-mutation',
                name: 'Direct State Mutation',
                frequency: 72,
                severity: 'medium',
                description: 'Directly mutating React state instead of using setState',
                detection: /state\.\w+\s*=|\.push\(|\.pop\(|\.splice\(/g,
                solution: 'Use setState with immutable updates',
                example: {
                    problematic: 'state.items.push(newItem);',
                    fixed: 'setState(prev => ({ ...prev, items: [...prev.items, newItem] }));'
                }
            },
            {
                id: 'missing-error-handling',
                name: 'Missing Error Handling',
                frequency: 90,
                severity: 'high',
                description: 'Functions without proper error handling',
                detection: /async\s+function.*\{(?!.*try)/g,
                solution: 'Wrap async operations in try-catch blocks',
                example: {
                    problematic: 'async function getData() { return await fetch("/api"); }',
                    fixed: 'async function getData() { try { return await fetch("/api"); } catch (error) { throw new Error("Failed to fetch data"); } }'
                }
            },
            {
                id: 'weak-type-definitions',
                name: 'Weak TypeScript Types',
                frequency: 65,
                severity: 'medium',
                description: 'Using any type or missing interface definitions',
                detection: /:\s*any|function\s*\(/g,
                solution: 'Define proper interfaces and strict types',
                example: {
                    problematic: 'function process(data: any) { }',
                    fixed: 'interface ProcessData { id: string; value: number; } function process(data: ProcessData) { }'
                }
            }
        ];
    }

    generateImprovementSuggestions() {
        this.improvementSuggestions = [
            {
                id: 'context-specific-prompts',
                title: 'Use Context-Specific Prompts',
                description: 'Provide detailed context about your project structure, tech stack, and requirements',
                impact: 'high',
                implementation: [
                    'Include file structure in prompts',
                    'Specify exact technologies and versions',
                    'Mention existing patterns in your codebase',
                    'Provide examples of similar implementations'
                ],
                example: {
                    bad: '// Add authentication',
                    good: '// Add JWT authentication middleware for Express.js API with TypeScript, including token validation, refresh logic, and proper error responses. Follow existing error handling patterns in /middleware/errorHandler.ts'
                }
            },
            {
                id: 'incremental-development',
                title: 'Break Down Complex Tasks',
                description: 'Split large features into smaller, manageable pieces',
                impact: 'high',
                implementation: [
                    'Start with basic structure',
                    'Add functionality incrementally',
                    'Test each piece before moving forward',
                    'Provide feedback on each iteration'
                ],
                example: {
                    bad: '// Build a complete user management system',
                    good: '// Step 1: Create User interface with basic properties (id, name, email)\n// Step 2: Add user validation functions\n// Step 3: Implement user CRUD operations\n// Step 4: Add authentication logic'
                }
            },
            {
                id: 'error-prevention-prompts',
                title: 'Include Error Prevention Requirements',
                description: 'Explicitly request error handling, validation, and edge case coverage',
                impact: 'high',
                implementation: [
                    'Always request error handling',
                    'Ask for input validation',
                    'Specify edge cases to handle',
                    'Request proper TypeScript types'
                ],
                example: {
                    bad: '// Create a function to process user data',
                    good: '// Create a function to process user data with: 1) Input validation for required fields, 2) Error handling for invalid data, 3) TypeScript interfaces, 4) Handle edge cases like empty arrays and null values'
                }
            },
            {
                id: 'testing-requirements',
                title: 'Include Testing Requirements',
                description: 'Request test cases and examples alongside implementation',
                impact: 'medium',
                implementation: [
                    'Ask for unit tests',
                    'Request example usage',
                    'Include edge case tests',
                    'Specify testing framework'
                ],
                example: {
                    bad: '// Create a utility function',
                    good: '// Create a utility function with Jest unit tests covering normal cases, edge cases, and error scenarios. Include JSDoc documentation and usage examples.'
                }
            },
            {
                id: 'code-review-prompts',
                title: 'Use Code Review Style Prompts',
                description: 'Ask Jules to review and improve existing code',
                impact: 'medium',
                implementation: [
                    'Provide existing code for review',
                    'Ask for specific improvements',
                    'Request security analysis',
                    'Ask for performance optimizations'
                ],
                example: {
                    bad: '// Fix this code',
                    good: '// Review this React component for: 1) Performance issues, 2) Memory leaks, 3) Accessibility problems, 4) TypeScript type safety, 5) Best practices violations. Provide specific fixes for each issue found.'
                }
            }
        ];
    }

    calculateStabilityScore() {
        // Calculate overall stability score based on error patterns and improvements
        const errorWeight = this.errorPatterns.reduce((sum, pattern) => sum + pattern.frequency, 0);
        const improvementWeight = this.improvementHistory.length * 10;
        const testSuccessRate = this.testResults.length > 0 ? 
            (this.testResults.filter(r => r.success).length / this.testResults.length) * 100 : 50;
        
        this.stabilityScore = Math.max(0, Math.min(100, 
            100 - (errorWeight / this.errorPatterns.length) + improvementWeight + (testSuccessRate * 0.3)
        ));
    }

    startRealTimeMonitoring() {
        // Simulate real-time monitoring of Jules performance
        setInterval(() => {
            this.updateMetrics();
        }, 30000); // Update every 30 seconds
    }

    updateMetrics() {
        // Simulate metric updates
        const randomImprovement = Math.random() * 5 - 2.5; // -2.5 to +2.5
        this.stabilityScore = Math.max(0, Math.min(100, this.stabilityScore + randomImprovement));
        
        if (this.currentView === 'dashboard') {
            this.renderDashboard();
        }
    }

    switchView(view) {
        this.currentView = view;
        this.renderCurrentView();
    }

    runQualityTest() {
        // Simulate running quality tests
        const testPrompts = [
            '// Create a React component with state management',
            '// Add error handling to this async function',
            '// Implement TypeScript interfaces for user data',
            '// Add input validation to this form'
        ];

        const results = testPrompts.map(prompt => ({
            prompt,
            timestamp: new Date().toISOString(),
            success: Math.random() > 0.3, // 70% success rate
            issues: this.detectIssues(prompt),
            suggestions: this.generateSuggestions(prompt)
        }));

        this.testResults = [...this.testResults, ...results].slice(-50); // Keep last 50 results
        localStorage.setItem('jules-test-results', JSON.stringify(this.testResults));
        
        this.showToast('Quality test completed!', 'success');
        this.renderCurrentView();
    }

    detectIssues(prompt) {
        const issues = [];
        
        if (prompt.length < 20) {
            issues.push('Prompt too short - lacks context');
        }
        
        if (!prompt.includes('{') && !prompt.includes('...')) {
            issues.push('Missing placeholders for customization');
        }
        
        if (!/error|validation|type|test/i.test(prompt)) {
            issues.push('Missing quality requirements (error handling, validation, types, tests)');
        }
        
        return issues;
    }

    generateSuggestions(prompt) {
        const suggestions = [];
        
        if (!prompt.includes('error')) {
            suggestions.push('Add "with proper error handling" to the prompt');
        }
        
        if (!prompt.includes('TypeScript') && !prompt.includes('type')) {
            suggestions.push('Specify TypeScript types and interfaces');
        }
        
        if (!prompt.includes('test')) {
            suggestions.push('Request unit tests alongside implementation');
        }
        
        return suggestions;
    }

    exportImprovements() {
        const exportData = {
            codingPatterns: this.codingPatterns,
            errorPatterns: this.errorPatterns,
            improvementSuggestions: this.improvementSuggestions,
            testResults: this.testResults,
            stabilityScore: this.stabilityScore,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jules-improvements-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('Improvements exported successfully!', 'success');
    }

    showToast(message, type = 'info') {
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            warning: 'bg-yellow-500',
            info: 'bg-blue-500'
        };
        
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    render() {
        const app = document.getElementById('app');
        app.innerHTML = this.renderLayout();
        this.renderCurrentView();
    }

    renderLayout() {
        return `
            <div class="min-h-screen bg-gray-50">
                <!-- Navigation -->
                <nav class="gradient-bg shadow-lg">
                    <div class="container mx-auto px-4">
                        <div class="flex items-center justify-between h-16">
                            <div class="flex items-center space-x-4">
                                <i class="fas fa-code-branch text-white text-2xl"></i>
                                <h1 class="text-white text-xl font-bold">Jules AI Coding Improvement Platform</h1>
                            </div>
                            <div class="flex items-center space-x-4">
                                <button 
                                    onclick="app.switchView('dashboard')"
                                    class="px-4 py-2 rounded-lg transition-colors ${this.currentView === 'dashboard' ? 'bg-white text-blue-600' : 'text-white hover:bg-white hover:bg-opacity-20'}"
                                >
                                    <i class="fas fa-tachometer-alt mr-2"></i>Dashboard
                                </button>
                                <button 
                                    onclick="app.switchView('patterns')"
                                    class="px-4 py-2 rounded-lg transition-colors ${this.currentView === 'patterns' ? 'bg-white text-blue-600' : 'text-white hover:bg-white hover:bg-opacity-20'}"
                                >
                                    <i class="fas fa-puzzle-piece mr-2"></i>Patterns
                                </button>
                                <button 
                                    onclick="app.switchView('errors')"
                                    class="px-4 py-2 rounded-lg transition-colors ${this.currentView === 'errors' ? 'bg-white text-blue-600' : 'text-white hover:bg-white hover:bg-opacity-20'}"
                                >
                                    <i class="fas fa-bug mr-2"></i>Error Analysis
                                </button>
                                <button 
                                    onclick="app.switchView('improvements')"
                                    class="px-4 py-2 rounded-lg transition-colors ${this.currentView === 'improvements' ? 'bg-white text-blue-600' : 'text-white hover:bg-white hover:bg-opacity-20'}"
                                >
                                    <i class="fas fa-lightbulb mr-2"></i>Improvements
                                </button>
                                <button 
                                    onclick="app.runQualityTest()"
                                    class="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <i class="fas fa-play mr-2"></i>Run Test
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                <!-- Main Content -->
                <div id="main-content" class="container mx-auto px-4 py-8">
                    <!-- Content will be rendered here -->
                </div>

                <!-- Floating Action Button -->
                <div class="floating-action">
                    <button 
                        onclick="app.exportImprovements()"
                        class="bg-green-600 hover:bg-green-700 text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                        title="Export Improvements"
                    >
                        <i class="fas fa-download text-xl"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderCurrentView() {
        const content = document.getElementById('main-content');
        if (!content) return;

        switch (this.currentView) {
            case 'dashboard':
                content.innerHTML = this.renderDashboard();
                break;
            case 'patterns':
                content.innerHTML = this.renderPatterns();
                break;
            case 'errors':
                content.innerHTML = this.renderErrorAnalysis();
                break;
            case 'improvements':
                content.innerHTML = this.renderImprovements();
                break;
        }

        this.bindEvents();
    }

    renderDashboard() {
        const successRate = this.testResults.length > 0 ? 
            Math.round((this.testResults.filter(r => r.success).length / this.testResults.length) * 100) : 0;
        
        const avgErrorFrequency = Math.round(
            this.errorPatterns.reduce((sum, p) => sum + p.frequency, 0) / this.errorPatterns.length
        );

        return `
            <div class="space-y-8">
                <!-- Header -->
                <div class="text-center">
                    <h2 class="text-3xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-chart-line text-blue-600 mr-3"></i>
                        Jules AI Stability Dashboard
                    </h2>
                    <p class="text-gray-600">Real-time monitoring and improvement tracking for Jules AI coding performance</p>
                </div>

                <!-- Key Metrics -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div class="bg-white rounded-xl p-6 shadow-lg text-center">
                        <div class="text-3xl font-bold text-blue-600 mb-2">${Math.round(this.stabilityScore)}%</div>
                        <div class="text-gray-600 mb-3">Stability Score</div>
                        <div class="stability-meter">
                            <div class="stability-indicator" style="left: ${this.stabilityScore}%"></div>
                        </div>
                    </div>
                    <div class="bg-white rounded-xl p-6 shadow-lg text-center">
                        <div class="text-3xl font-bold text-green-600 mb-2">${successRate}%</div>
                        <div class="text-gray-600">Success Rate</div>
                        <div class="text-sm text-gray-500 mt-2">Last ${this.testResults.length} tests</div>
                    </div>
                    <div class="bg-white rounded-xl p-6 shadow-lg text-center">
                        <div class="text-3xl font-bold text-red-600 mb-2">${avgErrorFrequency}%</div>
                        <div class="text-gray-600">Avg Error Rate</div>
                        <div class="text-sm text-gray-500 mt-2">Common patterns</div>
                    </div>
                    <div class="bg-white rounded-xl p-6 shadow-lg text-center">
                        <div class="text-3xl font-bold text-purple-600 mb-2">${this.improvementSuggestions.length}</div>
                        <div class="text-gray-600">Active Improvements</div>
                        <div class="text-sm text-gray-500 mt-2">Ready to implement</div>
                    </div>
                </div>

                <!-- Real-time Status -->
                <div class="bg-white rounded-xl p-6 shadow-lg">
                    <h3 class="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                        <i class="fas fa-heartbeat text-red-500 mr-3"></i>
                        Real-time Performance Monitor
                    </h3>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h4 class="font-semibold text-gray-700 mb-4">Recent Test Results</h4>
                            <div class="space-y-3 max-h-64 overflow-y-auto">
                                ${this.testResults.slice(-5).reverse().map(result => `
                                    <div class="flex items-center justify-between p-3 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
                                        <div class="flex items-center">
                                            <i class="fas fa-${result.success ? 'check-circle text-green-500' : 'times-circle text-red-500'} mr-3"></i>
                                            <div>
                                                <div class="font-medium text-sm">${result.prompt.substring(0, 50)}...</div>
                                                <div class="text-xs text-gray-500">${new Date(result.timestamp).toLocaleTimeString()}</div>
                                            </div>
                                        </div>
                                        <span class="text-xs font-medium ${result.success ? 'text-green-600' : 'text-red-600'}">
                                            ${result.success ? 'PASS' : 'FAIL'}
                                        </span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-700 mb-4">Critical Error Patterns</h4>
                            <div class="space-y-3">
                                ${this.errorPatterns.slice(0, 4).map(pattern => `
                                    <div class="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200">
                                        <div>
                                            <div class="font-medium text-sm">${pattern.name}</div>
                                            <div class="text-xs text-gray-500">${pattern.description}</div>
                                        </div>
                                        <div class="text-right">
                                            <div class="text-sm font-bold text-red-600">${pattern.frequency}%</div>
                                            <div class="text-xs text-gray-500">${pattern.severity}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="bg-white rounded-xl p-6 shadow-lg">
                    <h3 class="text-xl font-semibold text-gray-800 mb-6">Quick Actions</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button onclick="app.runQualityTest()" class="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left">
                            <i class="fas fa-play text-blue-600 text-xl mb-2"></i>
                            <div class="font-semibold text-blue-800">Run Quality Test</div>
                            <div class="text-sm text-blue-600">Test Jules with common coding scenarios</div>
                        </button>
                        <button onclick="app.switchView('patterns')" class="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left">
                            <i class="fas fa-puzzle-piece text-green-600 text-xl mb-2"></i>
                            <div class="font-semibold text-green-800">View Patterns</div>
                            <div class="text-sm text-green-600">Explore improved coding patterns</div>
                        </button>
                        <button onclick="app.exportImprovements()" class="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-left">
                            <i class="fas fa-download text-purple-600 text-xl mb-2"></i>
                            <div class="font-semibold text-purple-800">Export Data</div>
                            <div class="text-sm text-purple-600">Download improvement recommendations</div>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderPatterns() {
        return `
            <div class="space-y-8">
                <div class="text-center">
                    <h2 class="text-3xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-puzzle-piece text-blue-600 mr-3"></i>
                        Improved Coding Patterns
                    </h2>
                    <p class="text-gray-600">Proven patterns that improve Jules AI coding accuracy and stability</p>
                </div>

                <div class="space-y-6">
                    ${this.codingPatterns.map(pattern => `
                        <div class="improvement-card bg-white rounded-xl p-6 shadow-lg">
                            <div class="flex items-start justify-between mb-4">
                                <div>
                                    <h3 class="text-xl font-semibold text-gray-800 mb-2">${pattern.name}</h3>
                                    <p class="text-gray-600 mb-3">${pattern.description}</p>
                                    <div class="flex items-center space-x-4">
                                        <span class="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full">
                                            +${pattern.stabilityImprovement}% Stability
                                        </span>
                                        <span class="text-sm text-gray-500">${pattern.commonErrors.length} common errors addressed</span>
                                    </div>
                                </div>
                                <button class="text-gray-400 hover:text-blue-500 transition-colors">
                                    <i class="fas fa-copy text-lg"></i>
                                </button>
                            </div>

                            <!-- Prompt Comparison -->
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h4 class="font-semibold text-red-600 mb-3">❌ Original Prompt</h4>
                                    <div class="code-font bg-red-50 border border-red-200 rounded-lg p-4">
                                        <code class="text-red-700">${pattern.originalPrompt}</code>
                                    </div>
                                </div>
                                <div>
                                    <h4 class="font-semibold text-green-600 mb-3">✅ Improved Prompt</h4>
                                    <div class="code-font bg-green-50 border border-green-200 rounded-lg p-4">
                                        <code class="text-green-700">${pattern.improvedPrompt}</code>
                                    </div>
                                </div>
                            </div>

                            <!-- Code Examples -->
                            <div class="mb-6">
                                <h4 class="font-semibold text-gray-700 mb-3">Code Example Comparison</h4>
                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h5 class="text-sm font-medium text-red-600 mb-2">Problematic Code</h5>
                                        <div class="code-editor">
                                            <pre class="text-sm text-gray-300 p-4 overflow-x-auto"><code class="language-javascript">${pattern.examples[0].bad}</code></pre>
                                        </div>
                                    </div>
                                    <div>
                                        <h5 class="text-sm font-medium text-green-600 mb-2">Improved Code</h5>
                                        <div class="code-editor">
                                            <pre class="text-sm text-gray-300 p-4 overflow-x-auto"><code class="language-javascript">${pattern.examples[0].good}</code></pre>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Common Errors -->
                            <div>
                                <h4 class="font-semibold text-gray-700 mb-3">Common Errors Addressed</h4>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    ${pattern.commonErrors.map(error => `
                                        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                            <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                                            <span class="text-sm text-yellow-800">${error}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderErrorAnalysis() {
        return `
            <div class="space-y-8">
                <div class="text-center">
                    <h2 class="text-3xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-bug text-red-600 mr-3"></i>
                        Error Pattern Analysis
                    </h2>
                    <p class="text-gray-600">Common coding errors made by Jules AI and how to prevent them</p>
                </div>

                <!-- Error Statistics -->
                <div class="bg-white rounded-xl p-6 shadow-lg">
                    <h3 class="text-xl font-semibold text-gray-800 mb-6">Error Frequency Analysis</h3>
                    <div class="space-y-4">
                        ${this.errorPatterns.map(pattern => `
                            <div class="error-pattern rounded-lg p-4">
                                <div class="flex items-center justify-between mb-3">
                                    <div class="flex items-center">
                                        <i class="fas fa-exclamation-circle text-red-500 mr-3"></i>
                                        <div>
                                            <h4 class="font-semibold text-gray-800">${pattern.name}</h4>
                                            <p class="text-sm text-gray-600">${pattern.description}</p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-2xl font-bold text-red-600">${pattern.frequency}%</div>
                                        <div class="text-sm text-gray-500 capitalize">${pattern.severity} severity</div>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <h5 class="font-medium text-gray-700 mb-2">Problematic Pattern</h5>
                                        <div class="code-font bg-red-100 border border-red-300 rounded p-3">
                                            <code class="text-red-800">${pattern.example.problematic}</code>
                                        </div>
                                    </div>
                                    <div>
                                        <h5 class="font-medium text-gray-700 mb-2">Corrected Version</h5>
                                        <div class="code-font bg-green-100 border border-green-300 rounded p-3">
                                            <code class="text-green-800">${pattern.example.fixed}</code>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                                    <h5 class="font-medium text-blue-800 mb-1">Prevention Strategy</h5>
                                    <p class="text-sm text-blue-700">${pattern.solution}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Error Prevention Checklist -->
                <div class="bg-white rounded-xl p-6 shadow-lg">
                    <h3 class="text-xl font-semibold text-gray-800 mb-6">Error Prevention Checklist</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 class="font-semibold text-gray-700 mb-4">Before Prompting Jules</h4>
                            <div class="space-y-3">
                                <label class="flex items-center">
                                    <input type="checkbox" class="mr-3 text-blue-600">
                                    <span class="text-sm">Include specific context and requirements</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" class="mr-3 text-blue-600">
                                    <span class="text-sm">Request error handling explicitly</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" class="mr-3 text-blue-600">
                                    <span class="text-sm">Specify TypeScript types needed</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" class="mr-3 text-blue-600">
                                    <span class="text-sm">Mention existing code patterns to follow</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" class="mr-3 text-blue-600">
                                    <span class="text-sm">Ask for input validation</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-700 mb-4">After Receiving Code</h4>
                            <div class="space-y-3">
                                <label class="flex items-center">
                                    <input type="checkbox" class="mr-3 text-blue-600">
                                    <span class="text-sm">Check for null/undefined handling</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" class="mr-3 text-blue-600">
                                    <span class="text-sm">Verify async/await usage</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" class="mr-3 text-blue-600">
                                    <span class="text-sm">Review error handling coverage</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" class="mr-3 text-blue-600">
                                    <span class="text-sm">Test with edge cases</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" class="mr-3 text-blue-600">
                                    <span class="text-sm">Validate TypeScript compliance</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderImprovements() {
        return `
            <div class="space-y-8">
                <div class="text-center">
                    <h2 class="text-3xl font-bold text-gray-800 mb-4">
                        <i class="fas fa-lightbulb text-yellow-600 mr-3"></i>
                        Improvement Strategies
                    </h2>
                    <p class="text-gray-600">Proven strategies to get better, more stable code from Jules AI</p>
                </div>

                <div class="space-y-6">
                    ${this.improvementSuggestions.map(suggestion => `
                        <div class="improvement-suggestion rounded-xl p-6 shadow-lg">
                            <div class="flex items-start justify-between mb-4">
                                <div>
                                    <h3 class="text-xl font-semibold text-gray-800 mb-2">${suggestion.title}</h3>
                                    <p class="text-gray-600 mb-3">${suggestion.description}</p>
                                    <span class="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full capitalize">
                                        ${suggestion.impact} Impact
                                    </span>
                                </div>
                                <i class="fas fa-lightbulb text-yellow-500 text-2xl"></i>
                            </div>

                            <!-- Implementation Steps -->
                            <div class="mb-6">
                                <h4 class="font-semibold text-gray-700 mb-3">Implementation Steps</h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    ${suggestion.implementation.map((step, index) => `
                                        <div class="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                                            <span class="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">${index + 1}</span>
                                            <span class="text-sm text-gray-700">${step}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>

                            <!-- Example Comparison -->
                            <div>
                                <h4 class="font-semibold text-gray-700 mb-3">Example Comparison</h4>
                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div>
                                        <h5 class="text-sm font-medium text-red-600 mb-2">❌ Less Effective Prompt</h5>
                                        <div class="code-font bg-red-50 border border-red-200 rounded-lg p-4">
                                            <code class="text-red-700">${suggestion.example.bad}</code>
                                        </div>
                                    </div>
                                    <div>
                                        <h5 class="text-sm font-medium text-green-600 mb-2">✅ Improved Prompt</h5>
                                        <div class="code-font bg-green-50 border border-green-200 rounded-lg p-4">
                                            <code class="text-green-700">${suggestion.example.good}</code>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Quick Reference Card -->
                <div class="bg-white rounded-xl p-6 shadow-lg">
                    <h3 class="text-xl font-semibold text-gray-800 mb-6">Quick Reference: Prompt Templates</h3>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h4 class="font-semibold text-gray-700 mb-3">High-Quality Prompt Template</h4>
                            <div class="code-font bg-gray-100 border border-gray-300 rounded-lg p-4">
                                <code class="text-gray-800">
// {Action} {specific component/function} for {context}<br>
// Requirements:<br>
// 1. {Specific requirement 1}<br>
// 2. Include proper error handling<br>
// 3. Add TypeScript types/interfaces<br>
// 4. Include input validation<br>
// 5. Follow {existing pattern/convention}<br>
// 6. Add unit tests with Jest
                                </code>
                            </div>
                        </div>
                        <div>
                            <h4 class="font-semibold text-gray-700 mb-3">Code Review Template</h4>
                            <div class="code-font bg-gray-100 border border-gray-300 rounded-lg p-4">
                                <code class="text-gray-800">
// Review this {component/function} for:<br>
// 1. Performance issues and optimizations<br>
// 2. Security vulnerabilities<br>
// 3. Error handling completeness<br>
// 4. TypeScript type safety<br>
// 5. Best practices compliance<br>
// 6. Accessibility (if UI component)<br>
// Provide specific fixes for each issue found.
                                </code>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        // Add any additional event bindings here
    }
}

// Initialize the app
window.app = new JulesCodingImprovementPlatform();