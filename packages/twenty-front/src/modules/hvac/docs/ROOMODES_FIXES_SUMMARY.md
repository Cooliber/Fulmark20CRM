# .roomodes Syntax Fixes and TwentyCRM Integration Summary

## 🎯 Overview

This document summarizes the comprehensive fixes applied to the `.roomodes` file and its adaptation for TwentyCRM HVAC module development. The changes address syntax issues, integrate with TwentyCRM architecture, and adapt orchestrator modes to work with available development tools.

## 🔧 Issues Fixed

### 1. Syntax and Formatting Issues
- **Truncated Mode Definitions**: Many orchestrator modes had incomplete instructions due to line truncation
- **Inconsistent YAML Formatting**: Mixed indentation and malformed YAML structure
- **Missing Closing Brackets**: Several mode definitions were incomplete
- **Invalid Character Patterns**: Removed problematic vertical bar (|) and colon-hyphen (:---) patterns

### 2. Architecture Integration Issues
- **Generic File Paths**: Updated all file paths to TwentyCRM monorepo structure
- **Outdated Tool References**: Replaced deprecated tools with available ones
- **Missing .cursor Rules Integration**: Added references to .cursor/rules/ guidelines
- **Incompatible Instructions**: Adapted all instructions for TwentyCRM ecosystem

## 🏗️ TwentyCRM Integration Adaptations

### File Path Updates
```
OLD: docs/specifications/
NEW: packages/twenty-front/src/modules/hvac/docs/specifications/

OLD: docs/architecture/
NEW: packages/twenty-front/src/modules/hvac/docs/architecture/

OLD: packages/twenty-e2e-testing/tests/
NEW: packages/twenty-e2e-testing/tests/hvac/
```

### Tool Integration
- **codebase-retrieval**: For understanding TwentyCRM project structure
- **str-replace-editor**: For precise code modifications
- **view**: For examining files and directories
- **save-file**: For creating new documentation
- **launch-process**: For running tests and build commands
- **web-search & tavily-search**: For research and best practices

### Architecture Compliance
- Integration with `.cursor/rules/architecture.mdc`
- Compliance with TwentyCRM naming conventions (kebab-case)
- Integration with Twenty's navigation system
- Compatibility with Twenty's authentication and workspace systems
- GraphQL schema integration requirements

## 📋 Updated Orchestrator Modes

### Core Orchestrators
1. **orchestrator-state-scribe** - State management using available tools
2. **uber-orchestrator** - Master coordinator for TwentyCRM HVAC integration
3. **orchestrator-goal-clarification** - Requirements analysis for HVAC-CRM integration
4. **orchestrator-sparc-specification-phase** - Detailed specification creation
5. **orchestrator-sparc-refinement-implementation** - TDD implementation management

### Specialized Workers
1. **research-planner-strategic** - TwentyCRM-focused research
2. **spec-writer-comprehensive** - TwentyCRM-compatible specifications
3. **coder-test-driven** - React/NestJS implementation following Twenty patterns
4. **tester-tdd-master** - Jest and Playwright testing for TwentyCRM
5. **debugger-targeted** - TwentyCRM-specific debugging
6. **system-integrator** - HVAC module integration into TwentyCRM
7. **devils-advocate-critical-evaluator** - Critical evaluation with TwentyCRM context
8. **docs-writer-feature** - TwentyCRM HVAC documentation

## 🎨 TwentyCRM Pattern Compliance

### React Components
- Functional components with hooks
- Styled-components for styling
- Proper TypeScript types
- Integration with Twenty's design system

### NestJS Services
- Services with proper decorators
- Dependency injection patterns
- DTOs following Twenty's patterns
- GraphQL resolver compatibility

### Database Integration
- Entities following Twenty's ORM patterns
- Proper migrations
- Workspace-aware data models

### Testing Standards
- Jest tests alongside components
- Playwright E2E tests in dedicated directories
- Integration tests for Twenty's systems
- TDD following London School principles

## 📁 File Structure Updates

### Documentation Structure
```
packages/twenty-front/src/modules/hvac/docs/
├── specifications/          # Feature specifications
├── architecture/           # System architecture docs
├── pseudocode/            # Implementation pseudocode
├── test-plans/            # Testing strategies
├── progress/              # Development progress reports
├── reports/               # Debug and analysis reports
├── critiques/             # Critical evaluations
├── research/              # Research findings
└── user-guides/           # User documentation
```

### Implementation Structure
```
packages/twenty-front/src/modules/hvac/
├── components/            # React components
├── hooks/                # Custom hooks
├── services/             # Frontend services
└── docs/                 # Documentation

packages/twenty-server/src/modules/hvac/
├── services/             # NestJS services
├── resolvers/            # GraphQL resolvers
├── entities/             # Database entities
├── dtos/                 # Data transfer objects
└── docs/                 # API documentation
```

## 🔄 Quality Assurance Protocol

All orchestrator modes now include:
1. **Internal QA Protocol**: Generate plan → Evaluate → Score (must achieve 9.5+)
2. **TwentyCRM Compliance Check**: Verify architecture alignment with .cursor/rules/
3. **Integration Validation**: Ensure compatibility with Twenty's existing systems
4. **Documentation Standards**: Follow TwentyCRM documentation patterns

## 🚀 Next Steps

1. **Validation**: Test orchestrator modes with actual HVAC development tasks
2. **Integration Testing**: Verify seamless operation with TwentyCRM systems
3. **Documentation**: Create user guides for orchestrator mode usage
4. **Optimization**: Refine modes based on real-world usage feedback

## 📝 Files Modified

- `.roomodes` - Completely rewritten with TwentyCRM integration
- `.roo/custom_modes.yaml` - Updated to match new structure
- `.roomodes_backup` - Backup of original file

## 🎯 Success Criteria

- ✅ All syntax errors resolved
- ✅ TwentyCRM architecture compliance
- ✅ Integration with available tools
- ✅ Proper file path structure
- ✅ Quality assurance protocols
- ✅ Documentation standards alignment

The .roomodes file is now fully adapted for TwentyCRM HVAC module development with proper syntax, architecture compliance, and tool integration.
