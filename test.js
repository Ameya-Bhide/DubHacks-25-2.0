// test/test.js

const path = require('path');
const { make_file } = require('public/make_file');
const fs = require('fs');
const os = require('os');
const yaml = require('js-yaml'); // ✅ install this

// Example JSON input
const data11 = {
  "File path": "AI/results/englishNotes.txt",
  "Date Created": "10-18-2025",
  "Study Group Name": "English Study",
  "Class Name": "ENGL 101",
  "Name of file": "englishNotes.txt",
  "1-sentence description": "English notes."
  // "five-sentence summary": "Covers concepts of limits, continuity, derivatives, and examples of rate of change problems. Includes visual understanding of approaching limits. Describes the definition of derivative as a limit. Explains rules like product and quotient rule. Concludes with examples of real-world applications."
  
};

// const data12 = {
//   "File path": "~/Documents/School/Physics/notes.pdf",
//   "Date Created": "10-19-2025",
//   "Study Group Name": "Physics Study",
//   "Class Name": "Mechanics",
//   "Name of file": "notes.pdf",
//   "1-sentence description": "Quick notes on Newton's Laws.",
//   "five-sentence summary": "Summarizes Newton’s three laws with examples. Discusses inertia and acceleration relationships. Describes how forces cause motion. Provides worked examples with free-body diagrams. Highlights common misconceptions in net force calculations."
  
// };
// // Example JSON input
// const data13 = {
//   "File path": "~/Documents/School/Math/notes2.pdf",
//   "Date Created": "10-18-2025",
//   "Study Group Name": "Math Study",
//   "Class Name": "Calculus 1",
//   "Name of file": "notes2.pdf",
//   "1-sentence description": "Quick notes on limits and derivatives2.",
//   "five-sentence summary": "Explores advanced examples of limits approaching infinity. Covers derivative applications in velocity and acceleration. Discusses higher order derivatives. Includes worked examples of tangent lines. Ends with brief intro to implicit differentiation."
  
// };



// const data1 = {
//   "File path": "~/Documents/School/Math/notes.pdf",
//   "Date Created": "10-18-2025",
//   "Study Group Name": "Math Study",
//   "Class Name": "Calculus 1",
//   "Name of file": "notes.pdf",
//   "1-sentence description": "Quick notes on limits and derivatives.",
//   "five-sentence summary": "Covers concepts of limits, continuity, derivatives, and examples of rate of change problems. Includes visual understanding of approaching limits. Describes the definition of derivative as a limit. Explains rules like product and quotient rule. Concludes with examples of real-world applications."
  
// };

// const data2 = {
//   "File path": "~/Documents/School/Physics/notes.pdf",
//   "Date Created": "10-19-2025",
//   "Study Group Name": "Physics Study",
//   "Class Name": "Mechanics",
//   "Name of file": "notes.pdf",
//   "1-sentence description": "Quick notes on Newton's Laws.",
//   "five-sentence summary": "Summarizes Newton’s three laws with examples. Discusses inertia and acceleration relationships. Describes how forces cause motion. Provides worked examples with free-body diagrams. Highlights common misconceptions in net force calculations."
  
// };
// // Example JSON input
// const data3 = {
//   "File path": "~/Documents/School/Math/notes2.pdf",
//   "Date Created": "10-18-2025",
//   "Study Group Name": "Math Study",
//   "Class Name": "Calculus 1",
//   "Name of file": "notes2.pdf",
//   "1-sentence description": "Quick notes on limits and derivatives2.",
//   "five-sentence summary": "Explores advanced examples of limits approaching infinity. Covers derivative applications in velocity and acceleration. Discusses higher order derivatives. Includes worked examples of tangent lines. Ends with brief intro to implicit differentiation."
  
// };

// const data4 = {
//   "File path": "~/Documents/School/Physics/notes2.pdf",
//   "Date Created": "10-19-2025",
//   "Study Group Name": "Physics Study",
//   "Class Name": "Mechanics",
//   "Name of file": "notes2.pdf",
//   "1-sentence description": "Quick notes on Newton's Laws2.",
//   "five-sentence summary": "Summarizes Newton’s three laws with examples. Discusses inertia and acceleration relationships. Describes how forces cause motion. Provides worked examples with free-body diagrams. Highlights common misconceptions in net force calculations."
// };
// // Example JSON input
// const data5 = {
//   "File path": "~/Documents/School/Math 101/notes.pdf",
//   "Date Created": "10-18-2025",
//   "Study Group Name": "Math Study",
//   "Class Name": "Calculus 2",
//   "Name of file": "notes.pdf",
//   "1-sentence description": "Quick notes on limits and derivatives.",
//   "five-sentence summary": "Covers concepts of limits, continuity, derivatives, and examples of rate of change problems. Includes visual understanding of approaching limits. Describes the definition of derivative as a limit. Explains rules like product and quotient rule. Concludes with examples of real-world applications."
// };

// const data6 = {
//   "File path": "~/Documents/School/Physics 102/notes.pdf",
//   "Date Created": "10-19-2025",
//   "Study Group Name": "Physics Study",
//   "Class Name": "E&M",
//   "Name of file": "notes.pdf",
//   "1-sentence description": "Quick notes on Newton's Laws.",
//   "five-sentence summary": "Summarizes Newton’s three laws with examples. Discusses inertia and acceleration relationships. Describes how forces cause motion. Provides worked examples with free-body diagrams. Highlights common misconceptions in net force calculations."
// };
// // Example JSON input
// const data7 = {
//   "File path": "~/Documents/School/Math 101/notes2.pdf",
//   "Date Created": "10-18-2025",
//   "Study Group Name": "Math Study",
//   "Class Name": "Calculus 2",
//   "Name of file": "notes2.pdf",
//   "1-sentence description": "Quick notes on limits and derivatives2.",
//   "five-sentence summary": "Explores advanced examples of limits approaching infinity. Covers derivative applications in velocity and acceleration. Discusses higher order derivatives. Includes worked examples of tangent lines. Ends with brief intro to implicit differentiation."
// };

// const data8 = {
//   "File path": "~/Documents/School/Physics 102/notes2.pdf",
//   "Date Created": "10-19-2025",
//   "Study Group Name": "Physics Study",
//   "Class Name": "E&M",
//   "Name of file": "notes2.pdf",
//   "1-sentence description": "Quick notes on Newton's Laws2.",
//   "five-sentence summary": "Summarizes Newton’s three laws with examples. Discusses inertia and acceleration relationships. Describes how forces cause motion. Provides worked examples with free-body diagrams. Highlights common misconceptions in net force calculations."
// };
// // Example JSON input
// const data9 = {
//   "File path": "~/Documents/School/Mat/notes5.pdf",
//   "Date Created": "10-18-2025",
//   "Study Group Name": "Math Study",
//   "Class Name": "Calculus 1",
//   "Name of file": "notes5.pdf",
//   "1-sentence description": "Quick notes on limits and derivatives.",
//   "five-sentence summary": "Covers concepts of limits, continuity, derivatives, and examples of rate of change problems. Includes visual understanding of approaching limits. Describes the definition of derivative as a limit. Explains rules like product and quotient rule. Concludes with examples of real-world applications."
// };

// const data10 = {
//   "File path": "~/Documents/School/Physic/notes5.pdf",
//   "Date Created": "10-19-2025",
//   "Study Group Name": "Physics Study",
//   "Class Name": "Mechanics",
//   "Name of file": "notes5.pdf",
//   "1-sentence description": "Quick notes on Newton's Laws.",
//   "five-sentence summary": "Summarizes Newton’s three laws with examples. Discusses inertia and acceleration relationships. Describes how forces cause motion. Provides worked examples with free-body diagrams. Highlights common misconceptions in net force calculations."
// };

// // const datas = [data1, data2, data3, data4, data5, data6, data7, data8, data9, data10];
// const datas = [data11, data12, data13];

function make_files ()
{
  make_file(data11);
    // for (let i = 0; i < datas.length; i++)
    //     make_file(data11);
}

console.log('Running make_file test...');
make_files();

// Verify by checking ~/Documents/.ai_helper/descriptions.txt
// and ~/Documents/.ai_helper/Summaries/.../summary.txt
console.log('✅ Done. Check your Documents/.ai_helper folder!');