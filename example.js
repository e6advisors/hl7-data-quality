/**
 * Example usage of the HL7 Data Quality Agent Library
 * 
 * Note: This example assumes hl7-parser is installed and available
 */

import { 
  analyzeDataQuality, 
  getSampleADTMessage,
  getUseCases,
  QUALITY_CATEGORIES,
  SEVERITY
} from './src/hl7DataQualityService.js';

// Example 1: Analyzing a sample message
console.log('=== Example 1: Sample ADT Message Analysis ===\n');
const sampleMessage = getSampleADTMessage();
console.log('HL7 Message:');
console.log(sampleMessage.substring(0, 200) + '...');
console.log('\n---\n');

const result = analyzeDataQuality(sampleMessage);

console.log('Quality Analysis Results:');
console.log(`  Overall Score: ${result.overallScore}/100`);
console.log(`  Valid: ${result.isValid}`);
console.log(`  Message Type: ${result.messageType}`);
console.log(`  Total Segments: ${result.totalSegments}`);
console.log(`  Issues Found: ${result.issues.length}`);
console.log(`  Recommendations: ${result.recommendations.length}`);
console.log('\n---\n');

if (result.issues.length > 0) {
  console.log('Issues by Category:');
  Object.values(QUALITY_CATEGORIES).forEach(category => {
    const categoryIssues = result.issues.filter(i => i.category === category);
    if (categoryIssues.length > 0) {
      console.log(`  ${category}: ${categoryIssues.length}`);
      categoryIssues.forEach(issue => {
        console.log(`    - [${issue.severity}] ${issue.issue} (${issue.field})`);
      });
    }
  });
  
  console.log('\n---\n');
  console.log('Issues by Severity:');
  Object.values(SEVERITY).forEach(severity => {
    const severityIssues = result.issues.filter(i => i.severity === severity);
    if (severityIssues.length > 0) {
      console.log(`  ${severity}: ${severityIssues.length}`);
    }
  });
} else {
  console.log('No issues found! Message quality is excellent.');
}

console.log('\n\n');

// Example 2: Message with quality issues
console.log('=== Example 2: Message with Quality Issues ===\n');
const problematicMessage = `MSH|^~\\&|SendingApp||ReceivingApp||20240101||ADT^A01|12345|P|2.5
PID|1|||||19800115|X|||123 MAIN ST|CITY|ST|12345|USA||555-123-4567`;

console.log('HL7 Message (with issues):');
console.log(problematicMessage);
console.log('\n---\n');

const result2 = analyzeDataQuality(problematicMessage);
console.log(`Quality Score: ${result2.overallScore}/100`);
console.log(`Issues Found: ${result2.issues.length}`);
console.log('\nDetailed Issues:');
result2.issues.forEach((issue, index) => {
  console.log(`\n${index + 1}. ${issue.issue}`);
  console.log(`   Category: ${issue.category}`);
  console.log(`   Severity: ${issue.severity}`);
  console.log(`   Field: ${issue.field}`);
  console.log(`   Details: ${issue.details}`);
  console.log(`   Recommendation: ${issue.recommendation}`);
});

console.log('\n\n');

// Example 3: Use cases
console.log('=== Example 3: Use Cases ===\n');
const useCases = getUseCases();
console.log('Available Use Cases:');
useCases.forEach((useCase, index) => {
  console.log(`\n${index + 1}. ${useCase.title}`);
  console.log(`   Description: ${useCase.description}`);
  console.log(`   Benefits:`);
  useCase.benefits.forEach(benefit => {
    console.log(`     - ${benefit}`);
  });
});

console.log('\n\n');

// Example 4: Quality score interpretation
console.log('=== Example 4: Quality Score Interpretation ===\n');
const testMessages = [
  { name: 'Perfect Message', message: getSampleADTMessage() },
  { name: 'Missing Fields', message: `MSH|^~\\&|App|Facility|||20240101||ADT^A01|123|P|2.5
PID|1|||||19800115|M` },
  { name: 'Invalid Format', message: `MSH|^~\\&|App|Facility|||2024-01-01||ADT^A01|123|P|2.5
PID|1||MRN123||DOE^JOHN||1980/01/15|M` },
];

testMessages.forEach(({ name, message }) => {
  const result = analyzeDataQuality(message);
  let scoreLevel = 'Excellent';
  if (result.overallScore < 70) scoreLevel = 'Poor';
  else if (result.overallScore < 85) scoreLevel = 'Fair';
  else if (result.overallScore < 95) scoreLevel = 'Good';
  
  console.log(`${name}:`);
  console.log(`  Score: ${result.overallScore}/100 (${scoreLevel})`);
  console.log(`  Issues: ${result.issues.length}`);
  console.log(`  Critical: ${result.issues.filter(i => i.severity === SEVERITY.CRITICAL).length}`);
  console.log(`  High: ${result.issues.filter(i => i.severity === SEVERITY.HIGH).length}`);
});

console.log('\n\n');

// Example 5: Filtering issues
console.log('=== Example 5: Filtering Issues ===\n');
const result3 = analyzeDataQuality(sampleMessage);

// Get only critical and high severity issues
const criticalIssues = result3.issues.filter(i => 
  i.severity === SEVERITY.CRITICAL || i.severity === SEVERITY.HIGH
);
console.log(`Critical/High Priority Issues: ${criticalIssues.length}`);
criticalIssues.forEach(issue => {
  console.log(`  - ${issue.issue} (${issue.field})`);
});

// Get completeness issues only
const completenessIssues = result3.issues.filter(i => 
  i.category === QUALITY_CATEGORIES.COMPLETENESS
);
console.log(`\nCompleteness Issues: ${completenessIssues.length}`);
completenessIssues.forEach(issue => {
  console.log(`  - ${issue.issue} (${issue.field})`);
});
