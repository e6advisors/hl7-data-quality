# HL7 Data Quality Agent Library

A comprehensive JavaScript library for automated data quality analysis of HL7 v2.x messages. This library analyzes messages for completeness, accuracy, consistency, compliance, formatting, and business rule violations using rule-based validation.

## Features

- **Comprehensive Quality Analysis**: Analyzes messages across 6 quality dimensions
- **Automated Scoring**: Provides overall quality score (0-100) with detailed breakdown
- **Issue Categorization**: Categorizes issues by type (Completeness, Accuracy, Consistency, Compliance, Formatting, Business Rules)
- **Severity Levels**: Prioritizes issues by severity (Critical, High, Medium, Low, Info)
- **Actionable Recommendations**: Provides specific recommendations for each issue
- **Message Type Awareness**: Validates required segments based on message type
- **Format Validation**: Validates dates, identifiers, addresses, phone numbers
- **Business Rule Checking**: Validates logical relationships (dates, consistency)
- **Zero Dependencies**: Only requires the `hl7-parser` package for parsing HL7 messages

## Quality Dimensions

The library analyzes HL7 messages across six quality dimensions:

1. **Completeness** - Checks for required fields and segments
2. **Accuracy** - Validates data formats, codes, and values
3. **Consistency** - Ensures data consistency across segments
4. **Compliance** - Verifies adherence to HL7 standards
5. **Formatting** - Validates proper formatting of dates, identifiers, etc.
6. **Business Rules** - Checks logical relationships and business rules

## Installation

### Node.js

```bash
npm install hl7-data-quality hl7-parser
```

Or copy the `src/hl7DataQualityService.js` file directly into your project along with the `hl7-parser` package.

### Browser

Include both libraries in your HTML (after bundling):

```html
<script src="hl7ParserService.js"></script>
<script src="hl7DataQualityService.js"></script>
```

## Usage

### Basic Usage

```javascript
import { analyzeDataQuality, QUALITY_CATEGORIES, SEVERITY } from 'hl7-data-quality';
// Note: hl7-parser must also be installed and available

// Your HL7 message
const hl7Message = `MSH|^~\\&|SendingApp|SendingFacility|ReceivingApp|ReceivingFacility|20240101120000||ADT^A01^ADT_A01|12345|P|2.5
PID|1||MRN123456789^^^HOSPITAL^MR||DOE^JOHN^MIDDLE^JR^^L||19800115|M|||123 MAIN ST^^CITY^ST^12345^USA||555-123-4567`;

// Analyze message quality
const result = analyzeDataQuality(hl7Message);

console.log(`Overall Score: ${result.overallScore}/100`);
console.log(`Issues Found: ${result.issues.length}`);
result.issues.forEach(issue => {
  console.log(`${issue.severity}: ${issue.issue} (${issue.field})`);
});
```

### Example Output

**Analysis Result:**
```javascript
{
  overallScore: 85,
  isValid: true,
  messageType: 'ADT^A01^ADT_A01',
  totalSegments: 2,
  analysisDate: '2024-01-01T12:00:00.000Z',
  issues: [
    {
      category: 'Completeness',
      severity: 'Medium',
      field: 'PID-7',
      issue: 'Missing Date of Birth',
      details: 'Date of birth is important for patient identification and age calculation',
      recommendation: 'Add date of birth in PID-7 (format: YYYYMMDD)'
    }
  ],
  recommendations: [
    'Add date of birth in PID-7 (format: YYYYMMDD)'
  ]
}
```

## API Reference

### `analyzeDataQuality(hl7Message)`

Analyzes an HL7 message for data quality issues.

**Parameters:**
- `hl7Message` (string): The HL7 message to analyze

**Returns:**
- `Object`: Quality analysis results containing:
  - `overallScore` (number): Quality score from 0-100
  - `isValid` (boolean): Whether the message is valid
  - `messageType` (string): Message type from MSH-9
  - `totalSegments` (number): Total number of segments
  - `analysisDate` (string): ISO timestamp of analysis
  - `issues` (Array): Array of quality issues, each containing:
    - `category` (string): Issue category
    - `severity` (string): Severity level
    - `field` (string): Field or segment where issue was found
    - `issue` (string): Description of the issue
    - `details` (string): Detailed explanation
    - `recommendation` (string): Recommended action
  - `recommendations` (Array): General recommendations (deduplicated)

**Example:**
```javascript
const result = analyzeDataQuality(hl7Message);
if (result.isValid) {
  console.log(`Quality Score: ${result.overallScore}/100`);
  console.log(`Found ${result.issues.length} issues`);
} else {
  console.error('Message is invalid:', result.issues);
}
```

### `getSampleADTMessage()`

Returns a sample ADT message for testing.

**Returns:**
- `string`: A sample ADT^A01 message

**Example:**
```javascript
const sample = getSampleADTMessage();
const result = analyzeDataQuality(sample);
```

### `getUseCases()`

Returns use cases for the data quality agent.

**Returns:**
- `Array`: Array of use case objects with title, description, and benefits

**Example:**
```javascript
const useCases = getUseCases();
useCases.forEach(useCase => {
  console.log(useCase.title);
  console.log(useCase.description);
});
```

### Constants

#### `QUALITY_CATEGORIES`

Quality issue categories:
- `COMPLETENESS` - Missing required fields or segments
- `ACCURACY` - Invalid data formats or values
- `CONSISTENCY` - Data inconsistency across segments
- `COMPLIANCE` - Non-compliance with HL7 standards
- `FORMATTING` - Formatting issues
- `BUSINESS_RULES` - Business rule violations

#### `SEVERITY`

Issue severity levels:
- `CRITICAL` - Critical issues that must be fixed
- `HIGH` - High priority issues
- `MEDIUM` - Medium priority issues
- `LOW` - Low priority issues
- `INFO` - Informational issues

## Quality Checks Performed

### MSH Segment Completeness
- Validates presence of required MSH fields
- Checks date/time format
- Validates message structure

### Required Segments
- Checks for message-type-specific required segments
- ADT messages require PID and typically PV1
- Validates segment presence

### PID Segment Completeness
- Checks for patient name (PID-5)
- Validates patient identifier (PID-3)
- Validates date of birth (PID-7)
- Checks administrative sex (PID-8) with valid codes
- Validates date formats

### Date Format Validation
- Validates HL7 date/time formats throughout message
- Checks MSH-7, PID-7, PID-29, PV1-44, PV1-45, EVN-2
- Ensures dates match YYYYMMDD or YYYYMMDDHHMMSS format

### Identifier Format Validation
- Validates SSN format (PID-19)
- Checks identifier structure
- Validates identifier type codes

### Address Format Validation
- Checks address component structure
- Validates component separation (^ delimiter)
- Ensures proper address formatting

### Phone Format Validation
- Validates phone number formats (PID-13, PID-14)
- Checks for proper phone number structure
- Validates phone number patterns

### Data Consistency
- Checks consistency across related segments
- Validates patient class codes
- Ensures segment relationships are logical

### Business Rules
- Validates discharge date is after admit date
- Validates death date is after birth date
- Checks logical date relationships

### Version Compliance
- Validates HL7 version ID (MSH-12)
- Checks against standard HL7 v2.x versions
- Warns about non-standard versions

## Scoring System

The quality score starts at 100 and is reduced based on issues found:

- **Critical Issues**: -15 to -30 points
- **High Issues**: -5 to -10 points
- **Medium Issues**: -2 to -3 points
- **Low Issues**: -1 point
- **Info Issues**: No score reduction

Final score is clamped between 0 and 100.

## Dependencies

This library requires the `hl7-parser` package for parsing HL7 messages:

```bash
npm install hl7-parser
```

The parser is used internally to parse HL7 messages before analysis. If you're using this library in a browser, you'll need to bundle both libraries together.

### Using with Local Parser

If you're using a local copy of the parser or the `hl7-parser` package isn't published yet, you can modify the import in `src/hl7DataQualityService.js`:

```javascript
// Change from:
import { parseHL7Message, validateHL7Message } from 'hl7-parser'

// To:
import { parseHL7Message, validateHL7Message } from './path/to/your/hl7ParserService.js'
// or
import { parseHL7Message, validateHL7Message } from '../hl7-parser/src/hl7ParserService.js'
```

## Browser Compatibility

This library uses modern JavaScript features:
- ES6 modules (import/export)
- Template literals
- Arrow functions
- Array methods (map, filter, find, forEach)

For older browsers, you may need to transpile the code using Babel or similar tools.

## Node.js Compatibility

- Node.js 12+ recommended
- Node.js 14+ for optimal performance

## Testing

The library includes a sample ADT message generator for testing:

```javascript
import { 
  getSampleADTMessage, 
  analyzeDataQuality,
  QUALITY_CATEGORIES,
  SEVERITY
} from 'hl7-data-quality';

const sample = getSampleADTMessage();
const result = analyzeDataQuality(sample);

console.log('Quality Score:', result.overallScore);
console.log('Issues by Category:');
Object.values(QUALITY_CATEGORIES).forEach(category => {
  const categoryIssues = result.issues.filter(i => i.category === category);
  console.log(`  ${category}: ${categoryIssues.length}`);
});

console.log('Issues by Severity:');
Object.values(SEVERITY).forEach(severity => {
  const severityIssues = result.issues.filter(i => i.severity === severity);
  console.log(`  ${severity}: ${severityIssues.length}`);
});
```

## Use Cases

### Pre-Integration Validation
Validate HL7 messages before integrating with downstream systems to prevent data quality issues from propagating.

**Benefits:**
- Prevent integration failures
- Reduce data cleanup costs
- Improve system reliability

### Compliance Auditing
Audit HL7 messages for compliance with HL7 standards, organizational policies, and regulatory requirements.

**Benefits:**
- Ensure regulatory compliance
- Identify non-standard implementations
- Document data quality metrics

### Data Migration Quality Assurance
Assess data quality during system migrations to ensure data integrity and completeness.

**Benefits:**
- Identify data gaps early
- Plan migration remediation
- Ensure data completeness

### Ongoing Monitoring
Continuously monitor HL7 message quality from source systems to identify and address issues proactively.

**Benefits:**
- Early issue detection
- Proactive problem resolution
- Trend analysis and reporting

### Training and Education
Use quality reports to educate staff on HL7 standards and best practices for message construction.

**Benefits:**
- Improve staff knowledge
- Reduce future errors
- Standardize practices

## Limitations and Considerations

1. **HL7 Version**: This analyzer is designed for HL7 v2.x messages. HL7 v3 (XML-based) is not supported.

2. **Custom Segments**: Custom or vendor-specific segments may not be fully analyzed. You may need to extend the analysis functions.

3. **Validation Scope**: The analyzer performs rule-based validation. It does not validate against HL7 profile specifications or organizational-specific business rules.

4. **Score Interpretation**: Quality scores are relative and should be interpreted in context. A score of 90+ is generally good, but organizational requirements may vary.

5. **False Positives**: Some checks may flag issues that are acceptable in your environment. Review recommendations carefully.

6. **Performance**: For very large messages (thousands of segments), analysis may take longer. Consider batching for high-volume scenarios.

7. **Message Type Support**: Some checks are message-type-specific. Generic messages may not trigger all relevant checks.

8. **Reference Resolution**: The analyzer does not resolve external references (e.g., Practitioner references). Only in-message data is analyzed.

## Extending the Analyzer

To add custom quality checks:

1. Create a new check function following the pattern:
   ```javascript
   function checkCustomRule(parsed) {
     const issues = []
     let scorePenalty = 0
     
     // Your validation logic
     if (/* condition */) {
       issues.push({
         category: QUALITY_CATEGORIES.YOUR_CATEGORY,
         severity: SEVERITY.MEDIUM,
         field: 'SEGMENT-FIELD',
         issue: 'Description of issue',
         details: 'Detailed explanation',
         recommendation: 'Recommended action',
       })
       scorePenalty += 2
     }
     
     return { issues, scorePenalty }
   }
   ```

2. Add the check to the `analyzeDataQuality` function:
   ```javascript
   const checks = [
     // ... existing checks
     checkCustomRule(parsed),
   ]
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. When contributing:

1. Ensure your code follows the existing style
2. Add tests for new functionality
3. Update documentation as needed
4. Follow HL7 v2.x validation standards
5. Use appropriate severity levels and categories

## License

This project is provided as-is under the MIT License. See LICENSE file for details.

## Disclaimer

**IMPORTANT**: This software is provided for informational and development purposes. While it implements HL7 data quality analysis based on HL7 standards, users are responsible for:

- Verifying that analysis meets their specific requirements
- Validating results against organizational policies
- Testing thoroughly before production use
- Ensuring compliance with all applicable regulations and standards
- Reviewing recommendations for accuracy and relevance

The authors assume no liability for any misuse or errors in data quality analysis.

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

## Related Projects

- [hl7-parser](https://github.com/e6advisors/hl7-parser) - HL7 message parser (required dependency)

## Version History

- **1.0.0** - Initial release
  - Comprehensive data quality analysis
  - 6 quality dimensions
  - 5 severity levels
  - Automated scoring system
  - Message type awareness
  - Format validation
  - Business rule checking
