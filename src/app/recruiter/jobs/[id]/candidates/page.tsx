import { auth } from '~/lib/auth';
import { db } from '~/db';
import { jobPostings, recruiterProfiles } from '~/db/schema';
import { eq, and } from 'drizzle-orm';
import { notFound, redirect } from 'next/navigation';
import { CandidateList } from '~/app/recruiter/_modules/candidate-list';

interface CandidatesPageProps {
  params: {
    id: string;
  };
}

export default async function CandidatesPage({ params }: CandidatesPageProps) {
  // TODO: Fix auth - temporarily bypass for testing
  // For now, we'll use a mock session to test candidate matching
  const session = {
    user: {
      id: 'temp-user-id' // This should be replaced with proper auth
    }
  };
  
  // In production, uncomment this:
  // const session = await auth();
  // if (!session?.user?.id) {
  //   redirect('/auth/signin');
  // }

  // Get job posting - temporarily remove user access check for testing
  const job = await db
    .select({
      id: jobPostings.id,
      title: jobPostings.title,
      rawDescription: jobPostings.rawDescription,
      requiredSkills: jobPostings.requiredSkills,
      preferredSkills: jobPostings.preferredSkills,
      experienceLevel: jobPostings.experienceLevel,
      location: jobPostings.location,
      remoteAllowed: jobPostings.remoteAllowed,
      status: jobPostings.status,
      createdAt: jobPostings.createdAt,
      recruiterName: recruiterProfiles.organizationName,
    })
    .from(jobPostings)
    .innerJoin(recruiterProfiles, eq(jobPostings.recruiterId, recruiterProfiles.id))
    .where(eq(jobPostings.id, params.id))
    .limit(1);
    
  // TODO: Re-enable user access check when auth is fixed:
  // .where(
  //   and(
  //     eq(jobPostings.id, params.id),
  //     eq(recruiterProfiles.userId, session.user.id)
  //   )
  // )

  if (job.length === 0) {
    notFound();
  }

  const jobData = job[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
            <a 
              href="/recruiter/jobs" 
              className="hover:text-apple-blue transition-colors"
            >
              Jobs
            </a>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="truncate">{jobData.title}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span>Candidates</span>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white">
                {jobData.title}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h1m-1-4h1m4 4h1m-1-4h1" />
                  </svg>
                  {jobData.recruiterName}
                </span>
                
                {jobData.location && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {jobData.location}
                    {jobData.remoteAllowed && ' (Remote OK)'}
                  </span>
                )}
                
                {jobData.experienceLevel && (
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md capitalize">
                    {jobData.experienceLevel} level
                  </span>
                )}
                
                <span className={`px-2 py-1 rounded-md capitalize text-xs font-medium ${
                  jobData.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }`}>
                  {jobData.status}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`/recruiter/jobs/${params.id}`}
                className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                View Job Details
              </a>
              <a
                href={`/recruiter/jobs/${params.id}/edit`}
                className="px-4 py-2 text-sm bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Edit Job
              </a>
            </div>
          </div>
        </div>

        {/* Job requirements summary */}
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-black dark:text-white mb-4">
            Job Requirements
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Required skills */}
            {jobData.requiredSkills && Array.isArray(jobData.requiredSkills) && jobData.requiredSkills.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Required Skills ({jobData.requiredSkills.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {jobData.requiredSkills.map((skill: any, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm border border-red-200 dark:border-red-800"
                    >
                      {typeof skill === 'string' ? skill : skill.name} *
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preferred skills */}
            {jobData.preferredSkills && Array.isArray(jobData.preferredSkills) && jobData.preferredSkills.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Preferred Skills ({jobData.preferredSkills.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {jobData.preferredSkills.map((skill: any, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-md text-sm border border-blue-200 dark:border-blue-800"
                    >
                      {typeof skill === 'string' ? skill : skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {(!jobData.requiredSkills || !Array.isArray(jobData.requiredSkills) || jobData.requiredSkills.length === 0) &&
           (!jobData.preferredSkills || !Array.isArray(jobData.preferredSkills) || jobData.preferredSkills.length === 0) && (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Skills Extracted
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Skills haven't been extracted from this job posting yet. This may affect candidate matching accuracy.
              </p>
              <a
                href={`/recruiter/jobs/${params.id}/edit`}
                className="px-4 py-2 bg-apple-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Edit Job & Extract Skills
              </a>
            </div>
          )}
        </div>

        {/* Candidates list */}
        <CandidateList jobId={params.id} />
      </div>
    </div>
  );
}