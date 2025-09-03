import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/db';
import { jobListings } from '~/db/schema';
import { nanoid } from 'nanoid';

// Mock job data with technology focus
const mockJobs = [
  {
    title: "Senior Full Stack Developer",
    company: "TechCorp Solutions",
    description: "We're looking for a senior full stack developer to join our growing team. You'll work on cutting-edge web applications using modern technologies and frameworks.",
    requiredSkills: [
      { name: "JavaScript", proficiencyScore: 80 },
      { name: "React", proficiencyScore: 75 },
      { name: "Node.js", proficiencyScore: 70 },
      { name: "TypeScript", proficiencyScore: 65 },
      { name: "PostgreSQL", proficiencyScore: 60 }
    ],
    preferredSkills: [
      { name: "Next.js", proficiencyScore: 60 },
      { name: "Docker", proficiencyScore: 50 },
      { name: "AWS", proficiencyScore: 55 }
    ],
    location: "San Francisco, CA",
    salaryMin: 120000,
    salaryMax: 180000,
    jobType: "full-time",
    experienceLevel: "senior",
    remoteAllowed: true,
    benefits: ["Health Insurance", "401k", "Flexible PTO", "Remote Work"],
    contactEmail: "careers@techcorp.com"
  },
  {
    title: "Frontend React Developer",
    company: "StartupXYZ",
    description: "Join our fast-paced startup as a frontend developer. You'll be responsible for creating beautiful, responsive user interfaces using React and modern CSS frameworks.",
    requiredSkills: [
      { name: "React", proficiencyScore: 80 },
      { name: "JavaScript", proficiencyScore: 75 },
      { name: "HTML", proficiencyScore: 70 },
      { name: "CSS", proficiencyScore: 70 },
      { name: "Git", proficiencyScore: 60 }
    ],
    preferredSkills: [
      { name: "TypeScript", proficiencyScore: 60 },
      { name: "Tailwind CSS", proficiencyScore: 55 },
      { name: "Redux", proficiencyScore: 50 }
    ],
    location: "Austin, TX",
    salaryMin: 80000,
    salaryMax: 120000,
    jobType: "full-time",
    experienceLevel: "mid",
    remoteAllowed: true,
    benefits: ["Health Insurance", "Stock Options", "Flexible Hours"],
    contactEmail: "hiring@startupxyz.com"
  },
  {
    title: "Backend Python Developer",
    company: "DataFlow Inc",
    description: "We need a skilled backend developer to work on our data processing pipelines and API services. Experience with Python and cloud technologies is essential.",
    requiredSkills: [
      { name: "Python", proficiencyScore: 80 },
      { name: "Django", proficiencyScore: 70 },
      { name: "PostgreSQL", proficiencyScore: 65 },
      { name: "REST API", proficiencyScore: 70 },
      { name: "Git", proficiencyScore: 60 }
    ],
    preferredSkills: [
      { name: "AWS", proficiencyScore: 60 },
      { name: "Docker", proficiencyScore: 55 },
      { name: "Redis", proficiencyScore: 50 }
    ],
    location: "Seattle, WA",
    salaryMin: 100000,
    salaryMax: 140000,
    jobType: "full-time",
    experienceLevel: "mid",
    remoteAllowed: false,
    benefits: ["Health Insurance", "Dental", "Vision", "401k"],
    contactEmail: "jobs@dataflow.com"
  },
  {
    title: "DevOps Engineer",
    company: "CloudTech Systems",
    description: "Looking for a DevOps engineer to manage our cloud infrastructure and CI/CD pipelines. You'll work with containerization, orchestration, and monitoring tools.",
    requiredSkills: [
      { name: "AWS", proficiencyScore: 80 },
      { name: "Docker", proficiencyScore: 75 },
      { name: "Kubernetes", proficiencyScore: 70 },
      { name: "Linux", proficiencyScore: 75 },
      { name: "Git", proficiencyScore: 65 }
    ],
    preferredSkills: [
      { name: "Terraform", proficiencyScore: 60 },
      { name: "Jenkins", proficiencyScore: 55 },
      { name: "Monitoring", proficiencyScore: 50 }
    ],
    location: "Denver, CO",
    salaryMin: 110000,
    salaryMax: 160000,
    jobType: "full-time",
    experienceLevel: "senior",
    remoteAllowed: true,
    benefits: ["Health Insurance", "401k", "Professional Development", "Remote Work"],
    contactEmail: "devops@cloudtech.com"
  },
  {
    title: "Junior Software Engineer",
    company: "InnovateLab",
    description: "Perfect opportunity for a recent graduate or career changer. You'll work alongside senior developers on various projects and learn modern development practices.",
    requiredSkills: [
      { name: "JavaScript", proficiencyScore: 60 },
      { name: "HTML", proficiencyScore: 65 },
      { name: "CSS", proficiencyScore: 60 },
      { name: "Git", proficiencyScore: 55 }
    ],
    preferredSkills: [
      { name: "React", proficiencyScore: 40 },
      { name: "Node.js", proficiencyScore: 35 },
      { name: "SQL", proficiencyScore: 40 }
    ],
    location: "Portland, OR",
    salaryMin: 60000,
    salaryMax: 80000,
    jobType: "full-time",
    experienceLevel: "entry",
    remoteAllowed: true,
    benefits: ["Health Insurance", "Learning Budget", "Mentorship Program"],
    contactEmail: "junior@innovatelab.com"
  },
  {
    title: "Mobile App Developer (React Native)",
    company: "MobileFirst Co",
    description: "Develop cross-platform mobile applications using React Native. You'll work on consumer-facing apps with millions of users.",
    requiredSkills: [
      { name: "React Native", proficiencyScore: 80 },
      { name: "JavaScript", proficiencyScore: 75 },
      { name: "React", proficiencyScore: 70 },
      { name: "Mobile Development", proficiencyScore: 75 }
    ],
    preferredSkills: [
      { name: "TypeScript", proficiencyScore: 60 },
      { name: "iOS", proficiencyScore: 50 },
      { name: "Android", proficiencyScore: 50 }
    ],
    location: "Los Angeles, CA",
    salaryMin: 95000,
    salaryMax: 135000,
    jobType: "full-time",
    experienceLevel: "mid",
    remoteAllowed: true,
    benefits: ["Health Insurance", "Stock Options", "Flexible PTO"],
    contactEmail: "mobile@mobilefirst.com"
  },
  {
    title: "Data Engineer",
    company: "BigData Analytics",
    description: "Build and maintain data pipelines for our analytics platform. Work with large-scale data processing and machine learning infrastructure.",
    requiredSkills: [
      { name: "Python", proficiencyScore: 80 },
      { name: "SQL", proficiencyScore: 75 },
      { name: "Apache Spark", proficiencyScore: 70 },
      { name: "ETL", proficiencyScore: 70 }
    ],
    preferredSkills: [
      { name: "Kafka", proficiencyScore: 60 },
      { name: "Airflow", proficiencyScore: 55 },
      { name: "AWS", proficiencyScore: 60 }
    ],
    location: "New York, NY",
    salaryMin: 115000,
    salaryMax: 165000,
    jobType: "full-time",
    experienceLevel: "senior",
    remoteAllowed: false,
    benefits: ["Health Insurance", "401k", "Bonus", "Professional Development"],
    contactEmail: "data@bigdataanalytics.com"
  },
  {
    title: "UI/UX Developer",
    company: "DesignTech Studio",
    description: "Create beautiful and intuitive user interfaces. You'll work closely with designers to implement pixel-perfect designs using modern CSS and JavaScript.",
    requiredSkills: [
      { name: "HTML", proficiencyScore: 80 },
      { name: "CSS", proficiencyScore: 80 },
      { name: "JavaScript", proficiencyScore: 70 },
      { name: "Figma", proficiencyScore: 65 }
    ],
    preferredSkills: [
      { name: "React", proficiencyScore: 60 },
      { name: "Sass", proficiencyScore: 55 },
      { name: "Animation", proficiencyScore: 50 }
    ],
    location: "Miami, FL",
    salaryMin: 75000,
    salaryMax: 105000,
    jobType: "full-time",
    experienceLevel: "mid",
    remoteAllowed: true,
    benefits: ["Health Insurance", "Creative Budget", "Flexible Hours"],
    contactEmail: "ui@designtech.com"
  },
  {
    title: "Machine Learning Engineer",
    company: "AI Innovations",
    description: "Develop and deploy machine learning models in production. Work on cutting-edge AI applications and research projects.",
    requiredSkills: [
      { name: "Python", proficiencyScore: 85 },
      { name: "Machine Learning", proficiencyScore: 80 },
      { name: "TensorFlow", proficiencyScore: 75 },
      { name: "Statistics", proficiencyScore: 70 }
    ],
    preferredSkills: [
      { name: "PyTorch", proficiencyScore: 65 },
      { name: "MLOps", proficiencyScore: 60 },
      { name: "AWS", proficiencyScore: 55 }
    ],
    location: "Boston, MA",
    salaryMin: 130000,
    salaryMax: 190000,
    jobType: "full-time",
    experienceLevel: "senior",
    remoteAllowed: true,
    benefits: ["Health Insurance", "401k", "Research Budget", "Conference Attendance"],
    contactEmail: "ml@aiinnovations.com"
  },
  {
    title: "Cybersecurity Analyst",
    company: "SecureNet Corp",
    description: "Protect our systems and data from security threats. Monitor, analyze, and respond to security incidents and vulnerabilities.",
    requiredSkills: [
      { name: "Cybersecurity", proficiencyScore: 80 },
      { name: "Network Security", proficiencyScore: 75 },
      { name: "Linux", proficiencyScore: 70 },
      { name: "Security Tools", proficiencyScore: 70 }
    ],
    preferredSkills: [
      { name: "Python", proficiencyScore: 60 },
      { name: "SIEM", proficiencyScore: 65 },
      { name: "Penetration Testing", proficiencyScore: 55 }
    ],
    location: "Washington, DC",
    salaryMin: 90000,
    salaryMax: 130000,
    jobType: "full-time",
    experienceLevel: "mid",
    remoteAllowed: false,
    benefits: ["Health Insurance", "Security Clearance Bonus", "401k"],
    contactEmail: "security@securenet.com"
  },
  {
    title: "Cloud Architect",
    company: "CloudScale Solutions",
    description: "Design and implement scalable cloud architectures. Lead cloud migration projects and optimize infrastructure costs.",
    requiredSkills: [
      { name: "AWS", proficiencyScore: 85 },
      { name: "Cloud Architecture", proficiencyScore: 80 },
      { name: "Microservices", proficiencyScore: 75 },
      { name: "Infrastructure as Code", proficiencyScore: 70 }
    ],
    preferredSkills: [
      { name: "Terraform", proficiencyScore: 70 },
      { name: "Kubernetes", proficiencyScore: 65 },
      { name: "Azure", proficiencyScore: 60 }
    ],
    location: "Chicago, IL",
    salaryMin: 140000,
    salaryMax: 200000,
    jobType: "full-time",
    experienceLevel: "lead",
    remoteAllowed: true,
    benefits: ["Health Insurance", "401k", "Stock Options", "Professional Development"],
    contactEmail: "architect@cloudscale.com"
  },
  {
    title: "QA Automation Engineer",
    company: "TestPro Systems",
    description: "Develop and maintain automated testing frameworks. Ensure software quality through comprehensive testing strategies.",
    requiredSkills: [
      { name: "Test Automation", proficiencyScore: 80 },
      { name: "Selenium", proficiencyScore: 75 },
      { name: "Java", proficiencyScore: 70 },
      { name: "Testing", proficiencyScore: 80 }
    ],
    preferredSkills: [
      { name: "Cypress", proficiencyScore: 60 },
      { name: "API Testing", proficiencyScore: 65 },
      { name: "CI/CD", proficiencyScore: 55 }
    ],
    location: "Phoenix, AZ",
    salaryMin: 85000,
    salaryMax: 115000,
    jobType: "full-time",
    experienceLevel: "mid",
    remoteAllowed: true,
    benefits: ["Health Insurance", "401k", "Flexible PTO"],
    contactEmail: "qa@testpro.com"
  },
  {
    title: "Database Administrator",
    company: "DataVault Inc",
    description: "Manage and optimize database systems. Ensure data integrity, performance, and security across multiple database platforms.",
    requiredSkills: [
      { name: "PostgreSQL", proficiencyScore: 85 },
      { name: "Database Administration", proficiencyScore: 80 },
      { name: "SQL", proficiencyScore: 85 },
      { name: "Performance Tuning", proficiencyScore: 75 }
    ],
    preferredSkills: [
      { name: "MySQL", proficiencyScore: 70 },
      { name: "MongoDB", proficiencyScore: 60 },
      { name: "Backup and Recovery", proficiencyScore: 70 }
    ],
    location: "Dallas, TX",
    salaryMin: 95000,
    salaryMax: 135000,
    jobType: "full-time",
    experienceLevel: "senior",
    remoteAllowed: false,
    benefits: ["Health Insurance", "401k", "Professional Certification Support"],
    contactEmail: "dba@datavault.com"
  },
  {
    title: "Site Reliability Engineer",
    company: "ReliableTech",
    description: "Ensure system reliability and performance at scale. Build monitoring, alerting, and automation tools for production systems.",
    requiredSkills: [
      { name: "SRE", proficiencyScore: 80 },
      { name: "Linux", proficiencyScore: 80 },
      { name: "Monitoring", proficiencyScore: 75 },
      { name: "Automation", proficiencyScore: 75 }
    ],
    preferredSkills: [
      { name: "Prometheus", proficiencyScore: 65 },
      { name: "Grafana", proficiencyScore: 60 },
      { name: "Python", proficiencyScore: 65 }
    ],
    location: "San Jose, CA",
    salaryMin: 125000,
    salaryMax: 175000,
    jobType: "full-time",
    experienceLevel: "senior",
    remoteAllowed: true,
    benefits: ["Health Insurance", "401k", "On-call Compensation", "Professional Development"],
    contactEmail: "sre@reliabletech.com"
  },
  {
    title: "Blockchain Developer",
    company: "CryptoTech Labs",
    description: "Develop decentralized applications and smart contracts. Work on innovative blockchain solutions and cryptocurrency platforms.",
    requiredSkills: [
      { name: "Blockchain", proficiencyScore: 80 },
      { name: "Solidity", proficiencyScore: 75 },
      { name: "Ethereum", proficiencyScore: 70 },
      { name: "Smart Contracts", proficiencyScore: 75 }
    ],
    preferredSkills: [
      { name: "Web3", proficiencyScore: 65 },
      { name: "JavaScript", proficiencyScore: 60 },
      { name: "Cryptography", proficiencyScore: 55 }
    ],
    location: "Remote",
    salaryMin: 110000,
    salaryMax: 160000,
    jobType: "full-time",
    experienceLevel: "mid",
    remoteAllowed: true,
    benefits: ["Health Insurance", "Crypto Bonus", "Flexible Hours"],
    contactEmail: "blockchain@cryptotech.com"
  },
  {
    title: "Game Developer (Unity)",
    company: "GameStudio Pro",
    description: "Create engaging mobile and PC games using Unity. Work on gameplay mechanics, graphics, and user experience.",
    requiredSkills: [
      { name: "Unity", proficiencyScore: 80 },
      { name: "C#", proficiencyScore: 75 },
      { name: "Game Development", proficiencyScore: 80 },
      { name: "3D Graphics", proficiencyScore: 70 }
    ],
    preferredSkills: [
      { name: "Blender", proficiencyScore: 60 },
      { name: "Mobile Games", proficiencyScore: 65 },
      { name: "VR/AR", proficiencyScore: 50 }
    ],
    location: "Los Angeles, CA",
    salaryMin: 90000,
    salaryMax: 130000,
    jobType: "full-time",
    experienceLevel: "mid",
    remoteAllowed: true,
    benefits: ["Health Insurance", "Game Library", "Creative Time"],
    contactEmail: "games@gamestudio.com"
  },
  {
    title: "Technical Writer",
    company: "DocuTech Solutions",
    description: "Create technical documentation for software products. Work with engineering teams to document APIs, user guides, and technical specifications.",
    requiredSkills: [
      { name: "Technical Writing", proficiencyScore: 80 },
      { name: "Documentation", proficiencyScore: 80 },
      { name: "API Documentation", proficiencyScore: 70 },
      { name: "Markdown", proficiencyScore: 65 }
    ],
    preferredSkills: [
      { name: "Git", proficiencyScore: 55 },
      { name: "HTML", proficiencyScore: 50 },
      { name: "Software Development", proficiencyScore: 45 }
    ],
    location: "Remote",
    salaryMin: 70000,
    salaryMax: 95000,
    jobType: "full-time",
    experienceLevel: "mid",
    remoteAllowed: true,
    benefits: ["Health Insurance", "Professional Development", "Flexible Hours"],
    contactEmail: "writer@docutech.com"
  },
  {
    title: "Product Manager (Tech)",
    company: "ProductFlow Inc",
    description: "Lead product development for our SaaS platform. Work with engineering, design, and business teams to deliver user-focused features.",
    requiredSkills: [
      { name: "Product Management", proficiencyScore: 80 },
      { name: "Agile", proficiencyScore: 75 },
      { name: "User Research", proficiencyScore: 70 },
      { name: "Analytics", proficiencyScore: 65 }
    ],
    preferredSkills: [
      { name: "SQL", proficiencyScore: 55 },
      { name: "A/B Testing", proficiencyScore: 60 },
      { name: "Wireframing", proficiencyScore: 50 }
    ],
    location: "San Francisco, CA",
    salaryMin: 120000,
    salaryMax: 170000,
    jobType: "full-time",
    experienceLevel: "senior",
    remoteAllowed: true,
    benefits: ["Health Insurance", "401k", "Stock Options", "Professional Development"],
    contactEmail: "pm@productflow.com"
  },
  {
    title: "Systems Administrator",
    company: "InfraTech Corp",
    description: "Manage and maintain IT infrastructure. Handle server administration, network management, and system security.",
    requiredSkills: [
      { name: "System Administration", proficiencyScore: 80 },
      { name: "Linux", proficiencyScore: 80 },
      { name: "Windows Server", proficiencyScore: 70 },
      { name: "Networking", proficiencyScore: 75 }
    ],
    preferredSkills: [
      { name: "VMware", proficiencyScore: 65 },
      { name: "Active Directory", proficiencyScore: 60 },
      { name: "PowerShell", proficiencyScore: 55 }
    ],
    location: "Atlanta, GA",
    salaryMin: 75000,
    salaryMax: 105000,
    jobType: "full-time",
    experienceLevel: "mid",
    remoteAllowed: false,
    benefits: ["Health Insurance", "401k", "Professional Certification Support"],
    contactEmail: "sysadmin@infratech.com"
  },
  {
    title: "Software Architect",
    company: "ArchitectureFirst",
    description: "Design software architecture for enterprise applications. Lead technical decisions and mentor development teams.",
    requiredSkills: [
      { name: "Software Architecture", proficiencyScore: 85 },
      { name: "System Design", proficiencyScore: 85 },
      { name: "Microservices", proficiencyScore: 80 },
      { name: "Design Patterns", proficiencyScore: 80 }
    ],
    preferredSkills: [
      { name: "Domain-Driven Design", proficiencyScore: 70 },
      { name: "Event Sourcing", proficiencyScore: 65 },
      { name: "CQRS", proficiencyScore: 60 }
    ],
    location: "Seattle, WA",
    salaryMin: 150000,
    salaryMax: 220000,
    jobType: "full-time",
    experienceLevel: "lead",
    remoteAllowed: true,
    benefits: ["Health Insurance", "401k", "Stock Options", "Architecture Conference Budget"],
    contactEmail: "architect@architecturefirst.com"
  },
  {
    title: "Network Engineer",
    company: "NetSecure Systems",
    description: "Design and implement network infrastructure. Manage routers, switches, firewalls, and network security protocols.",
    requiredSkills: [
      { name: "Networking", proficiencyScore: 85 },
      { name: "Cisco", proficiencyScore: 80 },
      { name: "Network Security", proficiencyScore: 75 },
      { name: "TCP/IP", proficiencyScore: 80 }
    ],
    preferredSkills: [
      { name: "CCNA", proficiencyScore: 70 },
      { name: "VPN", proficiencyScore: 65 },
      { name: "Firewall Management", proficiencyScore: 70 }
    ],
    location: "Houston, TX",
    salaryMin: 85000,
    salaryMax: 120000,
    jobType: "full-time",
    experienceLevel: "senior",
    remoteAllowed: false,
    benefits: ["Health Insurance", "401k", "Certification Reimbursement"],
    contactEmail: "network@netsecure.com"
  },
  {
    title: "AI Research Scientist",
    company: "DeepMind Labs",
    description: "Conduct cutting-edge AI research. Develop novel algorithms and contribute to scientific publications in machine learning and artificial intelligence.",
    requiredSkills: [
      { name: "Machine Learning", proficiencyScore: 90 },
      { name: "Deep Learning", proficiencyScore: 85 },
      { name: "Research", proficiencyScore: 85 },
      { name: "Python", proficiencyScore: 80 }
    ],
    preferredSkills: [
      { name: "PyTorch", proficiencyScore: 75 },
      { name: "Computer Vision", proficiencyScore: 70 },
      { name: "NLP", proficiencyScore: 70 }
    ],
    location: "Palo Alto, CA",
    salaryMin: 180000,
    salaryMax: 280000,
    jobType: "full-time",
    experienceLevel: "lead",
    remoteAllowed: true,
    benefits: ["Health Insurance", "401k", "Research Budget", "Publication Bonus"],
    contactEmail: "research@deepmindlabs.com"
  },
  {
    title: "IoT Developer",
    company: "SmartDevice Inc",
    description: "Develop software for Internet of Things devices. Work on embedded systems, sensor integration, and device communication protocols.",
    requiredSkills: [
      { name: "IoT", proficiencyScore: 80 },
      { name: "Embedded Systems", proficiencyScore: 75 },
      { name: "C++", proficiencyScore: 75 },
      { name: "Sensors", proficiencyScore: 70 }
    ],
    preferredSkills: [
      { name: "Arduino", proficiencyScore: 65 },
      { name: "Raspberry Pi", proficiencyScore: 60 },
      { name: "MQTT", proficiencyScore: 55 }
    ],
    location: "Austin, TX",
    salaryMin: 95000,
    salaryMax: 135000,
    jobType: "full-time",
    experienceLevel: "mid",
    remoteAllowed: true,
    benefits: ["Health Insurance", "401k", "Hardware Budget"],
    contactEmail: "iot@smartdevice.com"
  },
  {
    title: "Salesforce Developer",
    company: "CRM Solutions Pro",
    description: "Customize and develop Salesforce applications. Work on Apex, Lightning components, and integrations with third-party systems.",
    requiredSkills: [
      { name: "Salesforce", proficiencyScore: 80 },
      { name: "Apex", proficiencyScore: 75 },
      { name: "Lightning", proficiencyScore: 70 },
      { name: "CRM", proficiencyScore: 70 }
    ],
    preferredSkills: [
      { name: "Visualforce", proficiencyScore: 60 },
      { name: "Integration", proficiencyScore: 65 },
      { name: "JavaScript", proficiencyScore: 55 }
    ],
    location: "Remote",
    salaryMin: 90000,
    salaryMax: 125000,
    jobType: "full-time",
    experienceLevel: "mid",
    remoteAllowed: true,
    benefits: ["Health Insurance", "Salesforce Certification Support", "Flexible Hours"],
    contactEmail: "salesforce@crmsolutions.com"
  },
  {
    title: "Platform Engineer",
    company: "ScaleTech Platform",
    description: "Build and maintain developer platforms and tooling. Focus on developer experience, CI/CD, and infrastructure automation.",
    requiredSkills: [
      { name: "Platform Engineering", proficiencyScore: 80 },
      { name: "Kubernetes", proficiencyScore: 75 },
      { name: "CI/CD", proficiencyScore: 75 },
      { name: "Infrastructure as Code", proficiencyScore: 70 }
    ],
    preferredSkills: [
      { name: "Helm", proficiencyScore: 65 },
      { name: "GitOps", proficiencyScore: 60 },
      { name: "Service Mesh", proficiencyScore: 55 }
    ],
    location: "San Francisco, CA",
    salaryMin: 130000,
    salaryMax: 180000,
    jobType: "full-time",
    experienceLevel: "senior",
    remoteAllowed: true,
    benefits: ["Health Insurance", "401k", "Stock Options", "Conference Budget"],
    contactEmail: "platform@scaletech.com"
  }
];

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting mock job creation...');
    
    // Generate job listings with unique IDs
    const jobsToInsert = mockJobs.map(job => ({
      id: nanoid(),
      title: job.title,
      company: job.company,
      description: job.description,
      requiredSkills: JSON.stringify(job.requiredSkills),
      preferredSkills: JSON.stringify(job.preferredSkills),
      location: job.location,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      jobType: job.jobType,
      experienceLevel: job.experienceLevel,
      remoteAllowed: job.remoteAllowed,
      benefits: JSON.stringify(job.benefits),
      applicationUrl: null,
      contactEmail: job.contactEmail,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Insert all jobs into database
    await db.insert(jobListings).values(jobsToInsert);

    console.log(`✅ Successfully created ${jobsToInsert.length} mock job listings`);

    return NextResponse.json({
      success: true,
      message: `Successfully created ${jobsToInsert.length} mock job listings`,
      jobsCreated: jobsToInsert.length,
      jobs: jobsToInsert.map(job => ({
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        experienceLevel: job.experienceLevel,
      }))
    });

  } catch (error) {
    console.error('❌ Error creating mock jobs:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create mock job listings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}