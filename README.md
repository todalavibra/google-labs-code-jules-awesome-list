<p align="center">
  <img src="assets/jules-readme.png" alt="Jules Awesome List" width="600">
</p>

<div align="center">
  <h1>Awesome Jules Prompts 🌟</h1>
  <p>Curated prompts for Jules, an async coding agent from Google Labs.</p>
  <br>
  <a href="https://jules.google.com">Visit Jules</a> •
  <a href="#contributing">Contribute</a>
</div>

---

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Everyday Dev Tasks](#everyday-dev-tasks)
- [Debugging](#debugging)
- [Documentation](#documentation)
- [Testing](#testing)
- [Package Management](#package-management)
- [AI-Native Tasks](#ai-native-tasks)
- [Context](#context)
- [Fun \& Experimental](#fun--experimental)
- [Start from Scratch](#start-from-scratch)
- [Threat Modeling Integration](#threat-modeling-integration)
- [Contributing](#contributing)

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


## Documentation

- `// Write a README for this project`
  <sub>Any repo lacking a basic project overview.</sub>

- `// Add comments to this code`
  <sub>Improves maintainability of complex logic.</sub>

- `// Write API docs for this endpoint`
  <sub>REST or GraphQL backends.</sub>

- `// Generate Sphinx-style docstrings for this Python module/class/function...`
  <sub>Ideal for Python projects using Sphinx for documentation generation.</sub>



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



## Context

- `// Write a status update based on recent commits`
  <sub>Managerial and async communication.</sub>

- `// Summarize all changes in the last 7 days`
  <sub>Catching up after time off.</sub>



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

## Threat Modeling Integration

This project now includes a basic framework for performing threat modeling on application architectures.

**Core Components:**

*   **`architecture.py`**: Defines classes to represent your application's architecture (`Service`, `Database`, `NetworkZone`, `Application`).
    *   You can load your application architecture from a YAML file using the `load_architecture_from_yaml(file_path)` function.
*   **`threat_model.py`**: Defines classes for threat modeling concepts (`ThreatActor`, `AttackVector`, `Vulnerability`, `SecurityControl`, `IdentifiedAttackSurface`, `SuggestedControl`).
    *   `identify_attack_surfaces(application, known_vulnerabilities)`: Analyzes an `Application` object and a list of `Vulnerability` objects to find potential attack surfaces.
    *   `suggest_security_controls(attack_surfaces, available_controls)`: Suggests `SecurityControl`s for identified attack surfaces based on their vulnerabilities.

**Example YAML Files:**

*   **`example_architecture.yaml`**: Shows an example of how to define your application's services, databases, and network zones in YAML. This file can be loaded by `load_architecture_from_yaml`.
*   **`example_security_knowledge_base.yaml`**: Provides an example of how to define your threat actors, attack vectors, vulnerabilities, and security controls in YAML. This file can be loaded by `load_threat_intelligence_from_yaml` and now supports richer attributes for each entity.

**Example Usage (Conceptual):**

```python
# main_analyzer.py (Illustrative)
from typing import List # For type hinting
from architecture import load_architecture_from_yaml, Application
from threat_model import (
    load_threat_intelligence_from_yaml, # New loader
    identify_attack_surfaces, suggest_security_controls,
    IdentifiedAttackSurface, ThreatActor, AttackVector, Vulnerability, SecurityControl # For type hinting
)

# 1. Load application architecture
app_arch: Application = load_architecture_from_yaml("example_architecture.yaml")

# 2. Load threat intelligence data (actors, vectors, vulnerabilities, controls)
threat_actors: List[ThreatActor]
attack_vectors: List[AttackVector]
known_vulnerabilities: List[Vulnerability]
available_controls: List[SecurityControl]

threat_actors, attack_vectors, known_vulnerabilities, available_controls = \
    load_threat_intelligence_from_yaml("example_security_knowledge_base.yaml")

print(f"Loaded {len(threat_actors)} threat actors, {len(attack_vectors)} attack vectors, "
      f"{len(known_vulnerabilities)} vulnerabilities, and {len(available_controls)} security controls.")

# 3. Identify attack surfaces
surfaces: List[IdentifiedAttackSurface] = identify_attack_surfaces(app_arch, known_vulnerabilities)
print("\\n--- Identified Attack Surfaces ---")
for surface in surfaces:
    print(f"Surface: {surface.component_name} ({surface.component_type}) in {surface.network_zone}")
    print(f"  Reason: {surface.reason}")
    if surface.potential_vulnerabilities:
        print("  Potential Vulnerabilities:")
        for vuln in surface.potential_vulnerabilities:
            cvss_info = f", CVSS: {vuln.cvss_score}" if vuln.cvss_score is not None else ""
            cve_info = f", CVE: {vuln.cve_id}" if vuln.cve_id else ""
            print(f"    - {vuln.name} (Severity: {vuln.severity}{cvss_info}{cve_info})")
            print(f"      Attack Vector: {vuln.attack_vector.name} (CWE: {vuln.attack_vector.cwe_id if vuln.attack_vector.cwe_id else 'N/A'})")
            print(f"      Impact: {vuln.impact_description}")
            print(f"      Exploitability: {vuln.exploitability}")


# 4. Suggest security controls
print("\\n--- Suggested Security Controls ---")
suggestions = suggest_security_controls(surfaces, available_controls)
for suggestion in suggestions:
    print(f"Control: {suggestion.control.name} for {suggestion.applies_to_surface.component_name}")
    print(f"  Description: {suggestion.control.description}")
    print(f"  Reason: {suggestion.reason_for_suggestion}") # This is now very detailed
    print(f"  Status: {suggestion.control.implementation_status}, Owner: {suggestion.control.owner}")
    print(f"  Effectiveness: {suggestion.control.effectiveness}, Cost: {suggestion.control.cost_to_implement}")
    print(f"  Residual Risk: {suggestion.control.residual_risk}")
    if suggestion.control.related_vulnerabilities:
        print(f"  Specifically addresses: {', '.join(suggestion.control.related_vulnerabilities)}")

```

## Contributing

Your contributions are welcome! Add new prompts, fix formatting, or suggest categories.

- 📄 [Contributing Guide](contributing.md)
- 🪄 Open a [Pull Request](https://github.com/YOUR_REPO/pulls)
