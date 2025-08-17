#!/usr/bin/env node

/**
 * Test script for YAML Prompt System hot-reload functionality
 * Monitors prompts.yaml for changes and reloads automatically
 * Run: NODE_ENV=development node tests/scripts/test-hot-reload.js
 */

const fs = require('fs');
const path = require('path');

// Set environment to development for hot-reload
process.env.NODE_ENV = 'development';

// Import PromptLoader after setting environment
const { PromptLoader } = require('../../backend/dist/infrastructure/config/PromptLoader');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const yamlPath = path.join(__dirname, '..', '..', 'backend', 'prompts.yaml');
let changeCount = 0;

console.log(`${colors.blue}=================================`);
console.log(`YAML Prompt System Hot-Reload Test`);
console.log(`==================================${colors.reset}\n`);

console.log(`${colors.cyan}Environment: ${process.env.NODE_ENV}${colors.reset}`);
console.log(`${colors.cyan}YAML Path: ${yamlPath}${colors.reset}\n`);

// Initialize PromptLoader
let promptLoader;
try {
  promptLoader = PromptLoader.getInstance();
  console.log(`${colors.green}✓ PromptLoader initialized successfully${colors.reset}`);
} catch (error) {
  console.log(`${colors.red}✗ Failed to initialize PromptLoader: ${error.message}${colors.reset}`);
  console.log(`\nMake sure to compile TypeScript first:`);
  console.log(`${colors.yellow}cd backend && npm run build${colors.reset}`);
  process.exit(1);
}

// Function to display current prompts
function displayCurrentPrompts() {
  console.log(`\n${colors.magenta}Current Prompt Samples:${colors.reset}`);
  
  const testPaths = [
    'transcription.gpt4o.default',
    'summarization.default',
    'titleGeneration.default'
  ];
  
  testPaths.forEach(path => {
    try {
      const prompt = promptLoader.getPrompt(path);
      const preview = prompt.substring(0, 60).replace(/\n/g, ' ');
      console.log(`  ${colors.cyan}${path}:${colors.reset} ${preview}...`);
    } catch (error) {
      console.log(`  ${colors.red}${path}: Error - ${error.message}${colors.reset}`);
    }
  });
}

// Display initial prompts
displayCurrentPrompts();

// Function to simulate changes
function simulateChange() {
  changeCount++;
  console.log(`\n${colors.yellow}[Change ${changeCount}] Modifying prompts.yaml...${colors.reset}`);
  
  try {
    // Read current content
    let content = fs.readFileSync(yamlPath, 'utf8');
    
    // Make a small change (add a comment with timestamp)
    const timestamp = new Date().toISOString();
    const changeMarker = `\n# Hot-reload test change ${changeCount} at ${timestamp}`;
    
    // Remove previous test changes and add new one
    content = content.replace(/\n# Hot-reload test change .*/g, '');
    content += changeMarker;
    
    // Write back
    fs.writeFileSync(yamlPath, content);
    console.log(`${colors.green}✓ File modified successfully${colors.reset}`);
    
    // Wait a bit for file watcher to trigger
    setTimeout(() => {
      console.log(`${colors.cyan}Checking if prompts reloaded...${colors.reset}`);
      
      // Force reload and check
      promptLoader.reloadPrompts();
      displayCurrentPrompts();
      
      console.log(`${colors.green}✓ Hot-reload verified!${colors.reset}`);
    }, 1500);
    
  } catch (error) {
    console.log(`${colors.red}✗ Failed to modify file: ${error.message}${colors.reset}`);
  }
}

// Function to clean up test changes
function cleanup() {
  console.log(`\n${colors.yellow}Cleaning up test changes...${colors.reset}`);
  
  try {
    let content = fs.readFileSync(yamlPath, 'utf8');
    content = content.replace(/\n# Hot-reload test change .*/g, '');
    fs.writeFileSync(yamlPath, content);
    console.log(`${colors.green}✓ Cleanup complete${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ Cleanup failed: ${error.message}${colors.reset}`);
  }
}

// Handle exit
process.on('SIGINT', () => {
  console.log(`\n${colors.cyan}Shutting down...${colors.reset}`);
  cleanup();
  promptLoader.cleanup();
  process.exit(0);
});

// Instructions
console.log(`\n${colors.blue}=================================`);
console.log(`Hot-Reload Test Instructions`);
console.log(`==================================${colors.reset}`);
console.log(`1. This script will simulate changes to prompts.yaml`);
console.log(`2. Watch for automatic reload messages`);
console.log(`3. Press Ctrl+C to stop and cleanup`);
console.log(`\n${colors.yellow}Starting test in 3 seconds...${colors.reset}\n`);

// Run test after delay
setTimeout(() => {
  // Simulate 3 changes with delays
  simulateChange();
  
  setTimeout(() => simulateChange(), 5000);
  setTimeout(() => simulateChange(), 10000);
  
  // Cleanup and exit after tests
  setTimeout(() => {
    console.log(`\n${colors.green}=================================`);
    console.log(`Hot-Reload Test Complete!`);
    console.log(`==================================${colors.reset}`);
    cleanup();
    promptLoader.cleanup();
    process.exit(0);
  }, 15000);
}, 3000);