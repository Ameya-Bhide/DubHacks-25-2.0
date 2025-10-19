const fs = require('fs');
const path = require('path');
const os = require('os');
const yaml = require('js-yaml'); // ✅ install this


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

function make_file(data) {
  if (!data || typeof data !== 'object') {
    console.error('Invalid input to make_file');
    return { success: false, error: 'Invalid input data' };
  }

  // For now, we'll work with the data as provided
  // You can add get_summary and add_to_file functions later
  const new_data = { ...data };

  const homeDir = os.homedir();
  const documentsDir = path.join(homeDir, 'Documents');
  const aiHelperDir = path.join(documentsDir, '.ai_helper');
  const uploadedFilesDir = path.join(documentsDir, 'UploadedFiles');
  
  // Create necessary directories
  fs.mkdirSync(aiHelperDir, { recursive: true });
  fs.mkdirSync(uploadedFilesDir, { recursive: true });

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
  const filePath = new_data['File path'];
  const oneSentence = new_data['1-sentence description'] ?? '';
  const fiveSentence = new_data['five-sentence summary'] ?? '(No five-sentence summary provided)';

  if (!filePath) {
    console.error('Missing "File path" in data');
    return { success: false, error: 'Missing file path' };
  }

  // Create a path in Documents folder for the uploaded file
  // Since we're getting just the filename from the file picker, we'll create a path in Documents
  const fileName = path.basename(filePath);
  const expandedFilePath = path.join(documentsDir, 'UploadedFiles', fileName);

  // === 3️⃣ Update YAML structure ===
  descriptions[expandedFilePath] = {
    one_sentence: oneSentence,
    five_sentence: fiveSentence,
    date_created: new_data['Date Created'],
    study_group_name: new_data['Study Group Name'],
    class_name: new_data['Class Name'],
    uploaded_by: 'current-user', // Will be updated with actual user
    uploaded_at: new Date().toISOString(),
    file_size: 0, // Will be updated when file is actually uploaded
    file_type: 'application/octet-stream', // Will be updated when file is actually uploaded
    is_personal: new_data['Study Group Name'] === 'Personal'
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
  return { success: true, message: `File processed successfully: ${filePath}` };
}

// Export the function for use elsewhere
module.exports = { make_file };