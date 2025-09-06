#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { 
  user, 
  recruiterProfiles, 
  jobPostings, 
  candidateJobMatches,
  recruiterAvailability,
  interviewSessionsScheduled,
  userSkills
} from '../src/db/schema';
import { randomUUID } from 'crypto';

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = new Client({ connectionString });
const db = drizzle(client);

// Mock data generators
const generateMockUsers = () => [
  {
    id: 'user_candidate_1',
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    emailVerified: true,
    image: null,
  },
  {
    id: 'user_candidate_2', 
    name: 'Marcus Johnson',
    email: 'marcus.johnson@example.com',
    emailVerified: true,
    image: null,
  },
  {
    id: 'user_candidate_3',
    name: 'Elena Rodriguez',
    email: 'elena.rodriguez@example.com', 
    emailVerified: true,
    image: null,
  },
  {
    id: 'user_recruiter_1',
    name: 'David Kim',
    email: 'david.kim@techcorp.com',
    emailVerified: true,
    image: null,
  },
  {
    id: 'user_recruiter_2',
    name: 'Lisa Thompson',
    email: 'lisa.thompson@startupco.com',
    emailVerified: true,
    image: null,
  },
  {
    id: 'user_recruiter_3',
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@enterprise.com',
    emailVerified: true,
    image: null,
  }
];

const generateMockRecruiterProfiles = () => [
  {
    id: 'recruiter_1',
    userId: 'user_recruiter_1',
    organizationName: 'TechCorp Solutions',
    recruitingFor: 'Software Engineering, DevOps, Data Science',
    contactEmail: 'david.kim@techcorp.com',
    phoneNumber: '+1-555-0123',
    timezone: 'America/New_York',
    calComUsername: 'david-kim-techcorp',
    calComConnected: true,
    calComUserId: 12345,
    calComScheduleId: 1,
  },
  {
    id: 'recruiter_2', 
    userId: 'user_recruiter_2',
    organizationName: 'StartupCo',
    recruitingFor: 'Full Stack Development, Product Management',
    contactEmail: 'lisa.thompson@startupco.com',
    phoneNumber: '+1-555-0456',
    timezone: 'America/Los_Angeles',
    calComUsername: 'lisa-startupco',
    calComConnected: true,
    calComUserId: 12346,
    calComScheduleId: 2,
  },
  {
    id: 'recruiter_3',
    userId: 'user_recruiter_3', 
    organizationName: 'Enterprise Corp',
    recruitingFor: 'Cloud Architecture, Security Engineering',
    contactEmail: 'ahmed.hassan@enterprise.com',
    phoneNumber: '+1-555-0789',
    timezone: 'America/Chicago',
    calComUsername: 'ahmed-enterprise',
    calComConnected: true,
    calComUserId: 12347,
    calComScheduleId: 3,
  }
];

const generateMockRecruiterAvailability = () => [
  {
    id: 'avail_1',
    recruiterId: 'recruiter_1',
    calComEventTypeId: 101,
    eventTypeName: 'Technical Interview - 45 min',
    eventTypeSlug: 'technical-interview-45min',
    duration: 45,
    isActive: true,
    calComData: {
      id: 101,
      title: 'Technical Interview - 45 min',
      slug: 'technical-interview-45min',
      length: 45,
      description: 'Technical interview for software engineering positions',
      locations: [{ type: 'integrations:zoom' }]
    }
  },
  {
    id: 'avail_2',
    recruiterId: 'recruiter_1', 
    calComEventTypeId: 102,
    eventTypeName: 'Initial Screening - 30 min',
    eventTypeSlug: 'initial-screening-30min',
    duration: 30,
    isActive: true,
    calComData: {
      id: 102,
      title: 'Initial Screening - 30 min',
      slug: 'initial-screening-30min', 
      length: 30,
      description: 'Initial screening call for candidates',
      locations: [{ type: 'integrations:zoom' }]
    }
  },
  {
    id: 'avail_3',
    recruiterId: 'recruiter_2',
    calComEventTypeId: 201,
    eventTypeName: 'Product Interview - 60 min',
    eventTypeSlug: 'product-interview-60min',
    duration: 60,
    isActive: true,
    calComData: {
      id: 201,
      title: 'Product Interview - 60 min',
      slug: 'product-interview-60min',
      length: 60,
      description: 'Product management interview',
      locations: [{ type: 'integrations:zoom' }]
    }
  },
  {
    id: 'avail_4',
    recruiterId: 'recruiter_3',
    calComEventTypeId: 301,
    eventTypeName: 'Security Architecture Review - 90 min',
    eventTypeSlug: 'security-arch-review-90min',
    duration: 90,
    isActive: true,
    calComData: {
      id: 301,
      title: 'Security Architecture Review - 90 min',
      slug: 'security-arch-review-90min',
      length: 90,
      description: 'Deep dive security architecture interview',
      locations: [{ type: 'integrations:zoom' }]
    }
  }
];

const generateMockJobPostings = () => [
  {
    id: 'job_1',
    recruiterId: 'recruiter_1',
    title: 'Senior Full Stack Developer',
    rawDescription: `We are looking for a Senior Full Stack Developer to join our growing team. 
    
    Requirements:
    - 5+ years of experience with React and Node.js
    - Strong knowledge of TypeScript, PostgreSQL, and AWS
    - Experience with Docker and Kubernetes
    - Familiarity with CI/CD pipelines
    
    Nice to have:
    - Experience with Next.js and tRPC
    - Knowledge of microservices architecture
    - Previous startup experience`,
    extractedSkills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Next.js', 'tRPC', 'Microservices'],
    requiredSkills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
    preferredSkills: ['Docker', 'Kubernetes', 'CI/CD', 'Next.js', 'tRPC'],
    experienceLevel: 'senior',
    salaryMin: 120000,
    salaryMax: 180000,
    location: 'New York, NY',
    remoteAllowed: true,
    employmentType: 'full-time',
    status: 'active',
    aiConfidenceScore: '0.92'
  },
  {
    id: 'job_2',
    recruiterId: 'recruiter_2',
    title: 'Product Manager - AI/ML',
    rawDescription: `Join our AI team as a Product Manager to drive the development of cutting-edge ML products.
    
    Requirements:
    - 3+ years of product management experience
    - Understanding of machine learning concepts
    - Experience with data analysis and metrics
    - Strong communication and leadership skills
    
    Preferred:
    - Technical background in CS or Engineering
    - Experience with Python and SQL
    - Previous experience in AI/ML products`,
    extractedSkills: ['Product Management', 'Machine Learning', 'Data Analysis', 'Leadership', 'Python', 'SQL', 'AI'],
    requiredSkills: ['Product Management', 'Machine Learning', 'Data Analysis', 'Leadership'],
    preferredSkills: ['Python', 'SQL', 'AI'],
    experienceLevel: 'mid',
    salaryMin: 130000,
    salaryMax: 170000,
    location: 'San Francisco, CA',
    remoteAllowed: true,
    employmentType: 'full-time',
    status: 'active',
    aiConfidenceScore: '0.88'
  },
  {
    id: 'job_3',
    recruiterId: 'recruiter_3',
    title: 'Cloud Security Engineer',
    rawDescription: `We need a Cloud Security Engineer to secure our cloud infrastructure and applications.
    
    Requirements:
    - 4+ years of cloud security experience
    - Deep knowledge of AWS security services
    - Experience with Infrastructure as Code (Terraform)
    - Understanding of compliance frameworks (SOC2, ISO27001)
    
    Preferred:
    - Security certifications (CISSP, CISM, AWS Security)
    - Experience with Kubernetes security
    - Knowledge of DevSecOps practices`,
    extractedSkills: ['Cloud Security', 'AWS', 'Terraform', 'SOC2', 'ISO27001', 'CISSP', 'CISM', 'Kubernetes', 'DevSecOps'],
    requiredSkills: ['Cloud Security', 'AWS', 'Terraform', 'SOC2'],
    preferredSkills: ['CISSP', 'CISM', 'Kubernetes', 'DevSecOps'],
    experienceLevel: 'senior',
    salaryMin: 140000,
    salaryMax: 200000,
    location: 'Chicago, IL',
    remoteAllowed: false,
    employmentType: 'full-time',
    status: 'active',
    aiConfidenceScore: '0.85'
  }
];

const generateMockUserSkills = () => [
  // Sarah Chen - Full Stack Developer
  { id: 'skill_1', userId: 'user_candidate_1', skillName: 'React', mentionCount: 15, proficiencyScore: '85', averageConfidence: '0.92' },
  { id: 'skill_2', userId: 'user_candidate_1', skillName: 'Node.js', mentionCount: 12, proficiencyScore: '80', averageConfidence: '0.88' },
  { id: 'skill_3', userId: 'user_candidate_1', skillName: 'TypeScript', mentionCount: 18, proficiencyScore: '90', averageConfidence: '0.95' },
  { id: 'skill_4', userId: 'user_candidate_1', skillName: 'PostgreSQL', mentionCount: 8, proficiencyScore: '75', averageConfidence: '0.85' },
  { id: 'skill_5', userId: 'user_candidate_1', skillName: 'AWS', mentionCount: 10, proficiencyScore: '70', averageConfidence: '0.80' },
  { id: 'skill_6', userId: 'user_candidate_1', skillName: 'Docker', mentionCount: 6, proficiencyScore: '65', averageConfidence: '0.75' },
  
  // Marcus Johnson - Product Manager
  { id: 'skill_7', userId: 'user_candidate_2', skillName: 'Product Management', mentionCount: 20, proficiencyScore: '88', averageConfidence: '0.90' },
  { id: 'skill_8', userId: 'user_candidate_2', skillName: 'Data Analysis', mentionCount: 14, proficiencyScore: '82', averageConfidence: '0.87' },
  { id: 'skill_9', userId: 'user_candidate_2', skillName: 'Leadership', mentionCount: 16, proficiencyScore: '85', averageConfidence: '0.89' },
  { id: 'skill_10', userId: 'user_candidate_2', skillName: 'Python', mentionCount: 8, proficiencyScore: '70', averageConfidence: '0.78' },
  { id: 'skill_11', userId: 'user_candidate_2', skillName: 'SQL', mentionCount: 12, proficiencyScore: '75', averageConfidence: '0.82' },
  
  // Elena Rodriguez - Security Engineer
  { id: 'skill_12', userId: 'user_candidate_3', skillName: 'Cloud Security', mentionCount: 18, proficiencyScore: '92', averageConfidence: '0.94' },
  { id: 'skill_13', userId: 'user_candidate_3', skillName: 'AWS', mentionCount: 22, proficiencyScore: '95', averageConfidence: '0.96' },
  { id: 'skill_14', userId: 'user_candidate_3', skillName: 'Terraform', mentionCount: 14, proficiencyScore: '88', averageConfidence: '0.91' },
  { id: 'skill_15', userId: 'user_candidate_3', skillName: 'Kubernetes', mentionCount: 16, proficiencyScore: '85', averageConfidence: '0.88' },
  { id: 'skill_16', userId: 'user_candidate_3', skillName: 'DevSecOps', mentionCount: 10, proficiencyScore: '80', averageConfidence: '0.85' }
];

const generateMockJobMatches = () => [
  // Sarah Chen matches
  {
    id: 'match_1',
    jobPostingId: 'job_1',
    candidateId: 'user_candidate_1',
    matchScore: '87.50',
    matchingSkills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS', 'Docker'],
    skillGaps: ['Kubernetes', 'CI/CD'],
    overallFit: 'excellent'
  },
  
  // Marcus Johnson matches
  {
    id: 'match_2',
    jobPostingId: 'job_2',
    candidateId: 'user_candidate_2',
    matchScore: '92.00',
    matchingSkills: ['Product Management', 'Data Analysis', 'Leadership', 'Python', 'SQL'],
    skillGaps: ['Machine Learning'],
    overallFit: 'excellent'
  },
  
  // Elena Rodriguez matches
  {
    id: 'match_3',
    jobPostingId: 'job_3',
    candidateId: 'user_candidate_3',
    matchScore: '95.00',
    matchingSkills: ['Cloud Security', 'AWS', 'Terraform', 'Kubernetes', 'DevSecOps'],
    skillGaps: ['SOC2', 'CISSP'],
    overallFit: 'excellent'
  }
];

async function createMockData() {
  try {
    await client.connect();
    console.log('Creating mock data...');
    
    // Insert users
    console.log('Inserting users...');
    await db.insert(user).values(generateMockUsers()).onConflictDoNothing();
    
    // Insert recruiter profiles
    console.log('Inserting recruiter profiles...');
    await db.insert(recruiterProfiles).values(generateMockRecruiterProfiles()).onConflictDoNothing();
    
    // Insert recruiter availability
    console.log('Inserting recruiter availability...');
    await db.insert(recruiterAvailability).values(generateMockRecruiterAvailability()).onConflictDoNothing();
    
    // Insert job postings
    console.log('Inserting job postings...');
    await db.insert(jobPostings).values(generateMockJobPostings()).onConflictDoNothing();
    
    // Insert user skills
    console.log('Inserting user skills...');
    await db.insert(userSkills).values(generateMockUserSkills()).onConflictDoNothing();
    
    // Insert job matches
    console.log('Inserting job matches...');
    await db.insert(candidateJobMatches).values(generateMockJobMatches()).onConflictDoNothing();
    
    console.log('Mock data created successfully!');
    
    // Print summary
    console.log('\n=== Mock Data Summary ===');
    console.log('Users: 6 (3 candidates, 3 recruiters)');
    console.log('Recruiter Profiles: 3');
    console.log('Event Types: 4');
    console.log('Job Postings: 3');
    console.log('User Skills: 16');
    console.log('Job Matches: 3');
    console.log('\n=== Test Accounts ===');
    console.log('Candidates:');
    console.log('- sarah.chen@example.com (Full Stack Developer)');
    console.log('- marcus.johnson@example.com (Product Manager)');
    console.log('- elena.rodriguez@example.com (Security Engineer)');
    console.log('\nRecruiters:');
    console.log('- david.kim@techcorp.com (TechCorp Solutions)');
    console.log('- lisa.thompson@startupco.com (StartupCo)');
    console.log('- ahmed.hassan@enterprise.com (Enterprise Corp)');
    
  } catch (error) {
    console.error('Error creating mock data:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createMockData();