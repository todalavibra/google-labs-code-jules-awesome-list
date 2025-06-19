<p align="center">
  <img src="assets/jules-readme.png" alt="Jules Awesome List" width="600">
</p>

<div align="center">
  <h1>Awesome Jules Prompts 🌟</h1>
  <p>Curated prompts for Jules, an async coding agent from Google Labs.</p>
  <br>
  <a href="https://jules.google.com">Visit Jules</a> •
  <a href="#contributing">Contribute</a> •
  <a href="#interactive-browser">Interactive Browser</a>
</div>

---

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Interactive Browser](#interactive-browser)
- [CLI Tools](#cli-tools)
- [Everyday Dev Tasks](#everyday-dev-tasks)
- [Debugging](#debugging)
- [Documentation](#documentation)
- [Testing](#testing)
- [Package Management](#package-management)
- [AI-Native Tasks](#ai-native-tasks)
- [Context](#context)
- [Fun \& Experimental](#fun--experimental)
- [Start from Scratch](#start-from-scratch)
- [Performance \& Optimization](#performance--optimization)
- [Security](#security)
- [DevOps \& Deployment](#devops--deployment)
- [Contributing](#contributing)

---

## Interactive Browser

🚀 **NEW!** Browse prompts interactively with search, filtering, and favorites:

```bash
npm install
npm run dev
```

Features:
- 🔍 **Smart Search**: Find prompts by text, description, or technology
- 📂 **Category Filtering**: Browse by specific categories
- ⭐ **Favorites**: Save your most-used prompts
- 📋 **One-Click Copy**: Copy prompts to clipboard instantly
- 📊 **Statistics**: View prompt analytics and trends

## CLI Tools

Powerful command-line tools for prompt management:

```bash
# Validate prompt formatting and content
npm run validate

# Search prompts from terminal
npm run search "react testing"
npm run search "debug" --category "Debugging"

# Generate statistics and insights
npm run stats
```

---

## Everyday Dev Tasks

- `// Refactor {a specific} file from {x} to {y}...`
  <sub>General-purpose, applies to any language or repo.</sub>

- `// Add a test suite...`
  <sub>Useful for repos lacking test coverage.</sub>

- `// Add type hints to {a specific} Python function...`
  <sub>Python codebases transitioning to typed code.</sub>

- `// Generate mock data for {a specific} schema...`
  <sub>APIs, frontends, or test-heavy environments.</sub>

- `// Convert these commonJS modules to ES modules...`
  <sub>JS/TS projects modernizing legacy code.</sub>

- `// Turn this callback-based code into async/await...`
  <sub>JavaScript or Python codebases improving async logic.</sub>

- `// Implement a data class for this dictionary structure...`
  <sub>Useful for Python projects moving towards more structured data handling with `dataclasses` or Pydantic.</sub>

- `// Extract this repeated logic into a reusable utility function...`
  <sub>Reducing code duplication across components or modules.</sub>

- `// Add input validation to this API endpoint...`
  <sub>Improving data integrity and error handling in web services.</sub>

- `// Optimize this database query for better performance...`
  <sub>SQL optimization for slow-running queries.</sub>

## Debugging

- `// Help me fix {a specific} error...`
  <sub>For any repo where you're stuck on a runtime or build error.</sub>

- `// Why is {this specific snippet of code} slow?`
  <sub>Performance profiling for loops, functions, or queries.</sub>

- `// Trace why this value is undefined...`
  <sub>Frontend and backend JS/TS bugs.</sub>

- `// Diagnose this memory leak...`
  <sub>Server-side apps or long-running processes.</sub>

- `// Add logging to help debug this issue...`
  <sub>Useful when troubleshooting silent failures.</sub>

- `// Find race conditions in this async code`
  <sub>Concurrent systems in JS, Python, Go, etc.</sub>

- `// Add print statements to trace the execution flow of this Python script...`
  <sub>For debugging complex Python scripts or understanding unexpected behavior.</sub>

- `// Debug why this React component is re-rendering unnecessarily...`
  <sub>React performance optimization and debugging.</sub>

- `// Investigate why this API call is failing intermittently...`
  <sub>Network-related debugging for unreliable external services.</sub>

## Documentation

- `// Write a README for this project`
  <sub>Any repo lacking a basic project overview.</sub>

- `// Add comments to this code`
  <sub>Improves maintainability of complex logic.</sub>

- `// Write API docs for this endpoint`
  <sub>REST or GraphQL backends.</sub>

- `// Generate Sphinx-style docstrings for this Python module/class/function...`
  <sub>Ideal for Python projects using Sphinx for documentation generation.</sub>

- `// Create a changelog entry for these recent changes...`
  <sub>Maintaining version history and release notes.</sub>

- `// Write inline documentation for this complex algorithm...`
  <sub>Making difficult code more understandable for future maintainers.</sub>

- `// Generate OpenAPI/Swagger documentation for this REST API...`
  <sub>Automated API documentation for web services.</sub>

## Testing

- `// Add integration tests for this API endpoint`
  <sub>Express, FastAPI, Django, Flask apps.</sub>

- `// Write a test that mocks fetch`
  <sub>Browser-side fetch or axios logic.</sub>

- `// Convert this test from Mocha to Jest`
  <sub>JS test suite migrations.</sub>

- `// Generate property-based tests for this function`
  <sub>Functional or logic-heavy code.</sub>

- `// Simulate slow network conditions in this test suite`
  <sub>Web and mobile apps.</sub>

- `// Write a test to ensure backward compatibility for this function`
  <sub>Library or SDK maintainers.</sub>

- `// Write a Pytest fixture to mock this external API call...`
  <sub>For Python projects using Pytest and needing robust mocking for testing.</sub>

- `// Add end-to-end tests using Playwright for this user flow...`
  <sub>Testing complete user journeys in web applications.</sub>

- `// Create performance benchmarks for this critical function...`
  <sub>Ensuring performance doesn't regress over time.</sub>

## Package Management

- `// Upgrade my linter and autofix breaking config changes`
  <sub>JS/TS repos using ESLint or Prettier.</sub>

- `// Show me the changelog for React 19`
  <sub>Web frontend apps using React.</sub>

- `// Which dependencies can I safely remove?`
  <sub>Bloated or legacy codebases.</sub>

- `// Check if these packages are still maintained`
  <sub>Security-conscious or long-term projects.</sub>

- `// Set up Renovate or Dependabot for auto-updates`
  <sub>Best for active projects with CI/CD.</sub>

- `// Audit this project for security vulnerabilities...`
  <sub>Regular security maintenance for production applications.</sub>

- `// Migrate from npm to pnpm/yarn for better performance...`
  <sub>Package manager optimization for large projects.</sub>

## AI-Native Tasks

- `// Analyze this repo and generate 3 feature ideas`
  <sub>Vision-stage or greenfield products.</sub>

- `// Identify tech debt in this file`
  <sub>Codebases with messy or fragile logic.</sub>

- `// Find duplicate logic across files`
  <sub>Sprawling repos lacking DRY practices.</sub>

- `// Cluster related functions and suggest refactors`
  <sub>Projects with lots of utils or helpers.</sub>

- `// Help me scope this issue so Jules can solve it`
  <sub>For working with Jules on real issues.</sub>

- `// Convert this function into a reusable plugin/module`
  <sub>Componentizing logic-heavy code.</sub>

- `// Refactor this Python function to be more amenable to parallel processing (e.g., using multiprocessing or threading)...`
  <sub>For optimizing performance in computationally intensive Python applications.</sub>

- `// Suggest architectural improvements for this microservice...`
  <sub>System design optimization for scalable applications.</sub>

- `// Generate comprehensive error handling for this module...`
  <sub>Improving robustness and user experience.</sub>

## Context

- `// Write a status update based on recent commits`
  <sub>Managerial and async communication.</sub>

- `// Summarize all changes in the last 7 days`
  <sub>Catching up after time off.</sub>

- `// Explain the architecture of this codebase to a new team member...`
  <sub>Onboarding and knowledge transfer.</sub>

- `// Create a technical decision record for this design choice...`
  <sub>Documenting important architectural decisions.</sub>

## Fun & Experimental

- `// Add a confetti animation when {a specific} action succeeds`
  <sub>Frontend web apps with user delight moments.</sub>

- `// Inject a developer joke when {a specific} build finishes`
  <sub>Personal projects or team tools.</sub>

- `// Build a mini CLI game that runs in the terminal`
  <sub>For learning or community fun.</sub>

- `// Add a dark mode Easter egg to this UI`
  <sub>Design-heavy frontend projects.</sub>

- `// Turn this tool into a GitHub App`
  <sub>Reusable, platform-integrated tools.</sub>

- `// Create an ASCII art generator for this data...`
  <sub>Fun visualization for terminal applications.</sub>

- `// Add keyboard shortcuts for power users...`
  <sub>Improving UX for frequent users of web applications.</sub>

## Start from Scratch

- `// What's going on in this repo?`
  <sub>Great for legacy repos or onboarding onto unfamiliar code.</sub>

- `// Initialize a new Express app with CORS enabled`
  <sub>Web backend projects using Node.js and Express.</sub>

- `// Set up a monorepo using Turborepo and PNPM`
  <sub>Multi-package JS/TS projects with shared dependencies.</sub>

- `// Bootstrap a Python project with Poetry and Pytest`
  <sub>Python repos aiming for clean dependency and test setup.</sub>

- `// Create a starter template for a Chrome extension`
  <sub>Browser extension development.</sub>

- `// I want to build a web scraper—start me off`
  <sub>Data scraping or automation tools using Python/Node.</sub>

- `// Set up a React app with TypeScript and Tailwind CSS...`
  <sub>Modern frontend development with popular tooling.</sub>

- `// Initialize a FastAPI project with database integration...`
  <sub>Python web API development with async capabilities.</sub>

## Performance & Optimization

- `// Profile this function and identify bottlenecks...`
  <sub>Performance analysis for slow-running code.</sub>

- `// Optimize this React component for better rendering performance...`
  <sub>Frontend optimization using React best practices.</sub>

- `// Add caching to this expensive database query...`
  <sub>Backend performance improvement for data-heavy applications.</sub>

- `// Implement lazy loading for this image gallery...`
  <sub>Web performance optimization for media-rich applications.</sub>

- `// Bundle analyze this webpack build and suggest optimizations...`
  <sub>JavaScript build optimization for faster load times.</sub>

- `// Add database indexing for these slow queries...`
  <sub>Database performance tuning for better response times.</sub>

## Security

- `// Add input sanitization to prevent XSS attacks...`
  <sub>Web application security hardening.</sub>

- `// Implement rate limiting for this API endpoint...`
  <sub>Protecting APIs from abuse and DoS attacks.</sub>

- `// Add authentication middleware to protect these routes...`
  <sub>Securing web applications with proper auth.</sub>

- `// Scan this code for potential security vulnerabilities...`
  <sub>Security audit for production applications.</sub>

- `// Implement CSRF protection for this form...`
  <sub>Web security best practices for user input.</sub>

- `// Add environment variable validation for sensitive config...`
  <sub>Preventing configuration-related security issues.</sub>

## DevOps & Deployment

- `// Set up a CI/CD pipeline for this project...`
  <sub>Automating build, test, and deployment processes.</sub>

- `// Create a Dockerfile for this application...`
  <sub>Containerizing applications for consistent deployment.</sub>

- `// Add health checks to this service...`
  <sub>Monitoring and reliability for production services.</sub>

- `// Set up monitoring and alerting for this API...`
  <sub>Production observability and incident response.</sub>

- `// Create a deployment script with rollback capability...`
  <sub>Safe deployment practices for production systems.</sub>

- `// Add environment-specific configuration management...`
  <sub>Managing different settings across dev, staging, and production.</sub>

## Contributing

Your contributions are welcome! Add new prompts, fix formatting, or suggest categories.

- 📄 [Contributing Guide](contributing.md)
- 🪄 Open a [Pull Request](https://github.com/YOUR_REPO/pulls)
- 🔍 Use our [validation tools](#cli-tools) to ensure quality
- 🌐 Test prompts in the [interactive browser](#interactive-browser)

### Quality Guidelines

- Keep prompts concise and actionable
- Use placeholders `{like this}` for customizable parts
- Include relevant context in descriptions
- Test prompts with Jules before submitting
- Follow the established formatting patterns