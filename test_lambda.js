// This script uses `node-fetch` to make web requests.
// 
// 1. Install it first (in your terminal):
//    npm install node-fetch@2
//
//    (We use version 2 for easy compatibility with the `require` syntax)
//
// 2. Run your Python server in one terminal:
//    python app.py
//
// 3. Run this test script in *another* terminal:
//    node test_lambda.js
//

const fetch = require('node-fetch');

// -----------------------------------------------------------------
// ✅ This URL points to your *local* Flask server
// -----------------------------------------------------------------
const API_URL = 'http://127.0.0.1:5000/api';

// --- Mock Data ---

// Sample notes to use for testing
const mockNotes = `
The mitochondria is the powerhouse of the cell.
It generates most of the cell's supply of adenosine triphosphate (ATP),
used as a source of chemical energy.
Photosynthesis occurs in chloroplasts.
`;

const mockQuery = `Chemistry`

// Sample YAML content to use for testing the search
const mockYaml = `
"~/docs/science/bio-101.txt":
  one_sentence: "Notes on cell biology, mitochondria, and ATP."
  five_sentence: "Covers the function of mitochondria as the powerhouse. Explains ATP generation. Also mentions chloroplasts and photosynthesis."
"~/docs/history/us-hist-101.txt":
  one_sentence: "Summary of the American Civil War."
  five_sentence: "Details key battles, figures, and the major causes of the war, including states' rights and slavery."
`;

/**
 * Generic helper function to call your API
 * @param {object} payload - The body to send (e.g., { action: "getSummary", ... })
 */
async function callApi(payload) {
  console.log(`\n--- 🚀 Testing Action: ${payload.action} ---`);
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      // The body is the JSON payload, just as the web app would send
      body: JSON.stringify(payload)
    });

    // Get the JSON response from the Flask server
    const data = await response.json();

    if (!response.ok) {
      // The API returned an error (4xx or 5xx)
      console.error(`Status ${response.status}: Error from API:`, data.error || data);
    } else {
      // The API returned a 200 OK
      console.log('✅ Success! Response:');
      console.log(JSON.stringify(data, null, 2)); // Pretty-print the JSON
    }
    return data;

  } catch (error) {
    // This catches network errors (e.g., if the Flask server isn't running)
    console.error('🔴 Network or JSON parsing error:', error.message);
    console.error('🔴 (Did you forget to run "python app.py" in another terminal?)');
  }
}

// --- Main function to run all tests ---
async function runAllTests() {
  console.log(`🚀 Starting tests against local server: ${API_URL}`);

  // Test: getSummary
  await callApi({
    action: "getSummary",
    notesContent: mockNotes,
    query: mockQuery
  });

  // Test: getQuestions
  await callApi({
    action: "getQuestions",
    notesContent: mockNotes,
    numQuestions: 3,
    query: mockQuery
  });

  // Test: checkAnswer
  await callApi({
    action: "checkAnswer",
    notesContent: mockNotes,
    question: "What is the powerhouse of the cell?",
    answer: "The mitochondria. It makes ATP."
  });

  // Test: getFlashCards
  await callApi({
    action: "getFlashCards",
    notesContent: mockNotes,
    numCards: 5,
    query: mockQuery
  });

  // Test: getKeywords
  await callApi({
    action: "getKeywords",
    prompt: "What are the main topics in these notes about cell biology and energy?"
  });

  // Test: search (expecting a result)
  await callApi({
    action: "search",
    prompt: "Find me notes about biology", // This should match "cell biology"
    yamlContent: mockYaml
  });
  
  // Test: search (expecting no results)
  await callApi({
    action: "search",
    prompt: "Find me notes about Shakespeare", // This should not match
    yamlContent: mockYaml
  });

  console.log('\n--- 🚀 Testing Error Cases ---');

  // Test: Bad Action
  await callApi({
    action: "thisActionDoesNotExist"
  });

  // Test: Missing Parameters
  await callApi({
    action: "getSummary" // Missing 'notesContent'
  });

  console.log('\n--- ✅ All tests complete ---');
}

// Run the tests
runAllTests();