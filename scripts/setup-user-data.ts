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
import { eq, not } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = new Client({ connectionString });
const db = drizzle(client);

// Your actual user email
const USER_EMAIL = 'sumiranmishra35@gmail.com';
const USER_ID = 'test-user-123';

async function setupUserData() {
  try {
    await client.connect();
    console.log('Setting up user data...');
    
    // 1. Check if your user exists, if not create it
    console.log('Setting up your user...');
    const existingUser = await db.select().from(user).where(eq(user.email, USER_EMAIL)).limit(1);
    
    if (existingUser.length === 0) {
      // Create new user
      await db.insert(user).values({
        id: USER_ID,
        name: 'Sumiran Mishra',
        email: USER_EMAIL,
        emailVerified: true,
        image: null,
      });
    } else {
      // Update existing user to use our preferred ID if different
      if (existingUser[0].id !== USER_ID) {
        console.log(`User exists with ID: ${existingUser[0].id}, using that ID instead`);
        // Use the existing user's ID
        const actualUserId = existingUser[0].id;
        // Update our USER_ID variable for the rest of the script
        (global as any).USER_ID = actualUserId;
      }
    }
    
    // Get the actual user ID to use
    const actualUser = await db.select().from(user).where(eq(user.email, USER_EMAIL)).limit(1);
    const actualUserId = actualUser[0].id;
    
    // 3. Add comprehensive skills for your user
    console.log('Adding skills for your user...');
    
    // Clear existing skills first
    await db.delete(userSkills).where(eq(userSkills.userId, actualUserId));
    
    const skillsToAdd = [
      // Frontend Skills
      { skillName: 'React', mentionCount: 25, proficiencyScore: '95', averageConfidence: '0.95' },
      { skillName: 'TypeScript', mentionCount: 30, proficiencyScore: '90', averageConfidence: '0.92' },
      { skillName: 'JavaScript', mentionCount: 35, proficiencyScore: '95', averageConfidence: '0.96' },
      { skillName: 'Next.js', mentionCount: 20, proficiencyScore: '88', averageConfidence: '0.90' },
      { skillName: 'HTML', mentionCount: 40, proficiencyScore: '98', averageConfidence: '0.98' },
      { skillName: 'CSS', mentionCount: 35, proficiencyScore: '92', averageConfidence: '0.94' },
      { skillName: 'Tailwind CSS', mentionCount: 18, proficiencyScore: '85', averageConfidence: '0.88' },
      
      // Backend Skills
      { skillName: 'Node.js', mentionCount: 28, proficiencyScore: '90', averageConfidence: '0.91' },
      { skillName: 'Express.js', mentionCount: 22, proficiencyScore: '85', averageConfidence: '0.87' },
      { skillName: 'Python', mentionCount: 25, proficiencyScore: '88', averageConfidence: '0.89' },
      { skillName: 'FastAPI', mentionCount: 15, proficiencyScore: '80', averageConfidence: '0.82' },
      { skillName: 'Django', mentionCount: 12, proficiencyScore: '75', averageConfidence: '0.78' },
      
      // Database Skills
      { skillName: 'PostgreSQL', mentionCount: 20, proficiencyScore: '85', averageConfidence: '0.86' },
      { skillName: 'MongoDB', mentionCount: 18, proficiencyScore: '80', averageConfidence: '0.83' },
      { skillName: 'Redis', mentionCount: 10, proficiencyScore: '70', averageConfidence: '0.75' },
      { skillName: 'SQL', mentionCount: 25, proficiencyScore: '88', averageConfidence: '0.90' },
      
      // Cloud & DevOps
      { skillName: 'AWS', mentionCount: 22, proficiencyScore: '82', averageConfidence: '0.85' },
      { skillName: 'Docker', mentionCount: 18, proficiencyScore: '78', averageConfidence: '0.80' },
      { skillName: 'Kubernetes', mentionCount: 12, proficiencyScore: '70', averageConfidence: '0.75' },
      { skillName: 'CI/CD', mentionCount: 15, proficiencyScore: '75', averageConfidence: '0.78' },
      { skillName: 'Terraform', mentionCount: 8, proficiencyScore: '65', averageConfidence: '0.70' },
      
      // AI/ML Skills
      { skillName: 'Machine Learning', mentionCount: 20, proficiencyScore: '85', averageConfidence: '0.87' },
      { skillName: 'Deep Learning', mentionCount: 15, proficiencyScore: '80', averageConfidence: '0.82' },
      { skillName: 'TensorFlow', mentionCount: 12, proficiencyScore: '75', averageConfidence: '0.78' },
      { skillName: 'PyTorch', mentionCount: 10, proficiencyScore: '72', averageConfidence: '0.75' },
      { skillName: 'OpenAI API', mentionCount: 18, proficiencyScore: '88', averageConfidence: '0.90' },
      { skillName: 'LangChain', mentionCount: 14, proficiencyScore: '82', averageConfidence: '0.85' },
      
      // Product & Management
      { skillName: 'Product Management', mentionCount: 16, proficiencyScore: '80', averageConfidence: '0.83' },
      { skillName: 'Agile', mentionCount: 20, proficiencyScore: '85', averageConfidence: '0.87' },
      { skillName: 'Scrum', mentionCount: 18, proficiencyScore: '82', averageConfidence: '0.85' },
      { skillName: 'Leadership', mentionCount: 22, proficiencyScore: '88', averageConfidence: '0.90' },
      { skillName: 'Team Management', mentionCount: 15, proficiencyScore: '85', averageConfidence: '0.87' },
      
      // Data & Analytics
      { skillName: 'Data Analysis', mentionCount: 18, proficiencyScore: '85', averageConfidence: '0.87' },
      { skillName: 'Data Science', mentionCount: 16, proficiencyScore: '82', averageConfidence: '0.85' },
      { skillName: 'Pandas', mentionCount: 14, proficiencyScore: '80', averageConfidence: '0.82' },
      { skillName: 'NumPy', mentionCount: 12, proficiencyScore: '78', averageConfidence: '0.80' },
      
      // Security
      { skillName: 'Cybersecurity', mentionCount: 10, proficiencyScore: '75', averageConfidence: '0.78' },
      { skillName: 'Security Architecture', mentionCount: 8, proficiencyScore: '70', averageConfidence: '0.75' },
      
      // Mobile
      { skillName: 'React Native', mentionCount: 12, proficiencyScore: '75', averageConfidence: '0.78' },
      { skillName: 'Mobile Development', mentionCount: 10, proficiencyScore: '72', averageConfidence: '0.75' },
    ];
    
    const userSkillsData = skillsToAdd.map(skill => ({
      id: nanoid(),
      userId: actualUserId,
      skillName: skill.skillName,
      mentionCount: skill.mentionCount,
      proficiencyScore: skill.proficiencyScore,
      averageConfidence: skill.averageConfidence,
      averageEngagement: 'high',
      topicDepthAverage: '0.8',
      firstMentioned: new Date(),
      lastMentioned: new Date(),
      synonyms: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    await db.insert(userSkills).values(userSkillsData);
    
    // 4. Keep the existing job postings and recruiters (they're good for testing)
    console.log('Job postings and recruiters kept for matching...');
    
    // 5. Create job matches for your user
    console.log('Creating job matches for your user...');
    
    // Clear existing matches
    await db.delete(candidateJobMatches).where(eq(candidateJobMatches.candidateId, actualUserId));
    
    // Get existing job postings
    const existingJobs = await db.select().from(jobPostings);
    
    const jobMatches = existingJobs.map(job => ({
      id: nanoid(),
      jobPostingId: job.id,
      candidateId: actualUserId,
      matchScore: '92.50', // High match score
      matchingSkills: ['React', 'TypeScript', 'Node.js', 'AWS', 'Python', 'Machine Learning'],
      skillGaps: ['Kubernetes', 'GraphQL'],
      overallFit: 'excellent' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    if (jobMatches.length > 0) {
      await db.insert(candidateJobMatches).values(jobMatches);
    }
    
    console.log('User data setup completed successfully!');
    
    // Print summary
    console.log('\n=== Setup Summary ===');
    console.log(`User: ${USER_EMAIL} (ID: ${actualUserId})`);
    console.log(`Skills added: ${skillsToAdd.length}`);
    console.log(`Job matches created: ${jobMatches.length}`);
    console.log('\n=== Your Skills ===');
    skillsToAdd.forEach(skill => {
      console.log(`- ${skill.skillName}: ${skill.proficiencyScore}% proficiency`);
    });
    
  } catch (error) {
    console.error('Error setting up user data:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupUserData();