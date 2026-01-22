/**
 * HL7 Data Quality Agent Service
 * 
 * Automated data quality analysis for HL7 messages.
 * Analyzes messages for completeness, accuracy, consistency, and compliance issues
 * using rule-based validation and pattern matching.
 */

import { parseHL7Message, validateHL7Message } from 'hl7-parser'

/**
 * Quality check categories
 */
export const QUALITY_CATEGORIES = {
  COMPLETENESS: 'Completeness',
  ACCURACY: 'Accuracy',
  CONSISTENCY: 'Consistency',
  COMPLIANCE: 'Compliance',
  FORMATTING: 'Formatting',
  BUSINESS_RULES: 'Business Rules',
}

/**
 * Severity levels for quality issues
 */
export const SEVERITY = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
  INFO: 'Info',
}

/**
 * Analyzes an HL7 message for data quality issues
 * @param {string} hl7Message - The HL7 message to analyze
 * @returns {Object} Quality analysis results
 */
export function analyzeDataQuality(hl7Message) {
  const issues = []
  const recommendations = []
  let overallScore = 100

  try {
    // Validate message structure first
    const validation = validateHL7Message(hl7Message)
    if (!validation.isValid) {
      issues.push({
        category: QUALITY_CATEGORIES.FORMATTING,
        severity: SEVERITY.CRITICAL,
        field: 'Message Structure',
        issue: 'Invalid HL7 message format',
        details: validation.errors?.join('; ') || 'Message does not conform to HL7 standards',
        recommendation: 'Ensure message starts with MSH segment and contains proper delimiters',
      })
      overallScore -= 30
      return {
        overallScore: Math.max(0, overallScore),
        issues,
        recommendations,
        isValid: false,
      }
    }

    // Parse the message
    const parsed = parseHL7Message(hl7Message)

    // Run quality checks
    const checks = [
      checkMSHCompleteness(parsed),
      checkRequiredSegments(parsed),
      checkPIDCompleteness(parsed),
      checkDateFormats(parsed),
      checkIdentifierFormats(parsed),
      checkAddressFormats(parsed),
      checkPhoneFormats(parsed),
      checkDataConsistency(parsed),
      checkBusinessRules(parsed),
      checkVersionCompliance(parsed),
    ]

    checks.forEach(checkResult => {
      if (checkResult.issues) {
        issues.push(...checkResult.issues)
      }
      if (checkResult.recommendations) {
        recommendations.push(...checkResult.recommendations)
      }
      if (checkResult.scorePenalty) {
        overallScore -= checkResult.scorePenalty
      }
    })

    // Calculate final score
    overallScore = Math.max(0, Math.min(100, overallScore))

    return {
      overallScore,
      issues,
      recommendations: [...new Set(recommendations)], // Remove duplicates
      isValid: true,
      messageType: parsed.messageType,
      totalSegments: parsed.totalSegments,
      analysisDate: new Date().toISOString(),
    }
  } catch (error) {
    issues.push({
      category: QUALITY_CATEGORIES.FORMATTING,
      severity: SEVERITY.CRITICAL,
      field: 'Message Parsing',
      issue: 'Failed to parse message',
      details: error.message,
      recommendation: 'Review message format and ensure it follows HL7 v2.x standards',
    })
    return {
      overallScore: 0,
      issues,
      recommendations: ['Fix parsing errors before proceeding with quality analysis'],
      isValid: false,
    }
  }
}

/**
 * Checks MSH segment completeness
 */
function checkMSHCompleteness(parsed) {
  const issues = []
  const recommendations = []
  let scorePenalty = 0

  const mshSegment = parsed.segments.find(s => s.segmentType === 'MSH')
  if (!mshSegment) {
    return { issues: [{ category: QUALITY_CATEGORIES.COMPLETENESS, severity: SEVERITY.CRITICAL, field: 'MSH', issue: 'Missing MSH segment', details: 'All HL7 messages must start with an MSH segment', recommendation: 'Add MSH segment as the first segment' }], scorePenalty: 20 }
  }

  const msh = mshSegment.parsed
  const requiredFields = {
    field3: 'Sending Application',
    field4: 'Sending Facility',
    field5: 'Receiving Application',
    field6: 'Receiving Facility',
    field9: 'Message Type',
    field10: 'Message Control ID',
    field12: 'Version ID',
  }

  Object.entries(requiredFields).forEach(([field, name]) => {
    if (!msh[field] || msh[field] === '' || msh[field] === 'Unknown') {
      issues.push({
        category: QUALITY_CATEGORIES.COMPLETENESS,
        severity: SEVERITY.HIGH,
        field: `MSH-${field.replace('field', '')}`,
        issue: `Missing ${name}`,
        details: `${name} is required in MSH segment`,
        recommendation: `Populate MSH-${field.replace('field', '')} with appropriate value`,
      })
      scorePenalty += 2
    }
  })

  // Check date/time format
  if (msh.field7 && msh.field7 !== 'Unknown') {
    const dateTimeRegex = /^\d{14}(\.\d{1,4})?([\+\-]\d{4})?$/
    if (!dateTimeRegex.test(msh.field7)) {
      issues.push({
        category: QUALITY_CATEGORIES.FORMATTING,
        severity: SEVERITY.MEDIUM,
        field: 'MSH-7',
        issue: 'Invalid Date/Time format',
        details: `Date/Time should be in format YYYYMMDDHHMMSS[.SSSS][+/-ZZZZ]`,
        recommendation: 'Format date/time as YYYYMMDDHHMMSS (e.g., 20240101120000)',
      })
      scorePenalty += 1
    }
  } else {
    issues.push({
      category: QUALITY_CATEGORIES.COMPLETENESS,
      severity: SEVERITY.HIGH,
      field: 'MSH-7',
      issue: 'Missing Date/Time of Message',
      details: 'Message timestamp is required',
      recommendation: 'Add Date/Time of Message in MSH-7',
    })
    scorePenalty += 2
  }

  return { issues, recommendations, scorePenalty }
}

/**
 * Checks for required segments based on message type
 */
function checkRequiredSegments(parsed) {
  const issues = []
  let scorePenalty = 0

  const messageType = parsed.messageType || ''
  const segmentTypes = parsed.segments.map(s => s.segmentType)

  // ADT messages require PID and PV1
  if (messageType.includes('ADT')) {
    if (!segmentTypes.includes('PID')) {
      issues.push({
        category: QUALITY_CATEGORIES.COMPLETENESS,
        severity: SEVERITY.CRITICAL,
        field: 'PID',
        issue: 'Missing PID segment',
        details: 'ADT messages require a PID (Patient Identification) segment',
        recommendation: 'Add PID segment with patient identification information',
      })
      scorePenalty += 15
    }
    if (!segmentTypes.includes('PV1')) {
      issues.push({
        category: QUALITY_CATEGORIES.COMPLETENESS,
        severity: SEVERITY.HIGH,
        field: 'PV1',
        issue: 'Missing PV1 segment',
        details: 'ADT messages typically require a PV1 (Patient Visit) segment',
        recommendation: 'Add PV1 segment with patient visit information',
      })
      scorePenalty += 10
    }
  }

  return { issues, scorePenalty }
}

/**
 * Checks PID segment completeness
 */
function checkPIDCompleteness(parsed) {
  const issues = []
  const recommendations = []
  let scorePenalty = 0

  const pidSegment = parsed.segments.find(s => s.segmentType === 'PID')
  if (!pidSegment) {
    return { issues, recommendations, scorePenalty }
  }

  const pid = pidSegment.parsed

  // Check for patient name
  if (!pid.field5 || pid.field5 === '') {
    issues.push({
      category: QUALITY_CATEGORIES.COMPLETENESS,
      severity: SEVERITY.HIGH,
      field: 'PID-5',
      issue: 'Missing Patient Name',
      details: 'Patient name is typically required for patient identification',
      recommendation: 'Add patient name in PID-5 (format: Last^First^Middle^Suffix)',
    })
    scorePenalty += 5
  }

  // Check for patient identifier
  if (!pid.field3 || pid.field3 === '') {
    issues.push({
      category: QUALITY_CATEGORIES.COMPLETENESS,
      severity: SEVERITY.HIGH,
      field: 'PID-3',
      issue: 'Missing Patient Identifier',
      details: 'Patient identifier is required for proper patient matching',
      recommendation: 'Add patient identifier list in PID-3',
    })
    scorePenalty += 5
  }

  // Check for date of birth
  if (!pid.field7 || pid.field7 === '') {
    issues.push({
      category: QUALITY_CATEGORIES.COMPLETENESS,
      severity: SEVERITY.MEDIUM,
      field: 'PID-7',
      issue: 'Missing Date of Birth',
      details: 'Date of birth is important for patient identification and age calculation',
      recommendation: 'Add date of birth in PID-7 (format: YYYYMMDD)',
    })
    scorePenalty += 3
  } else {
    // Validate DOB format
    const dobRegex = /^\d{8}(\d{6})?(\d{1,4})?([\+\-]\d{4})?$/
    if (!dobRegex.test(pid.field7)) {
      issues.push({
        category: QUALITY_CATEGORIES.FORMATTING,
        severity: SEVERITY.MEDIUM,
        field: 'PID-7',
        issue: 'Invalid Date of Birth format',
        details: 'Date of birth should be in format YYYYMMDD',
        recommendation: 'Format date of birth as YYYYMMDD (e.g., 19800115)',
      })
      scorePenalty += 2
    }
  }

  // Check for administrative sex
  if (!pid.field8 || pid.field8 === '') {
    issues.push({
      category: QUALITY_CATEGORIES.COMPLETENESS,
      severity: SEVERITY.LOW,
      field: 'PID-8',
      issue: 'Missing Administrative Sex',
      details: 'Administrative sex is useful for demographic reporting',
      recommendation: 'Add administrative sex in PID-8 (M, F, O, U, or A)',
    })
    scorePenalty += 1
  } else if (!['M', 'F', 'O', 'U', 'A'].includes(pid.field8)) {
    issues.push({
      category: QUALITY_CATEGORIES.ACCURACY,
      severity: SEVERITY.MEDIUM,
      field: 'PID-8',
      issue: 'Invalid Administrative Sex value',
      details: `Value "${pid.field8}" is not a valid administrative sex code`,
      recommendation: 'Use valid codes: M (Male), F (Female), O (Other), U (Unknown), A (Ambiguous)',
    })
    scorePenalty += 2
  }

  return { issues, recommendations, scorePenalty }
}

/**
 * Checks date formats throughout the message
 */
function checkDateFormats(parsed) {
  const issues = []
  let scorePenalty = 0

  const dateFields = [
    { segment: 'MSH', field: 'field7', name: 'Date/Time of Message' },
    { segment: 'PID', field: 'field7', name: 'Date of Birth' },
    { segment: 'PID', field: 'field29', name: 'Patient Death Date' },
    { segment: 'PV1', field: 'field44', name: 'Admit Date/Time' },
    { segment: 'PV1', field: 'field45', name: 'Discharge Date/Time' },
    { segment: 'EVN', field: 'field2', name: 'Recorded Date/Time' },
  ]

  dateFields.forEach(({ segment, field, name }) => {
    const seg = parsed.segments.find(s => s.segmentType === segment)
    if (seg && seg.parsed[field]) {
      const value = seg.parsed[field]
      // Check if it's a valid date format (YYYYMMDD or YYYYMMDDHHMMSS)
      const dateRegex = /^\d{8}(\d{6})?(\d{1,4})?([\+\-]\d{4})?$/
      if (!dateRegex.test(value)) {
        issues.push({
          category: QUALITY_CATEGORIES.FORMATTING,
          severity: SEVERITY.MEDIUM,
          field: `${segment}-${field.replace('field', '')}`,
          issue: `Invalid ${name} format`,
          details: `Date value "${value}" does not match HL7 date format`,
          recommendation: 'Format dates as YYYYMMDD or YYYYMMDDHHMMSS',
        })
        scorePenalty += 1
      }
    }
  })

  return { issues, scorePenalty }
}

/**
 * Checks identifier formats
 */
function checkIdentifierFormats(parsed) {
  const issues = []
  let scorePenalty = 0

  const pidSegment = parsed.segments.find(s => s.segmentType === 'PID')
  if (pidSegment && pidSegment.parsed.field19) {
    const ssn = pidSegment.parsed.field19
    // SSN should be 9 digits (may be formatted with dashes)
    const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/
    if (!ssnRegex.test(ssn)) {
      issues.push({
        category: QUALITY_CATEGORIES.FORMATTING,
        severity: SEVERITY.MEDIUM,
        field: 'PID-19',
        issue: 'Invalid SSN format',
        details: `SSN "${ssn}" does not match expected format`,
        recommendation: 'Format SSN as XXX-XX-XXXX or XXXXXXXXX',
      })
      scorePenalty += 2
    }
  }

  return { issues, scorePenalty }
}

/**
 * Checks address formats
 */
function checkAddressFormats(parsed) {
  const issues = []
  let scorePenalty = 0

  const pidSegment = parsed.segments.find(s => s.segmentType === 'PID')
  if (pidSegment && pidSegment.parsed.field11) {
    const address = pidSegment.parsed.field11
    // Address should have components separated by ^
    if (typeof address === 'string' && !address.includes('^')) {
      issues.push({
        category: QUALITY_CATEGORIES.FORMATTING,
        severity: SEVERITY.LOW,
        field: 'PID-11',
        issue: 'Address may be missing components',
        details: 'HL7 addresses should have components separated by ^ (Street^City^State^Zip^Country)',
        recommendation: 'Format address with components: Street^City^State^Zip^Country',
      })
      scorePenalty += 1
    }
  }

  return { issues, scorePenalty }
}

/**
 * Checks phone number formats
 */
function checkPhoneFormats(parsed) {
  const issues = []
  let scorePenalty = 0

  const pidSegment = parsed.segments.find(s => s.segmentType === 'PID')
  if (pidSegment) {
    const phoneFields = [
      { field: 'field13', name: 'Phone Number - Home' },
      { field: 'field14', name: 'Phone Number - Business' },
    ]

    phoneFields.forEach(({ field, name }) => {
      if (pidSegment.parsed[field]) {
        const phone = pidSegment.parsed[field]
        // Phone should be in format [NNN][(999)]999-9999[X99999][B99999][C any text]
        // Simplified check: should contain digits
        const phoneRegex = /[\d\-\(\)\s]+/
        if (!phoneRegex.test(phone)) {
          issues.push({
            category: QUALITY_CATEGORIES.FORMATTING,
            severity: SEVERITY.LOW,
            field: `PID-${field.replace('field', '')}`,
            issue: `Invalid ${name} format`,
            details: `Phone number "${phone}" may not be properly formatted`,
            recommendation: 'Format phone as [NNN][(999)]999-9999[X99999]',
          })
          scorePenalty += 1
        }
      }
    })
  }

  return { issues, scorePenalty }
}

/**
 * Checks data consistency across segments
 */
function checkDataConsistency(parsed) {
  const issues = []
  let scorePenalty = 0

  // Check if PID and PV1 both exist and have consistent patient class
  const pidSegment = parsed.segments.find(s => s.segmentType === 'PID')
  const pv1Segment = parsed.segments.find(s => s.segmentType === 'PV1')

  if (pidSegment && pv1Segment) {
    // Check patient class consistency (if applicable)
    const recommendations = []
    if (pv1Segment.parsed.field2) {
      const patientClass = pv1Segment.parsed.field2
      if (!['I', 'O', 'E', 'P', 'R', 'B', 'N', 'U'].includes(patientClass)) {
        issues.push({
          category: QUALITY_CATEGORIES.CONSISTENCY,
          severity: SEVERITY.MEDIUM,
          field: 'PV1-2',
          issue: 'Invalid Patient Class',
          details: `Patient class "${patientClass}" is not a valid code`,
          recommendation: 'Use valid codes: I (Inpatient), O (Outpatient), E (Emergency), P (Preadmit), R (Recurring), B (Obstetrics), N (Newborn), U (Unknown)',
        })
        scorePenalty += 2
      }
    }
  }

  return { issues, scorePenalty }
}

/**
 * Checks business rules
 */
function checkBusinessRules(parsed) {
  const issues = []
  let scorePenalty = 0

  // Check if discharge date is after admit date
  const pv1Segment = parsed.segments.find(s => s.segmentType === 'PV1')
  if (pv1Segment) {
    const admitDate = pv1Segment.parsed.field44
    const dischargeDate = pv1Segment.parsed.field45

    if (admitDate && dischargeDate) {
      const admit = new Date(admitDate.substring(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'))
      const discharge = new Date(dischargeDate.substring(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'))

      if (discharge < admit) {
        issues.push({
          category: QUALITY_CATEGORIES.BUSINESS_RULES,
          severity: SEVERITY.HIGH,
          field: 'PV1-44/45',
          issue: 'Discharge date before admit date',
          details: 'Discharge date should not be earlier than admit date',
          recommendation: 'Verify and correct admit and discharge dates',
        })
        scorePenalty += 5
      }
    }
  }

  // Check if death date is after birth date
  const pidSegment = parsed.segments.find(s => s.segmentType === 'PID')
  if (pidSegment) {
    const birthDate = pidSegment.parsed.field7
    const deathDate = pidSegment.parsed.field29

    if (birthDate && deathDate) {
      const birth = new Date(birthDate.substring(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'))
      const death = new Date(deathDate.substring(0, 8).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'))

      if (death < birth) {
        issues.push({
          category: QUALITY_CATEGORIES.BUSINESS_RULES,
          severity: SEVERITY.HIGH,
          field: 'PID-7/29',
          issue: 'Death date before birth date',
          details: 'Death date should not be earlier than birth date',
          recommendation: 'Verify and correct birth and death dates',
        })
        scorePenalty += 5
      }
    }
  }

  return { issues, scorePenalty }
}

/**
 * Checks version compliance
 */
function checkVersionCompliance(parsed) {
  const issues = []
  let scorePenalty = 0

  const mshSegment = parsed.segments.find(s => s.segmentType === 'MSH')
  if (mshSegment && mshSegment.parsed.field12) {
    const version = mshSegment.parsed.field12
    const validVersions = ['2.1', '2.2', '2.3', '2.3.1', '2.4', '2.5', '2.5.1', '2.6', '2.7', '2.8', '2.8.1', '2.8.2']
    
    if (!validVersions.includes(version)) {
      issues.push({
        category: QUALITY_CATEGORIES.COMPLIANCE,
        severity: SEVERITY.MEDIUM,
        field: 'MSH-12',
        issue: 'Unusual HL7 version',
        details: `Version "${version}" is not a standard HL7 v2.x version`,
        recommendation: 'Verify version ID matches actual message structure (common versions: 2.3, 2.4, 2.5, 2.8)',
      })
      scorePenalty += 2
    }
  }

  return { issues, scorePenalty }
}

/**
 * Gets sample ADT message for testing
 */
export function getSampleADTMessage() {
  return `MSH|^~\\&|SendingApp|SendingFacility|ReceivingApp|ReceivingFacility|20240101120000||ADT^A01^ADT_A01|12345|P|2.5
EVN|A01|20240101120000|||SendingUserID
PID|1||MRN123456789^^^HOSPITAL^MR||DOE^JOHN^MIDDLE^JR^^L||19800115|M|||123 MAIN ST^^CITY^ST^12345^USA||555-123-4567|||SSN123456789||DL123456789^STATE^20250101
NK1|1|SMITH^JANE^M^||WIFE|456 SECOND ST^^CITY^ST^67890^USA|555-987-6543|555-111-2222|||20200101
PV1|1|I|ICU^101^A|||123456^DOCTOR^JOHN^MD^^MD|||SUR|||||123456789|||V123456||20240101100000|20240101120000
OBX|1|NM|HR^Heart Rate^LN||72|/min^beats per minute^UCUM|N|||F|||20240101120000`
}

/**
 * Gets use cases for the data quality agent
 */
export function getUseCases() {
  return [
    {
      title: 'Pre-Integration Validation',
      description: 'Validate HL7 messages before integrating with downstream systems to prevent data quality issues from propagating.',
      benefits: [
        'Prevent integration failures',
        'Reduce data cleanup costs',
        'Improve system reliability',
      ],
    },
    {
      title: 'Compliance Auditing',
      description: 'Audit HL7 messages for compliance with HL7 standards, organizational policies, and regulatory requirements.',
      benefits: [
        'Ensure regulatory compliance',
        'Identify non-standard implementations',
        'Document data quality metrics',
      ],
    },
    {
      title: 'Data Migration Quality Assurance',
      description: 'Assess data quality during system migrations to ensure data integrity and completeness.',
      benefits: [
        'Identify data gaps early',
        'Plan migration remediation',
        'Ensure data completeness',
      ],
    },
    {
      title: 'Ongoing Monitoring',
      description: 'Continuously monitor HL7 message quality from source systems to identify and address issues proactively.',
      benefits: [
        'Early issue detection',
        'Proactive problem resolution',
        'Trend analysis and reporting',
      ],
    },
    {
      title: 'Training and Education',
      description: 'Use quality reports to educate staff on HL7 standards and best practices for message construction.',
      benefits: [
        'Improve staff knowledge',
        'Reduce future errors',
        'Standardize practices',
      ],
    },
  ]
}
