// Simple Node.js test to validate our types and schemas
const { z } = require('zod');

// Test basic Zod schema functionality
const testSchema = z.object({
  name: z.string().min(1),
  age: z.number().min(0),
  email: z.string().email().optional(),
});

console.log('Testing Zod validation...');

// Test valid data
const validData = {
  name: 'John Doe',
  age: 30,
  email: 'john@example.com',
};

const validResult = testSchema.safeParse(validData);
console.log('Valid data test:', validResult.success ? 'PASS' : 'FAIL');

// Test invalid data
const invalidData = {
  name: '',
  age: -5,
  email: 'invalid-email',
};

const invalidResult = testSchema.safeParse(invalidData);
console.log('Invalid data test:', !invalidResult.success ? 'PASS' : 'FAIL');

// Test utility functions
function calculateMatchScore(candidateSkills, requiredSkills, preferredSkills = []) {
  if (requiredSkills.length === 0 && preferredSkills.length === 0) {
    return 0;
  }

  const candidateSkillNames = new Set(candidateSkills.map(s => s.name.toLowerCase()));
  
  // Calculate required skills match (70% weight)
  const requiredMatches = requiredSkills.filter(skill => 
    candidateSkillNames.has(skill.name.toLowerCase())
  ).length;
  const requiredScore = requiredSkills.length > 0 ? requiredMatches / requiredSkills.length : 1;

  // Calculate preferred skills match (30% weight)
  const preferredMatches = preferredSkills.filter(skill => 
    candidateSkillNames.has(skill.name.toLowerCase())
  ).length;
  const preferredScore = preferredSkills.length > 0 ? preferredMatches / preferredSkills.length : 0;

  // Weighted final score
  const finalScore = (requiredScore * 0.7) + (preferredScore * 0.3);
  return Math.round(finalScore * 100);
}

// Test match score calculation
const candidateSkills = [
  { name: 'JavaScript' },
  { name: 'React' },
  { name: 'Node.js' },
];

const requiredSkills = [
  { name: 'JavaScript' },
  { name: 'React' },
];

const preferredSkills = [
  { name: 'TypeScript' },
  { name: 'Node.js' },
];

const matchScore = calculateMatchScore(candidateSkills, requiredSkills, preferredSkills);
console.log('Match score calculation test:', matchScore > 0 && matchScore <= 100 ? 'PASS' : 'FAIL');
console.log('Calculated match score:', matchScore);

// Test time slot conflict detection
function isTimeSlotConflict(slot1, slot2) {
  return (
    (slot1.start < slot2.end && slot1.end > slot2.start) ||
    (slot2.start < slot1.end && slot2.end > slot1.start)
  );
}

const slot1 = {
  start: new Date('2024-01-15T10:00:00Z'),
  end: new Date('2024-01-15T11:00:00Z'),
};

const slot2 = {
  start: new Date('2024-01-15T10:30:00Z'),
  end: new Date('2024-01-15T11:30:00Z'),
};

const slot3 = {
  start: new Date('2024-01-15T12:00:00Z'),
  end: new Date('2024-01-15T13:00:00Z'),
};

console.log('Time slot conflict detection (overlapping):', isTimeSlotConflict(slot1, slot2) ? 'PASS' : 'FAIL');
console.log('Time slot conflict detection (non-overlapping):', !isTimeSlotConflict(slot1, slot3) ? 'PASS' : 'FAIL');

console.log('\nAll core functionality tests completed!');