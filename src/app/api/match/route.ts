import { NextRequest, NextResponse } from 'next/server';
import { CandidateMatchingService } from '~/services/candidate-matching';
import { JobPostingService } from '~/services/job-posting';
import { logger } from '~/lib/logger';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { jobDescription, jobId, limit = 10, minMatchScore = 30 } = body;

        if (!jobDescription && !jobId) {
            return NextResponse.json({
                error: 'Either jobDescription or jobId is required'
            }, { status: 400 });
        }

        logger.info('Match API request received', {
            operation: 'match-api',
            metadata: {
                hasJobDescription: !!jobDescription,
                hasJobId: !!jobId,
                limit,
                minMatchScore
            }
        });

        const candidateMatchingService = new CandidateMatchingService();
        const jobPostingService = new JobPostingService();

        let jobPosting;

        if (jobId) {
            // Use existing job posting
            jobPosting = await jobPostingService.getJobPosting(jobId);
            if (!jobPosting) {
                return NextResponse.json({
                    error: 'Job posting not found'
                }, { status: 404 });
            }
        } else {
            // Create a temporary job posting from description
            const extractedSkills = await jobPostingService.extractSkillsFromDescription(jobDescription);

            jobPosting = {
                id: 'temp-job',
                title: 'Temporary Job for Matching',
                rawDescription: jobDescription,
                extractedSkills: extractedSkills.skills,
                requiredSkills: extractedSkills.skills.filter(skill => skill.required),
                preferredSkills: extractedSkills.skills.filter(skill => !skill.required),
                recruiterId: 'temp-recruiter',
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        }

        // Find matching candidates using the real candidate matching service
        const matchingCandidates = await candidateMatchingService.findMatchingCandidates(
            jobPosting,
            { minMatchScore },
            { page: 1, limit }
        );

        logger.info('Match API completed successfully', {
            operation: 'match-api',
            metadata: {
                jobId: jobPosting.id,
                candidatesFound: matchingCandidates.data.length,
                totalCandidates: matchingCandidates.pagination.total
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                job: {
                    id: jobPosting.id,
                    title: jobPosting.title,
                    requiredSkills: jobPosting.requiredSkills,
                    preferredSkills: jobPosting.preferredSkills,
                },
                candidates: matchingCandidates.data,
                pagination: matchingCandidates.pagination,
                summary: {
                    totalCandidates: matchingCandidates.pagination.total,
                    matchedCandidates: matchingCandidates.data.length,
                    averageMatchScore: matchingCandidates.data.length > 0
                        ? Math.round(matchingCandidates.data.reduce((sum, c) => sum + c.match.score, 0) / matchingCandidates.data.length)
                        : 0,
                    topMatchScore: matchingCandidates.data.length > 0
                        ? Math.max(...matchingCandidates.data.map(c => c.match.score))
                        : 0,
                }
            }
        });

    } catch (error) {
        logger.error('Match API error', {
            operation: 'match-api'
        }, error as Error);

        return NextResponse.json({
            success: false,
            error: 'Failed to find matching candidates',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}