const fs = require('fs');
const path = require('path');

const QUERY_FILE = path.join(__dirname, 'user_ai_query.txt');
const RESPONSE_FILE = path.join(__dirname, 'user_ai_response.txt');

// Function to send a user query
function sendQuery(query) {
  fs.writeFileSync(QUERY_FILE, query);
  console.log('✅ Query written. Waiting for AI response...');
}

// Function to watch for AI response
function watchForResponse() {
  if (fs.existsSync(RESPONSE_FILE)) {
    const response = fs.readFileSync(RESPONSE_FILE, 'utf8');
    console.log('🤖 AI Response:', response);
    fs.unlinkSync(RESPONSE_FILE); // delete after reading
  }
}

// Run the loop every 1 second
setInterval(watchForResponse, 1000);

// Example: user query
// sendQuery('Explain quantum entanglement in simple terms.');
