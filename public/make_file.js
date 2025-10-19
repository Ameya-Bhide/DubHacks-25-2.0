const fs = require('fs');
const path = require('path');
const os = require('os');
const yaml = require('js-yaml'); // ✅ install this


const { spawnSync } = require('child_process');

// `body` is a JS object that includes "action" and parameters
const body = {
  action: "get_summary",
  parameters: { notesContent: notes_content }
};

// Wrap it in an event object with "body" as JSON string
const event = {
  body: JSON.stringify(body)
};

// Optional: context object
// const context = { user: "PersonA" };

// Call the Python script
const inputJSON = JSON.stringify({ event});//, context });

const result = spawnSync('python3', ['handler.py', inputJSON], { encoding: 'utf-8' });

if (result.error) {
  console.error("Error calling Python:", result.error);
} else {
  const output = JSON.parse(result.stdout);
  console.log("Python output:", output);
}



/**
 * Accepts a JSON object of this form:
 * {
 *   "File path": "Stuff",
 *   "Date Created": "MM-DD-YYYY",
 *   "Study Group Name": "Stuff",
 *   "Class Name": "Stuff",
 *   "Name of file": "Stuff",
 *   "1-sentence description": "Stuff"
 * }
 */
// function make_file(data) {
//   if (!data || typeof data !== 'object') {
//     console.error('Invalid input to make_file');
//     return;
//   }

//   // Resolve home directory safely
//   const homeDir = os.homedir();
//   const aiHelperDir = path.join(homeDir, 'Documents', '.ai_helper');

//   // === 1️⃣ Ensure ~/.ai_helper/descriptions.txt exists and append description
//   const descriptionsFile = path.join(aiHelperDir, 'descriptions.txt');

//   // Create folder if missing
//   fs.mkdirSync(aiHelperDir, { recursive: true });

//   // Append to descriptions.txt
//   const desc = data["1-sentence description"] ?? '';
//   fs.appendFileSync(descriptionsFile, desc + '\n', 'utf8');

//   // === 2️⃣ Derive new_path from "File path"
//   const filePath = data["File path"];
//   if (!filePath) {
//     console.error('Missing "File path" in data');
//     return;
//   }

//   root_dir = 'Documents/'
//   // Expand ~ if present
//   const expandedFilePath = filePath.startsWith('~')
//     ? filePath.split(root_dir)[1] // path.join(homeDir, filePath.slice(1))
//     : filePath;

// //   const newPath = path.dirname(expandedFilePath);
//   const fileNameWithoutExtension = path.parse(expandedFilePath).name; // Get the file name without extension
//   const directoryPath = path.dirname(expandedFilePath); // Get the directory path
//   const newPath = path.join(directoryPath, fileNameWithoutExtension) + '/'; // Combine and add trailing slash


//   // === 3️⃣ Write description to ~/Documents/.ai_helper/Summaries/{new_path}/summary.txt
//   const summariesDir = path.join(aiHelperDir, 'Summaries', newPath);
//   fs.mkdirSync(summariesDir, { recursive: true });

//   const summary = data["5-sentence summary"] ?? '';
//   const summaryFile = path.join(summariesDir, 'summary.txt');
//   fs.writeFileSync(summaryFile, summary, 'utf8');

//   console.log('✅ make_file completed successfully');
// }

function add_to_stored_file(data) {
  try {
    const docsDir = path.join(os.homedir(), 'Documents', '.stored_files');
    const filePath = path.join(docsDir, 'stored_files.yaml');

    // Ensure the directory exists
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // Load existing YAML (if present)
    let existingData = [];
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      if (fileContent.trim() !== '') {
        existingData = yaml.load(fileContent);
      }
    }

    // // Create a new YAML entry
    // const newEntry = {
    //   [data["Name of file"]]: [
    //     { "File Path": data["File path"] },
    //     { "Class Name": data["Class Name"] },
    //     { "Study Group Name": data["Study Group Name"] },
    //     { "Date Created": data["Date Created"] }
    //   ]
    // };

    // // Append new entry
    // existingData = existingData || [];
    // existingData.push(newEntry);

    // Normalize in case YAML file is not an array
    if (!Array.isArray(existingData)) existingData = [];

    // Prepare new or updated entry
    const fileName = data["File path"];
    const newEntry = {
      [fileName]: [
        { "File Path": data["File path"] },
        { "Name of File": data["Name of file"] },
        { "Class Name": data["Class Name"] },
        { "Study Group Name": data["Study Group Name"] },
        { "Date Created": data["Date Created"] }
      ]
    };

    // Look for existing entry with same file name
    const index = existingData.findIndex(entry => Object.keys(entry)[0] === fileName);

    if (index >= 0) {
      // Update existing entry
      existingData[index] = newEntry;
      console.log(`🔄 Updated entry for ${fileName}`);
    } else {
      // Append new entry
      existingData.push(newEntry);
      console.log(`✅ Added new entry for ${fileName}`);
    }

    // Write updated YAML back to file
    const yamlStr = yaml.dump(existingData, { lineWidth: -1 });
    fs.writeFileSync(filePath, yamlStr, 'utf8');

    console.log(`✅ Successfully added ${data["Name of file"]} to stored_files.yaml`);
  } catch (err) {
    console.error('❌ Error adding to file:', err);
  }
}

function add_to_shared_file(data) {
  try {
    const docsDir = path.join(os.homedir(), 'Documents', '.shared_files');
    const filePath = path.join(docsDir, 'shared_files.yaml');

    // Ensure the directory exists
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }

    // Load existing YAML (if present)
    let existingData = [];
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      if (fileContent.trim() !== '') {
        existingData = yaml.load(fileContent);
      }
    }

    // // Create a new YAML entry
    // const newEntry = {
    //   [data["Name of file"]]: [
    //     { "File Path": data["File path"] },
    //     { "Class Name": data["Class Name"] },
    //     { "Study Group Name": data["Study Group Name"] },
    //     { "Date Created": data["Date Created"] }
    //   ]
    // };

    // // Append new entry
    // existingData = existingData || [];
    // existingData.push(newEntry);

    // Normalize in case YAML file is not an array
    if (!Array.isArray(existingData)) existingData = [];

    // Prepare new or updated entry
    const fileName = data["File path"];
    const newEntry = {
      [fileName]: [
        { "File Path": data["File path"] },
        { "Name of File": data["Name of file"] },
        { "Class Name": data["Class Name"] },
        { "Study Group Name": data["Study Group Name"] },
        { "Date Created": data["Date Created"] }
      ]
    };

    // Look for existing entry with same file name
    const index = existingData.findIndex(entry => Object.keys(entry)[0] === fileName);

    if (index >= 0) {
      // Update existing entry
      existingData[index] = newEntry;
      console.log(`🔄 Updated entry for ${fileName}`);
    } else {
      // Append new entry
      existingData.push(newEntry);
      console.log(`✅ Added new entry for ${fileName}`);
    }

    // Write updated YAML back to file
    const yamlStr = yaml.dump(existingData, { lineWidth: -1 });
    fs.writeFileSync(filePath, yamlStr, 'utf8');

    console.log(`✅ Successfully added ${data["Name of file"]} to shared_files.yaml`);
  } catch (err) {
    console.error('❌ Error adding to file:', err);
  }
}

function make_file(data) {
  if (!data || typeof data !== 'object') {
    console.error('Invalid input to make_file');
    return;
  }
  // stored = '.stored_files';
  // shared = '.shared_files';
  if (data["Shared"])
    add_to_shared_file (data);
  else
    add_to_stored_file (data);

  file_path = data["File path"];
  // summary_string = get_summary (file_path);
  

  const { spawnSync } = require('child_process');
  notes_content = fs.readFileSync(file_path).toString();/* TODO: Get this done*/
  // `body` is a JS object that includes "action" and parameters
  const body = {
    action: "get_summary",
    parameters: { notesContent: notes_content }
  };

  // Wrap it in an event object with "body" as JSON string
  const event = {
    body: JSON.stringify(body)
  };

  // Optional: context object
  // const context = { user: "PersonA" };

  // Call the Python script
  const inputJSON = JSON.stringify({ event});//, context });

  const result = spawnSync('python3', ['handler.py', inputJSON], { encoding: 'utf-8' });

  if (result.error) {
    console.error("Error calling Python:", result.error);
  } else {
    const output = JSON.parse(result.stdout);
    summary_string = output.reply;
    console.log("Python output:", output);
  }



//   new_data = get_summary (data);
  data["five-sentence summary"] = summary_string;
  // const new_data = { ...data, ...summary_json };

  const homeDir = os.homedir();
  const documentsDir = path.join(homeDir, 'Documents');
  const aiHelperDir = path.join(documentsDir, '.ai_helper');
  fs.mkdirSync(aiHelperDir, { recursive: true });

  // === 1️⃣ Load or create descriptions.yaml ===
  const yamlFile = path.join(aiHelperDir, 'descriptions.yaml');
  let descriptions = {};

  if (fs.existsSync(yamlFile)) {
    try {
      const fileContents = fs.readFileSync(yamlFile, 'utf8');
      descriptions = yaml.load(fileContents) || {};
    } catch (e) {
      console.error('Error reading descriptions.yaml:', e);
    }
  }

  // === 2️⃣ Extract fields ===
  const filePath = /*new_*/data['File path'];
  const oneSentence = /*new_*/data['1-sentence description'] ?? '';
  const fiveSentence = /*new_*/data['five-sentence summary'] ?? '(No five-sentence summary provided)';

  if (!filePath) {
    console.error('Missing "File path" in data');
    return;
  }

  // Expand ~ to home directory
  const expandedFilePath = filePath.startsWith('~')
    ? path.join(homeDir, filePath.slice(1))
    : filePath;

  // === 3️⃣ Update YAML structure ===
  descriptions[expandedFilePath] = {
    one_sentence: oneSentence,
    five_sentence: fiveSentence
  };

  // Write back YAML
  const yamlData = yaml.dump(descriptions, { indent: 2 });
  fs.writeFileSync(yamlFile, yamlData, 'utf8');

  // === 4️⃣ Derive path relative to ~/Documents ===
//   let relativePath = path.relative(documentsDir, expandedFilePath);
//   if (relativePath.startsWith('..')) {
//     relativePath = path.basename(expandedFilePath);
//   }
//   const newPath = path.dirname(relativePath);

//   // === 5️⃣ Write summary.txt ===
//   const summariesDir = path.join(aiHelperDir, 'Summaries', newPath);
//   fs.mkdirSync(summariesDir, { recursive: true });

//   const summaryFile = path.join(summariesDir, 'summary.txt');
//   const summaryContent = 
// `1-sentence description: ${oneSentence}

// five-sentence summary: ${fiveSentence}
// `;
//   fs.writeFileSync(summaryFile, summaryContent, 'utf8');

  console.log(`✅ make_file completed for ${filePath}`);
}

// Export the function for use elsewhere
module.exports = { make_file, add_to_stored_file,  add_to_shared_file};
