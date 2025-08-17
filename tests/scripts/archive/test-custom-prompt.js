#!/usr/bin/env node

/**
 * Test custom summary prompt functionality
 * Tests that custom prompts like "2 sentences summary plz" work correctly
 */

const API_BASE = 'http://localhost:3101';
const noteId = '47771d09-e4de-4f9b-8c97-c2429a12714e';
const customPrompt = '2 sentences summary plz';

async function testCustomPrompt() {
  console.log('Testing custom summary prompt...');
  console.log(`Note ID: ${noteId}`);
  console.log(`Custom prompt: "${customPrompt}"`);
  console.log('---');

  try {
    // Test the regenerate summary endpoint
    const response = await fetch(`${API_BASE}/api/voice-notes/${noteId}/regenerate-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': 'test-session-' + Date.now()
      },
      body: JSON.stringify({
        userPrompt: customPrompt
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error (${response.status}): ${error}`);
    }

    const result = await response.json();
    
    console.log('✅ Summary regeneration successful!');
    console.log('---');
    console.log('Summary structure:');
    
    if (result.summary) {
      console.log('\nSummary field exists:');
      console.log(typeof result.summary === 'object' ? JSON.stringify(result.summary, null, 2) : result.summary);
      
      // Check if it's flexible JSON (might not have all traditional fields)
      const summaryObj = typeof result.summary === 'string' ? JSON.parse(result.summary) : result.summary;
      
      console.log('\nFlexible JSON structure detected:');
      console.log('- Has "summary" field:', 'summary' in summaryObj);
      console.log('- Has "key_points" field:', 'key_points' in summaryObj);
      console.log('- Has "action_items" field:', 'action_items' in summaryObj);
      
      if (summaryObj.summary && !summaryObj.key_points && !summaryObj.action_items) {
        console.log('\n✅ SUCCESS: Custom prompt produced flexible JSON with just summary field!');
        console.log('Summary content:', summaryObj.summary);
      } else if (summaryObj.summary) {
        console.log('\n⚠️  PARTIAL: Summary exists but might still have rigid structure');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testCustomPrompt().catch(console.error);