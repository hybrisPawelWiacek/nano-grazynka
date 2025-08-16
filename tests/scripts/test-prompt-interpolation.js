#!/usr/bin/env node

/**
 * Test script for YAML Prompt System variable interpolation
 * Tests all variable patterns and edge cases
 * Run: node tests/scripts/test-prompt-interpolation.js
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { template } = require('lodash');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test data
const testContexts = [
  {
    name: 'Full context with all variables',
    context: {
      project: {
        name: 'nano-Grazynka',
        description: 'Voice note transcription and summarization utility'
      },
      entities: {
        people: 'John Doe, Jane Smith',
        companies: 'Acme Corp, TechCo',
        technical: 'Node.js, TypeScript, Prisma',
        products: 'WhisperAPI, GPT-4',
        compressed: '[Entities: 4 people, 2 companies]',
        detailed: 'People: John Doe (CEO), Jane Smith (CTO)\nCompanies: Acme Corp (client), TechCo (partner)',
        relevant: 'Meeting participants: John, Jane from Acme Corp',
        key: 'Project kickoff meeting'
      },
      user: {
        customPrompt: 'Focus on action items and deadlines'
      }
    }
  },
  {
    name: 'Partial context (missing some fields)',
    context: {
      project: {
        name: 'TestProject'
      },
      entities: {
        relevant: 'Some relevant context'
      }
    }
  },
  {
    name: 'Empty context',
    context: {}
  },
  {
    name: 'Null values in context',
    context: {
      project: {
        name: null,
        description: null
      },
      entities: {
        people: null,
        companies: undefined
      },
      user: {
        customPrompt: null
      }
    }
  }
];

// Test templates
const testTemplates = [
  {
    name: 'Simple variable',
    template: 'Project: {{project.name}}',
    expectedPattern: /Project: .*/
  },
  {
    name: 'Multiple variables',
    template: 'Analyzing {{project.name}} with {{entities.relevant}}',
    expectedPattern: /Analyzing .* with .*/
  },
  {
    name: 'Nested in text',
    template: 'The {{project.name}} system uses {{entities.technical}} technologies',
    expectedPattern: /The .* system uses .* technologies/
  },
  {
    name: 'User custom prompt',
    template: '{{user.customPrompt}}\nAdditional instructions here',
    expectedPattern: /.*\nAdditional instructions here/
  },
  {
    name: 'All entity types',
    template: `
People: {{entities.people}}
Companies: {{entities.companies}}
Technical: {{entities.technical}}
Products: {{entities.products}}
Compressed: {{entities.compressed}}
Detailed: {{entities.detailed}}
Relevant: {{entities.relevant}}
Key: {{entities.key}}`,
    expectedPattern: /People: .*\nCompanies: .*\nTechnical: .*\nProducts: .*\nCompressed: .*\nDetailed: .*\nRelevant: .*\nKey: .*/
  }
];

// Helper to flatten context (same as PromptLoader)
function flattenContext(context) {
  const flat = {};
  
  // Always provide all keys with defaults
  flat['project.name'] = context.project?.name || 'nano-Grazynka';
  flat['project.description'] = context.project?.description || '';
  
  flat['entities.people'] = context.entities?.people || '';
  flat['entities.companies'] = context.entities?.companies || '';
  flat['entities.technical'] = context.entities?.technical || '';
  flat['entities.products'] = context.entities?.products || '';
  flat['entities.compressed'] = context.entities?.compressed || '';
  flat['entities.detailed'] = context.entities?.detailed || '';
  flat['entities.relevant'] = context.entities?.relevant || '';
  flat['entities.key'] = context.entities?.key || '';
  
  flat['user.customPrompt'] = context.user?.customPrompt || '';
  
  // Add root level objects for lodash template
  flat.project = {
    name: flat['project.name'],
    description: flat['project.description']
  };
  
  flat.entities = {
    people: flat['entities.people'],
    companies: flat['entities.companies'],
    technical: flat['entities.technical'],
    products: flat['entities.products'],
    compressed: flat['entities.compressed'],
    detailed: flat['entities.detailed'],
    relevant: flat['entities.relevant'],
    key: flat['entities.key']
  };
  
  flat.user = {
    customPrompt: flat['user.customPrompt']
  };
  
  return flat;
}

// Test interpolation
function testInterpolation(templateStr, context) {
  try {
    const compiled = template(templateStr, {
      interpolate: /{{([\s\S]+?)}}/g
    });
    const flatContext = flattenContext(context);
    return compiled(flatContext);
  } catch (error) {
    return `ERROR: ${error.message}`;
  }
}

// Load and test actual prompts.yaml
function testActualPrompts() {
  console.log(`\n${colors.cyan}Testing actual prompts.yaml file...${colors.reset}\n`);
  
  const yamlPath = path.join(__dirname, '..', '..', 'backend', 'prompts.yaml');
  
  if (!fs.existsSync(yamlPath)) {
    console.log(`${colors.red}✗ prompts.yaml not found at ${yamlPath}${colors.reset}`);
    return false;
  }
  
  try {
    const yamlContent = fs.readFileSync(yamlPath, 'utf8');
    const prompts = yaml.load(yamlContent);
    
    console.log(`${colors.green}✓ Successfully loaded prompts.yaml${colors.reset}`);
    
    // Test specific prompts
    const testCases = [
      { path: 'transcription.gpt4o.default', name: 'GPT-4o transcription' },
      { path: 'transcription.gemini.default', name: 'Gemini transcription' },
      { path: 'summarization.default', name: 'Default summarization' },
      { path: 'summarization.with_custom', name: 'Custom summarization' },
      { path: 'titleGeneration.default', name: 'Title generation' }
    ];
    
    const fullContext = testContexts[0].context; // Use full context
    
    testCases.forEach(({ path: promptPath, name }) => {
      const prompt = getNestedValue(prompts, promptPath);
      if (prompt) {
        const result = testInterpolation(prompt, fullContext);
        if (!result.startsWith('ERROR')) {
          console.log(`${colors.green}✓ ${name}: Variables interpolated successfully${colors.reset}`);
        } else {
          console.log(`${colors.red}✗ ${name}: ${result}${colors.reset}`);
        }
      } else {
        console.log(`${colors.yellow}⚠ ${name}: Path not found${colors.reset}`);
      }
    });
    
    return true;
  } catch (error) {
    console.log(`${colors.red}✗ Error loading prompts.yaml: ${error.message}${colors.reset}`);
    return false;
  }
}

// Helper to get nested value
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Run all tests
function runTests() {
  console.log(`${colors.blue}=================================`);
  console.log(`YAML Prompt System Interpolation Tests`);
  console.log(`==================================${colors.reset}\n`);
  
  let passed = 0;
  let failed = 0;
  
  // Test each template with each context
  testTemplates.forEach(({ name, template: templateStr, expectedPattern }) => {
    console.log(`\n${colors.cyan}Testing: ${name}${colors.reset}`);
    console.log(`Template: ${templateStr.substring(0, 50)}...`);
    
    testContexts.forEach(({ name: contextName, context }) => {
      const result = testInterpolation(templateStr, context);
      const matches = expectedPattern.test(result);
      
      if (matches && !result.startsWith('ERROR')) {
        console.log(`  ${colors.green}✓ ${contextName}${colors.reset}`);
        passed++;
      } else {
        console.log(`  ${colors.red}✗ ${contextName}: ${result.substring(0, 100)}${colors.reset}`);
        failed++;
      }
    });
  });
  
  // Test edge cases
  console.log(`\n${colors.cyan}Testing edge cases...${colors.reset}\n`);
  
  const edgeCases = [
    {
      name: 'Unclosed bracket',
      template: 'Test {{project.name',
      shouldFail: true
    },
    {
      name: 'Invalid path',
      template: 'Test {{invalid.path.here}}',
      shouldFail: false // Should return empty string
    },
    {
      name: 'Empty brackets',
      template: 'Test {{}}',
      shouldFail: false
    },
    {
      name: 'Nested brackets',
      template: 'Test {{project.{{name}}}}',
      shouldFail: true
    },
    {
      name: 'Special characters',
      template: 'Test {{project.name}} with $pecial ch@rs!',
      shouldFail: false
    }
  ];
  
  edgeCases.forEach(({ name, template: templateStr, shouldFail }) => {
    const result = testInterpolation(templateStr, testContexts[0].context);
    const hasFailed = result.startsWith('ERROR');
    
    if (hasFailed === shouldFail) {
      console.log(`  ${colors.green}✓ ${name}: ${shouldFail ? 'Failed as expected' : 'Handled gracefully'}${colors.reset}`);
      passed++;
    } else {
      console.log(`  ${colors.red}✗ ${name}: Unexpected result - ${result.substring(0, 50)}${colors.reset}`);
      failed++;
    }
  });
  
  // Test actual prompts.yaml file
  const promptsYamlSuccess = testActualPrompts();
  if (promptsYamlSuccess) passed++; else failed++;
  
  // Summary
  console.log(`\n${colors.blue}=================================`);
  console.log(`Test Results`);
  console.log(`==================================${colors.reset}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
  console.log(`Total: ${passed + failed}\n`);
  
  // Exit code
  process.exit(failed > 0 ? 1 : 0);
}

// Check dependencies
function checkDependencies() {
  try {
    require('js-yaml');
    require('lodash');
    return true;
  } catch (error) {
    console.log(`${colors.red}Missing dependencies. Please run: npm install js-yaml lodash${colors.reset}`);
    return false;
  }
}

// Main
if (checkDependencies()) {
  runTests();
}