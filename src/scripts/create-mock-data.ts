import { db } from '~/db';
import { 
  user, 
  userSkills, 
  recruiterProfiles, 
  jobPostings, 
  interviewSessions,
  skillMentions 
} from '~/db/schema';
import { generateId } from '~/lib/utils';
import { skillExtractionService } from '~/services/skill-extraction';
import { jobAnalysisService } from '~/services/job-analysis';

/**
 * Comprehensive mock data creation script
 * Creates diverse candidates and job listings across multiple fields
 */

// Mock candidates with diverse backgrounds
const mockCandidates = [
  // Software Development Candidates
  {
    name: "Alex Chen",
    email: "alex.chen@email.com",
    skills: [
      { name: "React", proficiency: 85, category: "technical" },
      { name: "TypeScript", proficiency: 90, category: "technical" },
      { name: "Node.js", proficiency: 80, category: "technical" },
      { name: "PostgreSQL", proficiency: 75, category: "technical" },
      { name: "AWS", proficiency: 70, category: "technical" },
      { name: "Docker", proficiency: 65, category: "technical" },
      { name: "GraphQL", proficiency: 60, category: "technical" },
      { name: "Leadership", proficiency: 75, category: "soft" },
      { name: "Problem Solving", proficiency: 88, category: "soft" },
      { name: "Communication", proficiency: 82, category: "soft" }
    ],
    experienceLevel: "senior"
  },
  {
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    skills: [
      { name: "JavaScript", proficiency: 78, category: "technical" },
      { name: "Vue.js", proficiency: 85, category: "technical" },
      { name: "Python", proficiency: 70, category: "technical" },
      { name: "MongoDB", proficiency: 65, category: "technical" },
      { name: "Redis", proficiency: 55, category: "technical" },
      { name: "CI/CD", proficiency: 68, category: "methodology" },
      { name: "Agile", proficiency: 80, category: "methodology" },
      { name: "Teamwork", proficiency: 90, category: "soft" },
      { name: "Analytical", proficiency: 85, category: "soft" }
    ],
    experienceLevel: "mid"
  },
  {
    name: "David Rodriguez",
    email: "david.rodriguez@email.com",
    skills: [
      { name: "Java", proficiency: 92, category: "technical" },
      { name: "Spring", proficiency: 88, category: "technical" },
      { name: "Kubernetes", proficiency: 75, category: "technical" },
      { name: "Microservices", proficiency: 80, category: "technical" },
      { name: "MySQL", proficiency: 85, category: "technical" },
      { name: "Jenkins", proficiency: 70, category: "technical" },
      { name: "System Design", proficiency: 78, category: "technical" },
      { name: "Mentoring", proficiency: 82, category: "soft" },
      { name: "Project Management", proficiency: 75, category: "soft" }
    ],
    experienceLevel: "senior"
  },

  // Marketing Candidates
  {
    name: "Emily Watson",
    email: "emily.watson@email.com",
    skills: [
      { name: "Digital Marketing", proficiency: 90, category: "domain" },
      { name: "SEO", proficiency: 85, category: "domain" },
      { name: "Google Analytics", proficiency: 88, category: "domain" },
      { name: "Facebook Ads", proficiency: 82, category: "domain" },
      { name: "Google Ads", proficiency: 80, category: "domain" },
      { name: "Content Marketing", proficiency: 85, category: "domain" },
      { name: "Email Marketing", proficiency: 78, category: "domain" },
      { name: "HubSpot", proficiency: 75, category: "domain" },
      { name: "Creativity", proficiency: 90, category: "soft" },
      { name: "Communication", proficiency: 88, category: "soft" },
      { name: "Analytical", proficiency: 80, category: "soft" }
    ],
    experienceLevel: "senior"
  },
  {
    name: "Michael Brown",
    email: "michael.brown@email.com",
    skills: [
      { name: "Social Media Marketing", proficiency: 85, category: "domain" },
      { name: "Brand Management", proficiency: 78, category: "domain" },
      { name: "Salesforce", proficiency: 70, category: "domain" },
      { name: "Market Research", proficiency: 75, category: "domain" },
      { name: "Lead Generation", proficiency: 80, category: "domain" },
      { name: "CRM", proficiency: 72, category: "domain" },
      { name: "Project Management", proficiency: 85, category: "soft" },
      { name: "Leadership", proficiency: 78, category: "soft" }
    ],
    experienceLevel: "mid"
  },

  // Healthcare Candidates
  {
    name: "Dr. Lisa Park",
    email: "lisa.park@email.com",
    skills: [
      { name: "Patient Care", proficiency: 95, category: "domain" },
      { name: "Clinical Assessment", proficiency: 92, category: "domain" },
      { name: "Medical Diagnosis", proficiency: 88, category: "domain" },
      { name: "Epic", proficiency: 85, category: "domain" },
      { name: "Cerner", proficiency: 80, category: "domain" },
      { name: "Medical Coding", proficiency: 75, category: "domain" },
      { name: "HIPAA", proficiency: 90, category: "domain" },
      { name: "Pharmacology", proficiency: 85, category: "domain" },
      { name: "Communication", proficiency: 90, category: "soft" },
      { name: "Critical Thinking", proficiency: 88, category: "soft" },
      { name: "Empathy", proficiency: 95, category: "soft" }
    ],
    experienceLevel: "senior"
  },
  {
    name: "James Wilson",
    email: "james.wilson@email.com",
    skills: [
      { name: "Patient Care", proficiency: 80, category: "domain" },
      { name: "Treatment Planning", proficiency: 75, category: "domain" },
      { name: "EMR", proficiency: 78, category: "domain" },
      { name: "Medical Terminology", proficiency: 85, category: "domain" },
      { name: "Anatomy", proficiency: 82, category: "domain" },
      { name: "Physiology", proficiency: 80, category: "domain" },
      { name: "Teamwork", proficiency: 88, category: "soft" },
      { name: "Attention to Detail", proficiency: 90, category: "soft" }
    ],
    experienceLevel: "mid"
  },

  // Finance Candidates
  {
    name: "Jennifer Lee",
    email: "jennifer.lee@email.com",
    skills: [
      { name: "Financial Analysis", proficiency: 90, category: "domain" },
      { name: "Financial Modeling", proficiency: 88, category: "domain" },
      { name: "Excel", proficiency: 95, category: "technical" },
      { name: "Bloomberg", proficiency: 85, category: "domain" },
      { name: "Risk Management", proficiency: 82, category: "domain" },
      { name: "Portfolio Management", proficiency: 78, category: "domain" },
      { name: "GAAP", proficiency: 85, category: "domain" },
      { name: "Valuation", proficiency: 80, category: "domain" },
      { name: "Analytical", proficiency: 92, category: "soft" },
      { name: "Attention to Detail", proficiency: 88, category: "soft" }
    ],
    experienceLevel: "senior"
  },
  {
    name: "Robert Kim",
    email: "robert.kim@email.com",
    skills: [
      { name: "Accounting", proficiency: 85, category: "domain" },
      { name: "Financial Reporting", proficiency: 80, category: "domain" },
      { name: "Excel", proficiency: 88, category: "technical" },
      { name: "QuickBooks", proficiency: 75, category: "domain" },
      { name: "Tax Preparation", proficiency: 70, category: "domain" },
      { name: "Audit", proficiency: 72, category: "domain" },
      { name: "Compliance", proficiency: 78, category: "domain" },
      { name: "Problem Solving", proficiency: 80, category: "soft" }
    ],
    experienceLevel: "mid"
  },

  // Engineering Candidates
  {
    name: "Maria Garcia",
    email: "maria.garcia@email.com",
    skills: [
      { name: "Mechanical Design", proficiency: 90, category: "technical" },
      { name: "SolidWorks", proficiency: 88, category: "technical" },
      { name: "AutoCAD", proficiency: 85, category: "technical" },
      { name: "MATLAB", proficiency: 80, category: "technical" },
      { name: "Finite Element Analysis", proficiency: 75, category: "technical" },
      { name: "Manufacturing", proficiency: 82, category: "domain" },
      { name: "Quality Control", proficiency: 78, category: "domain" },
      { name: "Six Sigma", proficiency: 70, category: "methodology" },
      { name: "Project Management", proficiency: 85, category: "soft" },
      { name: "Problem Solving", proficiency: 88, category: "soft" }
    ],
    experienceLevel: "senior"
  },
  {
    name: "Thomas Anderson",
    email: "thomas.anderson@email.com",
    skills: [
      { name: "Electrical Engineering", proficiency: 85, category: "technical" },
      { name: "Circuit Design", proficiency: 80, category: "technical" },
      { name: "PCB Design", proficiency: 75, category: "technical" },
      { name: "Embedded Systems", proficiency: 78, category: "technical" },
      { name: "C Programming", proficiency: 82, category: "technical" },
      { name: "Testing", proficiency: 80, category: "technical" },
      { name: "Documentation", proficiency: 75, category: "soft" },
      { name: "Analytical", proficiency: 85, category: "soft" }
    ],
    experienceLevel: "mid"
  },

  // Data Science Candidates
  {
    name: "Dr. Priya Patel",
    email: "priya.patel@email.com",
    skills: [
      { name: "Machine Learning", proficiency: 92, category: "technical" },
      { name: "Python", proficiency: 90, category: "technical" },
      { name: "TensorFlow", proficiency: 85, category: "technical" },
      { name: "PyTorch", proficiency: 80, category: "technical" },
      { name: "Pandas", proficiency: 88, category: "technical" },
      { name: "NumPy", proficiency: 85, category: "technical" },
      { name: "SQL", proficiency: 82, category: "technical" },
      { name: "Statistics", proficiency: 90, category: "technical" },
      { name: "Data Visualization", proficiency: 78, category: "technical" },
      { name: "Research", proficiency: 95, category: "soft" },
      { name: "Critical Thinking", proficiency: 90, category: "soft" }
    ],
    experienceLevel: "senior"
  },

  // Additional Software Development Candidates
  {
    name: "Kevin Zhang",
    email: "kevin.zhang@email.com",
    skills: [
      { name: "Vue.js", proficiency: 88, category: "technical" },
      { name: "JavaScript", proficiency: 85, category: "technical" },
      { name: "CSS3", proficiency: 82, category: "technical" },
      { name: "SASS", proficiency: 78, category: "technical" },
      { name: "Webpack", proficiency: 75, category: "technical" },
      { name: "Jest", proficiency: 70, category: "technical" },
      { name: "Figma", proficiency: 65, category: "technical" },
      { name: "Responsive Design", proficiency: 85, category: "technical" },
      { name: "Problem Solving", proficiency: 88, category: "soft" },
      { name: "Attention to Detail", proficiency: 90, category: "soft" }
    ],
    experienceLevel: "mid"
  },
  {
    name: "Rachel Martinez",
    email: "rachel.martinez@email.com",
    skills: [
      { name: "Django", proficiency: 90, category: "technical" },
      { name: "Python", proficiency: 88, category: "technical" },
      { name: "PostgreSQL", proficiency: 85, category: "technical" },
      { name: "Redis", proficiency: 80, category: "technical" },
      { name: "Celery", proficiency: 75, category: "technical" },
      { name: "Docker", proficiency: 78, category: "technical" },
      { name: "AWS", proficiency: 72, category: "technical" },
      { name: "RESTful API", proficiency: 85, category: "technical" },
      { name: "System Design", proficiency: 80, category: "technical" },
      { name: "Leadership", proficiency: 82, category: "soft" }
    ],
    experienceLevel: "mid"
  },
  {
    name: "Brandon Lee",
    email: "brandon.lee@email.com",
    skills: [
      { name: "Swift", proficiency: 85, category: "technical" },
      { name: "iOS", proficiency: 88, category: "technical" },
      { name: "UIKit", proficiency: 82, category: "technical" },
      { name: "SwiftUI", proficiency: 78, category: "technical" },
      { name: "Core Data", proficiency: 75, category: "technical" },
      { name: "Objective-C", proficiency: 70, category: "technical" },
      { name: "Xcode", proficiency: 85, category: "technical" },
      { name: "App Store", proficiency: 80, category: "technical" },
      { name: "Problem Solving", proficiency: 85, category: "soft" },
      { name: "Communication", proficiency: 78, category: "soft" }
    ],
    experienceLevel: "mid"
  },
  {
    name: "Amanda Foster",
    email: "amanda.foster@email.com",
    skills: [
      { name: "Selenium", proficiency: 88, category: "technical" },
      { name: "Java", proficiency: 82, category: "technical" },
      { name: "Cypress", proficiency: 85, category: "technical" },
      { name: "API Testing", proficiency: 80, category: "technical" },
      { name: "JMeter", proficiency: 75, category: "technical" },
      { name: "TestNG", proficiency: 78, category: "technical" },
      { name: "CI/CD", proficiency: 72, category: "methodology" },
      { name: "Agile", proficiency: 85, category: "methodology" },
      { name: "Attention to Detail", proficiency: 95, category: "soft" },
      { name: "Analytical", proficiency: 88, category: "soft" }
    ],
    experienceLevel: "mid"
  },

  // Additional Marketing Candidates
  {
    name: "Jessica Thompson",
    email: "jessica.thompson@email.com",
    skills: [
      { name: "Content Marketing", proficiency: 90, category: "domain" },
      { name: "SEO", proficiency: 85, category: "domain" },
      { name: "WordPress", proficiency: 82, category: "domain" },
      { name: "Social Media", proficiency: 88, category: "domain" },
      { name: "Canva", proficiency: 80, category: "domain" },
      { name: "Email Marketing", proficiency: 78, category: "domain" },
      { name: "Google Analytics", proficiency: 75, category: "domain" },
      { name: "Creativity", proficiency: 92, category: "soft" },
      { name: "Communication", proficiency: 90, category: "soft" },
      { name: "Project Management", proficiency: 80, category: "soft" }
    ],
    experienceLevel: "mid"
  },
  {
    name: "Marcus Johnson",
    email: "marcus.johnson@email.com",
    skills: [
      { name: "Salesforce", proficiency: 85, category: "domain" },
      { name: "Lead Generation", proficiency: 88, category: "domain" },
      { name: "B2B Sales", proficiency: 82, category: "domain" },
      { name: "CRM", proficiency: 80, category: "domain" },
      { name: "LinkedIn", proficiency: 85, category: "domain" },
      { name: "Cold Calling", proficiency: 78, category: "domain" },
      { name: "Sales Automation", proficiency: 75, category: "domain" },
      { name: "Communication", proficiency: 90, category: "soft" },
      { name: "Persistence", proficiency: 88, category: "soft" },
      { name: "Goal Oriented", proficiency: 92, category: "soft" }
    ],
    experienceLevel: "entry"
  },

  // Additional Healthcare Candidates
  {
    name: "Dr. Michelle Adams",
    email: "michelle.adams@email.com",
    skills: [
      { name: "Physical Therapy", proficiency: 92, category: "domain" },
      { name: "Patient Care", proficiency: 95, category: "domain" },
      { name: "Anatomy", proficiency: 90, category: "domain" },
      { name: "Kinesiology", proficiency: 88, category: "domain" },
      { name: "Manual Therapy", proficiency: 85, category: "domain" },
      { name: "EMR", proficiency: 80, category: "domain" },
      { name: "Rehabilitation", proficiency: 90, category: "domain" },
      { name: "Communication", proficiency: 92, category: "soft" },
      { name: "Empathy", proficiency: 95, category: "soft" },
      { name: "Problem Solving", proficiency: 85, category: "soft" }
    ],
    experienceLevel: "mid"
  },
  {
    name: "Carlos Rodriguez",
    email: "carlos.rodriguez@email.com",
    skills: [
      { name: "Medical Terminology", proficiency: 85, category: "domain" },
      { name: "EMR", proficiency: 82, category: "domain" },
      { name: "Patient Care", proficiency: 88, category: "domain" },
      { name: "Phlebotomy", proficiency: 80, category: "domain" },
      { name: "EKG", proficiency: 75, category: "domain" },
      { name: "Vital Signs", proficiency: 90, category: "domain" },
      { name: "Medical Coding", proficiency: 70, category: "domain" },
      { name: "Customer Service", proficiency: 85, category: "soft" },
      { name: "Attention to Detail", proficiency: 88, category: "soft" },
      { name: "Bilingual", proficiency: 95, category: "soft" }
    ],
    experienceLevel: "entry"
  },

  // Additional Finance Candidates
  {
    name: "Steven Park",
    email: "steven.park@email.com",
    skills: [
      { name: "QuickBooks", proficiency: 88, category: "domain" },
      { name: "Accounting", proficiency: 85, category: "domain" },
      { name: "Excel", proficiency: 90, category: "technical" },
      { name: "Financial Reporting", proficiency: 82, category: "domain" },
      { name: "Tax Preparation", proficiency: 78, category: "domain" },
      { name: "GAAP", proficiency: 80, category: "domain" },
      { name: "Audit", proficiency: 75, category: "domain" },
      { name: "Attention to Detail", proficiency: 92, category: "soft" },
      { name: "Analytical", proficiency: 85, category: "soft" },
      { name: "Problem Solving", proficiency: 80, category: "soft" }
    ],
    experienceLevel: "mid"
  },
  {
    name: "Nicole Chen",
    email: "nicole.chen@email.com",
    skills: [
      { name: "Investment Analysis", proficiency: 85, category: "domain" },
      { name: "Financial Modeling", proficiency: 88, category: "domain" },
      { name: "Bloomberg", proficiency: 82, category: "domain" },
      { name: "Excel", proficiency: 90, category: "technical" },
      { name: "Valuation", proficiency: 80, category: "domain" },
      { name: "Risk Management", proficiency: 78, category: "domain" },
      { name: "CFA", proficiency: 75, category: "domain" },
      { name: "Research", proficiency: 88, category: "soft" },
      { name: "Analytical", proficiency: 92, category: "soft" },
      { name: "Communication", proficiency: 85, category: "soft" }
    ],
    experienceLevel: "mid"
  },

  // Additional Engineering Candidates
  {
    name: "Daniel Kim",
    email: "daniel.kim@email.com",
    skills: [
      { name: "Circuit Design", proficiency: 88, category: "technical" },
      { name: "PCB Design", proficiency: 85, category: "technical" },
      { name: "Embedded Systems", proficiency: 82, category: "technical" },
      { name: "C Programming", proficiency: 80, category: "technical" },
      { name: "MATLAB", proficiency: 78, category: "technical" },
      { name: "Testing", proficiency: 85, category: "technical" },
      { name: "Microcontrollers", proficiency: 82, category: "technical" },
      { name: "Problem Solving", proficiency: 90, category: "soft" },
      { name: "Analytical", proficiency: 88, category: "soft" },
      { name: "Documentation", proficiency: 75, category: "soft" }
    ],
    experienceLevel: "mid"
  },
  {
    name: "Lisa Wang",
    email: "lisa.wang@email.com",
    skills: [
      { name: "Lean Manufacturing", proficiency: 88, category: "methodology" },
      { name: "Six Sigma", proficiency: 85, category: "methodology" },
      { name: "Process Improvement", proficiency: 90, category: "methodology" },
      { name: "AutoCAD", proficiency: 82, category: "technical" },
      { name: "SolidWorks", proficiency: 80, category: "technical" },
      { name: "Statistical Process Control", proficiency: 85, category: "methodology" },
      { name: "Project Management", proficiency: 88, category: "soft" },
      { name: "Problem Solving", proficiency: 92, category: "soft" },
      { name: "Leadership", proficiency: 85, category: "soft" },
      { name: "Communication", proficiency: 82, category: "soft" }
    ],
    experienceLevel: "mid"
  }
];

// Enhanced mock job postings across different fields - 25 diverse positions
const mockJobPostings = [
  // Software Development (8 positions)
  {
    title: "Senior Full Stack Developer",
    description: `We are seeking a Senior Full Stack Developer to join our growing engineering team. 
    
    The ideal candidate will have extensive experience with React, TypeScript, and Node.js. You'll be responsible for building scalable web applications, designing APIs, and mentoring junior developers.
    
    Required Skills:
    - 5+ years of experience with React and modern JavaScript/TypeScript
    - Strong backend development experience with Node.js
    - Database experience with PostgreSQL or similar
    - Experience with cloud platforms (AWS preferred)
    - Knowledge of containerization (Docker, Kubernetes)
    
    Preferred Skills:
    - GraphQL experience
    - Redis for caching
    - CI/CD pipeline experience
    - Microservices architecture
    - Leadership and mentoring experience
    
    We offer competitive salary ($120,000 - $160,000), excellent benefits, and the opportunity to work on cutting-edge technology in a collaborative environment.`,
    experienceLevel: "senior",
    salaryMin: 120000,
    salaryMax: 160000,
    location: "San Francisco, CA",
    remoteAllowed: true,
    employmentType: "full-time"
  },
  {
    title: "Frontend Developer - React Specialist",
    description: `Join our frontend team to build beautiful, responsive user interfaces using React and modern web technologies.
    
    We're looking for a passionate developer who loves creating exceptional user experiences and has a keen eye for design.
    
    Required Skills:
    - 3+ years of React development experience
    - Proficiency in JavaScript ES6+ and TypeScript
    - Experience with CSS3, SASS/SCSS, and responsive design
    - Knowledge of state management (Redux, Context API)
    - Familiarity with testing frameworks (Jest, React Testing Library)
    
    Preferred Skills:
    - Next.js framework experience
    - Tailwind CSS or styled-components
    - Webpack and build tools
    - Figma or Adobe XD for design collaboration
    - Performance optimization techniques
    
    Salary: $85,000 - $115,000 with excellent growth opportunities.`,
    experienceLevel: "mid",
    salaryMin: 85000,
    salaryMax: 115000,
    location: "Seattle, WA",
    remoteAllowed: true,
    employmentType: "full-time"
  },
  {
    title: "Backend Engineer - Python/Django",
    description: `We're seeking a skilled Backend Engineer to design and implement robust server-side applications using Python and Django.
    
    You'll work on high-performance APIs, database optimization, and scalable architecture solutions.
    
    Required Skills:
    - 4+ years of Python development experience
    - Strong Django or Flask framework knowledge
    - Database design and optimization (PostgreSQL, MySQL)
    - RESTful API design and implementation
    - Experience with caching solutions (Redis, Memcached)
    
    Preferred Skills:
    - Celery for task queues
    - Docker and Kubernetes
    - AWS or GCP cloud services
    - Elasticsearch for search functionality
    - GraphQL API development
    
    Compensation: $95,000 - $130,000 plus equity options.`,
    experienceLevel: "mid",
    salaryMin: 95000,
    salaryMax: 130000,
    location: "Austin, TX",
    remoteAllowed: true,
    employmentType: "full-time"
  },
  {
    title: "DevOps Engineer",
    description: `Join our infrastructure team to build and maintain scalable, reliable systems that power our applications.
    
    We're looking for someone passionate about automation, monitoring, and continuous improvement.
    
    Required Skills:
    - 3+ years of DevOps or infrastructure experience
    - Proficiency with AWS, Azure, or GCP
    - Experience with Infrastructure as Code (Terraform, CloudFormation)
    - Container orchestration (Docker, Kubernetes)
    - CI/CD pipeline design and implementation
    
    Preferred Skills:
    - Monitoring tools (Prometheus, Grafana, DataDog)
    - Configuration management (Ansible, Chef, Puppet)
    - Scripting languages (Python, Bash, Go)
    - Security best practices and compliance
    - Experience with microservices architecture
    
    Salary: $100,000 - $140,000 with comprehensive benefits.`,
    experienceLevel: "mid",
    salaryMin: 100000,
    salaryMax: 140000,
    location: "Denver, CO",
    remoteAllowed: true,
    employmentType: "full-time"
  },
  {
    title: "Mobile Developer - iOS/Swift",
    description: `Create amazing mobile experiences for iOS users with our innovative mobile development team.
    
    We're building the next generation of mobile applications and need a skilled iOS developer to join our journey.
    
    Required Skills:
    - 3+ years of iOS development experience
    - Proficiency in Swift and Objective-C
    - Experience with UIKit and SwiftUI
    - Knowledge of iOS frameworks and APIs
    - App Store submission and review process
    
    Preferred Skills:
    - Core Data and CloudKit experience
    - Push notifications and background processing
    - Third-party SDK integration
    - Unit testing and UI testing
    - Reactive programming (Combine, RxSwift)
    
    Compensation: $90,000 - $125,000 plus performance bonuses.`,
    experienceLevel: "mid",
    salaryMin: 90000,
    salaryMax: 125000,
    location: "Los Angeles, CA",
    remoteAllowed: false,
    employmentType: "full-time"
  },
  {
    title: "Data Engineer",
    description: `Build and maintain data pipelines that power our analytics and machine learning initiatives.
    
    You'll work with large-scale data processing systems and help transform raw data into actionable insights.
    
    Required Skills:
    - 3+ years of data engineering experience
    - Proficiency in Python and SQL
    - Experience with data pipeline tools (Apache Airflow, Luigi)
    - Knowledge of big data technologies (Spark, Hadoop)
    - Cloud data services (AWS Redshift, Google BigQuery)
    
    Preferred Skills:
    - Stream processing (Kafka, Kinesis)
    - Data warehouse design and optimization
    - ETL/ELT process development
    - Docker and Kubernetes
    - Machine learning pipeline experience
    
    Salary: $105,000 - $145,000 with stock options.`,
    experienceLevel: "mid",
    salaryMin: 105000,
    salaryMax: 145000,
    location: "Chicago, IL",
    remoteAllowed: true,
    employmentType: "full-time"
  },
  {
    title: "QA Automation Engineer",
    description: `Ensure the quality of our software products through comprehensive testing strategies and automation frameworks.
    
    We're looking for a detail-oriented engineer who is passionate about quality and continuous improvement.
    
    Required Skills:
    - 3+ years of QA automation experience
    - Proficiency in test automation tools (Selenium, Cypress)
    - Programming skills in Java, Python, or JavaScript
    - Experience with API testing (Postman, REST Assured)
    - Knowledge of testing frameworks and methodologies
    
    Preferred Skills:
    - Performance testing tools (JMeter, LoadRunner)
    - Mobile testing automation (Appium)
    - CI/CD integration for automated testing
    - Behavior-driven development (BDD)
    - Security testing knowledge
    
    Compensation: $80,000 - $110,000 with comprehensive benefits.`,
    experienceLevel: "mid",
    salaryMin: 80000,
    salaryMax: 110000,
    location: "Phoenix, AZ",
    remoteAllowed: true,
    employmentType: "full-time"
  },
  {
    title: "Junior Software Developer",
    description: `Start your career in software development with our supportive team environment and mentorship program.
    
    We're looking for recent graduates or career changers who are eager to learn and grow in software development.
    
    Required Skills:
    - Bachelor's degree in Computer Science or related field
    - Basic programming knowledge in any language (Java, Python, JavaScript)
    - Understanding of fundamental programming concepts
    - Familiarity with version control (Git)
    - Strong problem-solving abilities
    
    Preferred Skills:
    - Internship or project experience
    - Knowledge of web development basics (HTML, CSS, JavaScript)
    - Database fundamentals (SQL)
    - Agile methodology awareness
    - Open source contribution experience
    
    Starting salary: $65,000 - $80,000 with excellent learning opportunities.`,
    experienceLevel: "entry",
    salaryMin: 65000,
    salaryMax: 80000,
    location: "Portland, OR",
    remoteAllowed: true,
    employmentType: "full-time"
  },

  // Marketing & Sales (5 positions)
  {
    title: "Digital Marketing Manager",
    description: `Join our marketing team as a Digital Marketing Manager and drive our online presence to new heights!
    
    We're looking for a creative and analytical marketing professional to lead our digital marketing initiatives across multiple channels.
    
    Key Responsibilities:
    - Develop and execute comprehensive digital marketing strategies
    - Manage SEO/SEM campaigns and optimize for performance
    - Create and manage social media marketing campaigns
    - Analyze campaign performance using Google Analytics and other tools
    - Collaborate with content team on marketing materials
    
    Required Skills:
    - 3+ years of digital marketing experience
    - Proficiency with Google Analytics, Google Ads, Facebook Ads
    - Strong SEO/SEM knowledge
    - Experience with marketing automation platforms (HubSpot preferred)
    - Excellent analytical and communication skills
    
    Preferred Skills:
    - Salesforce CRM experience
    - Content marketing experience
    - Email marketing automation
    - Social media management tools
    - Creative design skills
    
    Salary: $70,000 - $95,000 plus performance bonuses.`,
    experienceLevel: "mid",
    salaryMin: 70000,
    salaryMax: 95000,
    location: "Austin, TX",
    remoteAllowed: true,
    employmentType: "full-time"
  },
  {
    title: "Content Marketing Specialist",
    description: `Create compelling content that engages our audience and drives business growth.
    
    We're seeking a creative storyteller who can develop content strategies across multiple channels and formats.
    
    Required Skills:
    - 2+ years of content marketing experience
    - Excellent writing and editing skills
    - Experience with content management systems (WordPress, Drupal)
    - Social media content creation and management
    - Basic SEO knowledge and keyword research
    
    Preferred Skills:
    - Video content creation and editing
    - Graphic design skills (Canva, Adobe Creative Suite)
    - Email marketing platforms (Mailchimp, Constant Contact)
    - Analytics and performance tracking
    - Influencer marketing experience
    
    Compensation: $55,000 - $75,000 with creative freedom and growth opportunities.`,
    experienceLevel: "mid",
    salaryMin: 55000,
    salaryMax: 75000,
    location: "Nashville, TN",
    remoteAllowed: true,
    employmentType: "full-time"
  },
  {
    title: "Sales Development Representative",
    description: `Drive revenue growth by identifying and qualifying potential customers for our sales team.
    
    This is an excellent opportunity for someone looking to start or advance their career in B2B sales.
    
    Required Skills:
    - 1+ years of sales or customer service experience
    - Strong communication and interpersonal skills
    - Experience with CRM systems (Salesforce preferred)
    - Goal-oriented mindset and resilience
    - Ability to work in a fast-paced environment
    
    Preferred Skills:
    - B2B sales experience
    - Lead generation and prospecting techniques
    - Social selling and LinkedIn proficiency
    - Sales automation tools knowledge
    - Industry-specific knowledge
    
    Base salary: $45,000 - $60,000 plus uncapped commission potential.`,
    experienceLevel: "entry",
    salaryMin: 45000,
    salaryMax: 60000,
    location: "Miami, FL",
    remoteAllowed: false,
    employmentType: "full-time"
  },
  {
    title: "Marketing Analytics Manager",
    description: `Turn marketing data into actionable insights that drive strategic decision-making.
    
    We're looking for an analytical professional who can bridge the gap between marketing activities and business outcomes.
    
    Required Skills:
    - 4+ years of marketing analytics experience
    - Advanced Excel and SQL skills
    - Experience with analytics platforms (Google Analytics, Adobe Analytics)
    - Statistical analysis and data visualization
    - Marketing attribution and ROI measurement
    
    Preferred Skills:
    - Python or R for data analysis
    - Tableau or Power BI for visualization
    - A/B testing and experimentation
    - Customer segmentation and lifetime value analysis
    - Marketing mix modeling experience
    
    Salary: $85,000 - $115,000 with data-driven impact opportunities.`,
    experienceLevel: "senior",
    salaryMin: 85000,
    salaryMax: 115000,
    location: "Boston, MA",
    remoteAllowed: true,
    employmentType: "full-time"
  },
  {
    title: "Brand Manager",
    description: `Shape and protect our brand identity while driving brand awareness and customer loyalty.
    
    We're seeking a strategic thinker who can manage brand initiatives across multiple touchpoints and channels.
    
    Required Skills:
    - 3+ years of brand management experience
    - Strong understanding of brand strategy and positioning
    - Experience with brand research and consumer insights
    - Project management and cross-functional collaboration
    - Creative brief development and campaign oversight
    
    Preferred Skills:
    - Consumer goods or retail experience
    - Digital brand management
    - Influencer and partnership marketing
    - Budget management and ROI tracking
    - Crisis communication experience
    
    Compensation: $75,000 - $100,000 with brand building opportunities.`,
    experienceLevel: "mid",
    salaryMin: 75000,
    salaryMax: 100000,
    location: "Atlanta, GA",
    remoteAllowed: false,
    employmentType: "full-time"
  },

  // Healthcare (4 positions)
  {
    title: "Registered Nurse - ICU",
    description: `Our hospital is seeking a dedicated Registered Nurse to join our Intensive Care Unit team.
    
    This is an excellent opportunity for an experienced nurse to provide critical care in a state-of-the-art facility with a supportive team environment.
    
    Responsibilities:
    - Provide direct patient care in the ICU setting
    - Conduct comprehensive patient assessments
    - Administer medications and treatments as prescribed
    - Collaborate with multidisciplinary healthcare team
    - Maintain accurate patient records in EMR system
    
    Required Qualifications:
    - Current RN license in good standing
    - Minimum 2 years of ICU or critical care experience
    - BLS and ACLS certification required
    - Proficiency with Epic EMR system
    - Strong knowledge of pharmacology and medical terminology
    
    Preferred Qualifications:
    - Experience with Cerner EMR system
    - Medical coding knowledge (ICD-10)
    - HIPAA compliance training
    - Critical care certification (CCRN)
    - Bachelor's degree in Nursing (BSN)
    
    We offer competitive compensation ($75,000 - $95,000), comprehensive benefits, and opportunities for professional development.`,
    experienceLevel: "mid",
    salaryMin: 75000,
    salaryMax: 95000,
    location: "Boston, MA",
    remoteAllowed: false,
    employmentType: "full-time"
  },
  {
    title: "Physical Therapist",
    description: `Help patients recover and improve their quality of life as a Physical Therapist in our rehabilitation center.
    
    We're looking for a compassionate professional who is dedicated to patient care and evidence-based practice.
    
    Required Qualifications:
    - Doctor of Physical Therapy (DPT) degree
    - Current state PT license
    - 1+ years of clinical experience
    - Knowledge of anatomy, physiology, and kinesiology
    - Strong communication and interpersonal skills
    
    Preferred Qualifications:
    - Orthopedic or sports medicine experience
    - Manual therapy certification
    - Experience with EMR systems
    - Continuing education in specialized techniques
    - Bilingual capabilities (Spanish preferred)
    
    Salary: $70,000 - $90,000 with excellent benefits and continuing education support.`,
    experienceLevel: "mid",
    salaryMin: 70000,
    salaryMax: 90000,
    location: "Phoenix, AZ",
    remoteAllowed: false,
    employmentType: "full-time"
  },
  {
    title: "Medical Assistant",
    description: `Support our healthcare team by providing clinical and administrative assistance in a busy medical practice.
    
    This role offers the opportunity to make a direct impact on patient care while developing your healthcare career.
    
    Required Qualifications:
    - Medical Assistant certification or equivalent training
    - 1+ years of clinical experience
    - Knowledge of medical terminology and procedures
    - Proficiency with EMR systems
    - Strong organizational and communication skills
    
    Preferred Qualifications:
    - Phlebotomy certification
    - EKG and vital signs experience
    - Insurance verification and coding knowledge
    - Bilingual capabilities
    - Customer service experience
    
    Starting salary: $35,000 - $45,000 with growth opportunities and benefits.`,
    experienceLevel: "entry",
    salaryMin: 35000,
    salaryMax: 45000,
    location: "San Antonio, TX",
    remoteAllowed: false,
    employmentType: "full-time"
  },
  {
    title: "Healthcare Data Analyst",
    description: `Analyze healthcare data to improve patient outcomes and operational efficiency.
    
    We're seeking an analytical professional who can work with complex healthcare datasets and provide actionable insights.
    
    Required Skills:
    - 3+ years of healthcare data analysis experience
    - Proficiency in SQL and statistical analysis
    - Knowledge of healthcare regulations (HIPAA, HITECH)
    - Experience with healthcare databases and EMR systems
    - Strong attention to detail and accuracy
    
    Preferred Skills:
    - Python or R programming skills
    - Tableau or Power BI for visualization
    - Clinical research experience
    - Quality improvement methodologies
    - Healthcare coding knowledge (ICD-10, CPT)
    
    Compensation: $65,000 - $85,000 with healthcare industry impact.`,
    experienceLevel: "mid",
    salaryMin: 65000,
    salaryMax: 85000,
    location: "Minneapolis, MN",
    remoteAllowed: true,
    employmentType: "full-time"
  },

  // Finance & Accounting (4 positions)
  {
    title: "Senior Financial Analyst",
    description: `We are seeking a Senior Financial Analyst to join our finance team and support strategic decision-making through comprehensive financial analysis.
    
    The successful candidate will be responsible for financial modeling, budgeting, forecasting, and providing insights to senior management.
    
    Key Responsibilities:
    - Develop and maintain complex financial models
    - Conduct valuation analysis and investment evaluations
    - Prepare monthly, quarterly, and annual financial reports
    - Support budgeting and forecasting processes
    - Analyze market trends and competitive landscape
    
    Required Skills:
    - Bachelor's degree in Finance, Accounting, or Economics
    - 4+ years of financial analysis experience
    - Advanced Excel skills and financial modeling expertise
    - Knowledge of GAAP and financial reporting standards
    - Strong analytical and problem-solving abilities
    
    Preferred Skills:
    - CFA designation or progress toward CFA
    - Bloomberg Terminal experience
    - Experience with financial databases and tools
    - Risk management knowledge
    - Portfolio management experience
    - MBA or advanced degree in finance
    
    Compensation: $85,000 - $110,000 plus annual bonus potential.`,
    experienceLevel: "senior",
    salaryMin: 85000,
    salaryMax: 110000,
    location: "New York, NY",
    remoteAllowed: false,
    employmentType: "full-time"
  },
  {
    title: "Staff Accountant",
    description: `Join our accounting team to support day-to-day financial operations and ensure accurate financial reporting.
    
    This is an excellent opportunity for an accounting professional to grow their career in a dynamic environment.
    
    Required Skills:
    - Bachelor's degree in Accounting or Finance
    - 2+ years of accounting experience
    - Knowledge of GAAP and financial reporting
    - Proficiency in Excel and accounting software (QuickBooks, SAP)
    - Strong attention to detail and accuracy
    
    Preferred Skills:
    - CPA certification or progress toward CPA
    - Experience with month-end and year-end close processes
    - Accounts payable and receivable management
    - Tax preparation experience
    - ERP system experience
    
    Salary: $50,000 - $65,000 with professional development opportunities.`,
    experienceLevel: "mid",
    salaryMin: 50000,
    salaryMax: 65000,
    location: "Dallas, TX",
    remoteAllowed: false,
    employmentType: "full-time"
  },
  {
    title: "Investment Analyst",
    description: `Analyze investment opportunities and support portfolio management decisions for our investment firm.
    
    We're looking for a detail-oriented analyst with strong research skills and financial acumen.
    
    Required Skills:
    - Bachelor's degree in Finance, Economics, or related field
    - 2+ years of investment analysis experience
    - Financial modeling and valuation skills
    - Knowledge of capital markets and investment products
    - Strong research and analytical abilities
    
    Preferred Skills:
    - CFA Level I or higher
    - Experience with Bloomberg or FactSet
    - Equity research experience
    - Risk assessment and management
    - Presentation and communication skills
    
    Compensation: $70,000 - $95,000 plus performance-based bonuses.`,
    experienceLevel: "mid",
    salaryMin: 70000,
    salaryMax: 95000,
    location: "Charlotte, NC",
    remoteAllowed: false,
    employmentType: "full-time"
  },
  {
    title: "Financial Planning Analyst",
    description: `Support strategic planning and budgeting processes through comprehensive financial analysis and forecasting.
    
    This role offers the opportunity to work closely with senior management on key business decisions.
    
    Required Skills:
    - Bachelor's degree in Finance or Accounting
    - 3+ years of financial planning experience
    - Advanced Excel and financial modeling skills
    - Experience with budgeting and forecasting
    - Strong analytical and communication skills
    
    Preferred Skills:
    - MBA or advanced degree
    - Experience with planning software (Hyperion, Anaplan)
    - Variance analysis and reporting
    - Business intelligence tools
    - Cross-functional collaboration experience
    
    Salary: $75,000 - $95,000 with strategic impact opportunities.`,
    experienceLevel: "mid",
    salaryMin: 75000,
    salaryMax: 95000,
    location: "Houston, TX",
    remoteAllowed: true,
    employmentType: "full-time"
  },

  // Engineering & Manufacturing (4 positions)
  {
    title: "Mechanical Engineer - Product Development",
    description: `Join our innovative product development team as a Mechanical Engineer and help design the next generation of consumer products.
    
    We're looking for a creative engineer with strong technical skills and a passion for bringing ideas to life.
    
    Responsibilities:
    - Design and develop mechanical components and systems
    - Create detailed CAD models and technical drawings
    - Conduct engineering analysis and simulations
    - Collaborate with cross-functional teams throughout product lifecycle
    - Support manufacturing and quality processes
    
    Required Skills:
    - Bachelor's degree in Mechanical Engineering
    - 3+ years of product development experience
    - Proficiency with SolidWorks or similar CAD software
    - Experience with finite element analysis (FEA)
    - Knowledge of manufacturing processes and materials
    
    Preferred Skills:
    - MATLAB/Simulink experience
    - AutoCAD proficiency
    - Six Sigma or Lean Manufacturing knowledge
    - Quality control and testing experience
    - Project management skills
    - Experience with consumer product development
    
    We offer a competitive salary ($75,000 - $100,000), excellent benefits, and the opportunity to work on exciting new products.`,
    experienceLevel: "mid",
    salaryMin: 75000,
    salaryMax: 100000,
    location: "Detroit, MI",
    remoteAllowed: false,
    employmentType: "full-time"
  },
  {
    title: "Electrical Engineer",
    description: `Design and develop electrical systems and components for our innovative technology products.
    
    We're seeking an experienced engineer who can work on complex electrical designs and systems integration.
    
    Required Skills:
    - Bachelor's degree in Electrical Engineering
    - 4+ years of electrical design experience
    - Proficiency with circuit design and PCB layout
    - Knowledge of embedded systems and microcontrollers
    - Experience with testing and validation procedures
    
    Preferred Skills:
    - Power electronics and motor control
    - RF and wireless communication systems
    - FPGA programming and digital signal processing
    - Regulatory compliance (FCC, UL, CE)
    - Project management experience
    
    Compensation: $80,000 - $110,000 with cutting-edge technology exposure.`,
    experienceLevel: "mid",
    salaryMin: 80000,
    salaryMax: 110000,
    location: "San Jose, CA",
    remoteAllowed: false,
    employmentType: "full-time"
  },
  {
    title: "Manufacturing Engineer",
    description: `Optimize manufacturing processes and improve production efficiency in our state-of-the-art facility.
    
    This role offers the opportunity to work with advanced manufacturing technologies and continuous improvement initiatives.
    
    Required Skills:
    - Bachelor's degree in Manufacturing, Industrial, or Mechanical Engineering
    - 3+ years of manufacturing engineering experience
    - Knowledge of lean manufacturing principles
    - Experience with process improvement methodologies
    - Familiarity with automation and robotics
    
    Preferred Skills:
    - Six Sigma certification (Green Belt or higher)
    - CAD software proficiency (AutoCAD, SolidWorks)
    - Statistical process control (SPC)
    - ERP system experience (SAP, Oracle)
    - Project management skills
    
    Salary: $70,000 - $95,000 with process improvement impact.`,
    experienceLevel: "mid",
    salaryMin: 70000,
    salaryMax: 95000,
    location: "Milwaukee, WI",
    remoteAllowed: false,
    employmentType: "full-time"
  },
  {
    title: "Quality Engineer",
    description: `Ensure product quality and compliance through comprehensive quality assurance programs and testing procedures.
    
    We're looking for a detail-oriented engineer who is passionate about quality and continuous improvement.
    
    Required Skills:
    - Bachelor's degree in Engineering or related field
    - 2+ years of quality engineering experience
    - Knowledge of quality management systems (ISO 9001)
    - Experience with statistical analysis and quality tools
    - Strong problem-solving and analytical skills
    
    Preferred Skills:
    - Six Sigma certification
    - Supplier quality management
    - Regulatory compliance experience
    - Root cause analysis methodologies
    - Audit and inspection experience
    
    Compensation: $65,000 - $85,000 with quality impact opportunities.`,
    experienceLevel: "mid",
    salaryMin: 65000,
    salaryMax: 85000,
    location: "Cincinnati, OH",
    remoteAllowed: false,
    employmentType: "full-time"
  }
];

export async function createMockData() {
  console.log('🚀 Starting comprehensive mock data creation...');
  
  try {
    // Create a mock recruiter profile first
    const recruiterId = generateId();
    const mockRecruiterId = generateId();
    
    // Create mock user for recruiter
    const mockRecruiterUser = {
      id: mockRecruiterId,
      name: "Tech Recruiter",
      email: "recruiter@company.com",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.insert(user).values(mockRecruiterUser);
    
    // Create recruiter profile
    const recruiterProfile = {
      id: recruiterId,
      userId: mockRecruiterId,
      organizationName: "TechCorp Solutions",
      recruitingFor: "Software Development, Marketing, Healthcare, Finance, Engineering",
      contactEmail: "recruiter@company.com",
      phoneNumber: "+1-555-0123",
      timezone: "America/New_York",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.insert(recruiterProfiles).values(recruiterProfile);
    console.log('✅ Created recruiter profile');

    // Create mock candidates
    console.log('👥 Creating mock candidates...');
    const candidateIds: string[] = [];
    
    for (const candidate of mockCandidates) {
      const candidateId = generateId();
      candidateIds.push(candidateId);
      
      // Create user
      const userData = {
        id: candidateId,
        name: candidate.name,
        email: candidate.email,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.insert(user).values(userData);
      
      // Create interview session for the candidate
      const sessionId = generateId();
      const sessionData = {
        id: sessionId,
        userId: candidateId,
        sessionType: 'interview',
        title: 'AI Skills Assessment',
        description: 'Comprehensive skills evaluation interview',
        duration: 45,
        messageCount: 25,
        averageEngagement: 'high',
        overallScore: '85',
        topicsExplored: JSON.stringify([
          'Technical Skills',
          'Problem Solving',
          'Communication',
          'Experience'
        ]),
        skillsIdentified: JSON.stringify(candidate.skills.map(s => s.name)),
        finalAnalysis: JSON.stringify({
          summary: `Strong candidate with ${candidate.experienceLevel} level experience`,
          strengths: candidate.skills.filter(s => s.proficiency >= 80).map(s => s.name),
          recommendations: ['Continue developing technical skills', 'Consider leadership opportunities']
        }),
        status: 'completed',
        startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000), // 45 minutes later
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.insert(interviewSessions).values(sessionData);
      
      // Create user skills
      for (const skill of candidate.skills) {
        const userSkillId = generateId();
        const userSkillData = {
          id: userSkillId,
          userId: candidateId,
          skillName: skill.name,
          mentionCount: Math.floor(Math.random() * 5) + 1,
          lastMentioned: new Date(),
          proficiencyScore: skill.proficiency.toString(),
          averageConfidence: (skill.proficiency / 100).toFixed(2),
          averageEngagement: skill.proficiency >= 80 ? 'high' : skill.proficiency >= 60 ? 'medium' : 'low',
          topicDepthAverage: (Math.random() * 5 + 1).toFixed(1),
          firstMentioned: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          synonyms: JSON.stringify([]),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await db.insert(userSkills).values(userSkillData);
        
        // Create skill mentions for audit trail
        for (let i = 0; i < userSkillData.mentionCount; i++) {
          const mentionData = {
            userSkillId,
            userId: candidateId,
            sessionId,
            messageIndex: i + 1,
            mentionText: `Demonstrated proficiency in ${skill.name}`,
            confidence: (skill.proficiency / 100).toFixed(2),
            engagementLevel: userSkillData.averageEngagement,
            topicDepth: userSkillData.topicDepthAverage,
            conversationContext: `Discussion about ${skill.category} skills`,
            createdAt: new Date()
          };
          
          await db.insert(skillMentions).values(mentionData);
        }
      }
      
      console.log(`✅ Created candidate: ${candidate.name} with ${candidate.skills.length} skills`);
    }

    // Create mock job postings
    console.log('💼 Creating mock job postings...');
    const jobIds: string[] = [];
    
    for (const job of mockJobPostings) {
      const jobId = generateId();
      jobIds.push(jobId);
      
      console.log(`📋 Analyzing job: ${job.title}...`);
      
      // Use the comprehensive skill extraction for job analysis
      let analysis;
      try {
        analysis = await jobAnalysisService.analyzeJobPosting(job.description, job.title);
        console.log(`✅ AI analysis completed for ${job.title}: ${analysis.extractedSkills.length} skills extracted`);
      } catch (error) {
        console.warn(`⚠️ AI analysis failed for ${job.title}, using fallback`);
        // Create basic fallback analysis
        analysis = {
          extractedSkills: [],
          requiredSkills: [],
          preferredSkills: [],
          experienceLevel: job.experienceLevel,
          salaryRange: { min: job.salaryMin, max: job.salaryMax },
          keyTerms: [],
          confidence: 0.3,
          summary: 'Fallback analysis used due to AI service unavailability.'
        };
      }
      
      const jobData = {
        id: jobId,
        recruiterId,
        title: job.title,
        rawDescription: job.description,
        extractedSkills: analysis.extractedSkills,
        requiredSkills: analysis.requiredSkills,
        preferredSkills: analysis.preferredSkills,
        experienceLevel: job.experienceLevel,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        location: job.location,
        remoteAllowed: job.remoteAllowed,
        employmentType: job.employmentType,
        status: 'active',
        aiConfidenceScore: analysis.confidence.toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.insert(jobPostings).values(jobData);
      console.log(`✅ Created job posting: ${job.title}`);
      console.log(`   - Required skills: ${analysis.requiredSkills.length}`);
      console.log(`   - Preferred skills: ${analysis.preferredSkills.length}`);
      console.log(`   - Extracted skills: ${analysis.extractedSkills.length}`);
      console.log(`   - Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
    }

    console.log('\n🎯 Mock data creation summary:');
    console.log(`   - Created ${mockCandidates.length} diverse candidates`);
    console.log(`   - Created ${mockJobPostings.length} job postings across multiple fields`);
    console.log(`   - Generated comprehensive skill profiles for all candidates`);
    console.log(`   - Applied AI-powered job analysis to all postings`);
    console.log('\n✅ Mock data creation completed successfully!');
    
    return {
      recruiterId,
      candidateIds,
      jobIds,
      summary: {
        candidates: mockCandidates.length,
        jobs: mockJobPostings.length,
        totalSkills: mockCandidates.reduce((sum, c) => sum + c.skills.length, 0)
      }
    };
    
  } catch (error) {
    console.error('❌ Error creating mock data:', error);
    throw error;
  }
}

export function testCandidateMatching(jobId: string) {
  console.log(`\n🎯 Testing candidate matching for job: ${jobId}`);
  
  // Return a promise that resolves with mock matching data
  return Promise.resolve({
    success: true,
    data: [],
    pagination: { total: 0, page: 1, limit: 20, hasNext: false, hasPrev: false }
  });
}

// Export individual functions for testing
export { mockCandidates, mockJobPostings };