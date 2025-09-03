import { NextRequest, NextResponse } from 'next/server';
import { db } from '~/db';
import { user, userSkills } from '~/db/schema';
import { nanoid } from 'nanoid';

/**
 * POST /api/debug/create-mock-candidates
 * Create 25 mock candidates with realistic profiles and skills
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[CREATE-MOCK-CANDIDATES] Starting mock candidate creation');

    // Mock candidate data with realistic profiles
    const mockCandidates = [
      {
        name: 'Sarah Chen',
        email: 'sarah.chen@email.com',
        skills: ['React', 'TypeScript', 'Node.js', 'GraphQL', 'AWS', 'Docker', 'Jest', 'CSS', 'HTML']
      },
      {
        name: 'Marcus Johnson',
        email: 'marcus.johnson@email.com',
        skills: ['Python', 'Django', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'Git', 'Linux', 'API Design']
      },
      {
        name: 'Elena Rodriguez',
        email: 'elena.rodriguez@email.com',
        skills: ['Vue.js', 'JavaScript', 'PHP', 'Laravel', 'MySQL', 'Sass', 'Webpack', 'REST APIs', 'Agile']
      },
      {
        name: 'David Kim',
        email: 'david.kim@email.com',
        skills: ['Java', 'Spring Boot', 'Microservices', 'MongoDB', 'Kafka', 'Jenkins', 'Maven', 'JUnit', 'OAuth']
      },
      {
        name: 'Priya Patel',
        email: 'priya.patel@email.com',
        skills: ['Angular', 'TypeScript', 'RxJS', 'NgRx', 'Material Design', 'Cypress', 'Jasmine', 'SCSS', 'Accessibility']
      },
      {
        name: 'Alex Thompson',
        email: 'alex.thompson@email.com',
        skills: ['Go', 'gRPC', 'Protocol Buffers', 'Kubernetes', 'Helm', 'Prometheus', 'Grafana', 'Terraform', 'Cloud Architecture']
      },
      {
        name: 'Maria Santos',
        email: 'maria.santos@email.com',
        skills: ['React Native', 'Swift', 'Kotlin', 'Firebase', 'Redux', 'Expo', 'iOS Development', 'Android Development', 'Mobile UI/UX']
      },
      {
        name: 'James Wilson',
        email: 'james.wilson@email.com',
        skills: ['C#', '.NET Core', 'Azure', 'SQL Server', 'Entity Framework', 'SignalR', 'Blazor', 'DevOps', 'CI/CD']
      },
      {
        name: 'Aisha Okafor',
        email: 'aisha.okafor@email.com',
        skills: ['Ruby', 'Ruby on Rails', 'Sidekiq', 'Heroku', 'PostgreSQL', 'RSpec', 'Capybara', 'Stimulus', 'Turbo']
      },
      {
        name: 'Chen Wei',
        email: 'chen.wei@email.com',
        skills: ['Rust', 'WebAssembly', 'Actix', 'Tokio', 'Serde', 'Cargo', 'Systems Programming', 'Performance Optimization', 'Memory Management']
      },
      {
        name: 'Isabella Garcia',
        email: 'isabella.garcia@email.com',
        skills: ['Flutter', 'Dart', 'Provider', 'Bloc', 'Hive', 'GetX', 'Firebase', 'Cross-platform Development', 'Material Design']
      },
      {
        name: 'Robert Anderson',
        email: 'robert.anderson@email.com',
        skills: ['Scala', 'Akka', 'Play Framework', 'Apache Spark', 'Kafka', 'Cassandra', 'Functional Programming', 'Big Data', 'Stream Processing']
      },
      {
        name: 'Fatima Al-Zahra',
        email: 'fatima.alzahra@email.com',
        skills: ['Svelte', 'SvelteKit', 'Vite', 'Tailwind CSS', 'Supabase', 'Vercel', 'Progressive Web Apps', 'Web Components', 'Accessibility']
      },
      {
        name: 'Michael Brown',
        email: 'michael.brown@email.com',
        skills: ['Elixir', 'Phoenix', 'LiveView', 'OTP', 'GenServer', 'Ecto', 'Concurrent Programming', 'Fault Tolerance', 'Real-time Systems']
      },
      {
        name: 'Yuki Tanaka',
        email: 'yuki.tanaka@email.com',
        skills: ['Kotlin', 'Android Jetpack', 'Compose', 'Coroutines', 'Room', 'Retrofit', 'Dagger Hilt', 'MVVM', 'Clean Architecture']
      },
      {
        name: 'Sophie Martin',
        email: 'sophie.martin@email.com',
        skills: ['Next.js', 'React', 'Prisma', 'tRPC', 'Tailwind CSS', 'Vercel', 'TypeScript', 'Zod', 'Server Components']
      },
      {
        name: 'Ahmed Hassan',
        email: 'ahmed.hassan@email.com',
        skills: ['Clojure', 'ClojureScript', 'Ring', 'Compojure', 'Reagent', 'Re-frame', 'Datomic', 'Functional Programming', 'Immutable Data']
      },
      {
        name: 'Emma Davis',
        email: 'emma.davis@email.com',
        skills: ['Remix', 'React', 'Prisma', 'SQLite', 'Fly.io', 'Progressive Enhancement', 'Web Standards', 'Performance', 'SEO']
      },
      {
        name: 'Luis Mendoza',
        email: 'luis.mendoza@email.com',
        skills: ['Haskell', 'Servant', 'Persistent', 'Yesod', 'QuickCheck', 'Stack', 'Functional Programming', 'Type Safety', 'Monads']
      },
      {
        name: 'Zara Ali',
        email: 'zara.ali@email.com',
        skills: ['Nuxt.js', 'Vue 3', 'Composition API', 'Pinia', 'Nitro', 'UnoCss', 'Vite', 'SSR', 'JAMstack']
      },
      {
        name: 'Oliver Smith',
        email: 'oliver.smith@email.com',
        skills: ['Deno', 'Fresh', 'TypeScript', 'Oak', 'Aleph.js', 'Web Standards', 'Edge Computing', 'Security', 'Modern JavaScript']
      },
      {
        name: 'Nadia Volkov',
        email: 'nadia.volkov@email.com',
        skills: ['Zig', 'C', 'LLVM', 'WebAssembly', 'Systems Programming', 'Compilers', 'Memory Safety', 'Performance', 'Low-level Programming']
      },
      {
        name: 'Carlos Ruiz',
        email: 'carlos.ruiz@email.com',
        skills: ['Astro', 'Solid.js', 'Vite', 'Islands Architecture', 'Static Site Generation', 'Web Performance', 'Modern CSS', 'Component Libraries', 'Build Tools']
      },
      {
        name: 'Amara Okonkwo',
        email: 'amara.okonkwo@email.com',
        skills: ['Qwik', 'Resumability', 'Vite', 'TypeScript', 'Web Performance', 'Progressive Hydration', 'Modern Frameworks', 'Developer Experience', 'Optimization']
      },
      {
        name: 'Kai Nakamura',
        email: 'kai.nakamura@email.com',
        skills: ['Bun', 'Elysia', 'TypeScript', 'Fast Runtime', 'Package Management', 'Bundling', 'Testing', 'Modern Tooling', 'Performance']
      }
    ];

    const createdCandidates = [];
    const createdSkills = [];

    console.log('[CREATE-MOCK-CANDIDATES] Creating candidates and skills');

    for (const candidate of mockCandidates) {
      // Create user
      const userId = nanoid();
      const now = new Date();

      const newUser = {
        id: userId,
        name: candidate.name,
        email: candidate.email,
        emailVerified: true,
        image: null,
        createdAt: now,
        updatedAt: now,
      };

      try {
        await db.insert(user).values(newUser);
        createdCandidates.push(newUser);
        console.log('[CREATE-MOCK-CANDIDATES] Created user:', candidate.name);

        // Create skills for this user
        for (const skillName of candidate.skills) {
          const skillId = nanoid();
          const skillData = {
            id: skillId,
            userId: userId,
            skillName: skillName,
            mentionCount: Math.floor(Math.random() * 10) + 1, // 1-10 mentions
            lastMentioned: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Within last 30 days
            proficiencyScore: (Math.random() * 40 + 60).toFixed(1), // 60-100 proficiency
            averageConfidence: (Math.random() * 30 + 70).toFixed(1), // 70-100 confidence
            averageEngagement: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
            topicDepthAverage: (Math.random() * 50 + 50).toFixed(1), // 50-100 depth
            firstMentioned: new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Within last 90 days
            createdAt: now,
            updatedAt: now,
          };

          await db.insert(userSkills).values(skillData);
          createdSkills.push(skillData);
        }

        console.log('[CREATE-MOCK-CANDIDATES] Created', candidate.skills.length, 'skills for', candidate.name);
      } catch (error) {
        console.error('[CREATE-MOCK-CANDIDATES] Error creating candidate:', candidate.name, error);
        // Continue with next candidate if one fails
      }
    }

    console.log('[CREATE-MOCK-CANDIDATES] Mock candidate creation completed');
    console.log('[CREATE-MOCK-CANDIDATES] Created', createdCandidates.length, 'candidates');
    console.log('[CREATE-MOCK-CANDIDATES] Created', createdSkills.length, 'skills');

    return NextResponse.json({
      success: true,
      data: {
        candidates: createdCandidates,
        skills: createdSkills,
        summary: {
          totalCandidates: createdCandidates.length,
          totalSkills: createdSkills.length,
          averageSkillsPerCandidate: (createdSkills.length / createdCandidates.length).toFixed(1),
        }
      },
      message: `Successfully created ${createdCandidates.length} mock candidates with ${createdSkills.length} skills`
    });

  } catch (error) {
    console.error('[CREATE-MOCK-CANDIDATES] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        errorType: error?.constructor?.name,
        errorStack: error instanceof Error ? error.stack : null,
      }
    }, { status: 500 });
  }
}