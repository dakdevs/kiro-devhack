import  { NextRequest, NextResponse } from 'next/server';
import { db } from '~/db';
import { userResponses, user as userTable } from '~/db/schema';
import { embedOne } from '~/utils/embeddings';
import { sql } from 'drizzle-orm';

const formatToPgVector = (vector: number[]) => `[${vector.join(',')}]`;

export async function POST(req: NextRequest){
    try{
         const body = await req.json();
         const jobDescription: string = body.jobDescription;
         const limit: number = body.limit || 10;

         if (!jobDescription){
            return NextResponse.json({ error: 'Job description required'}, { status: 400});
         }

         console.log(`Received match request for : ${jobDescription.substring(0, 50)}.....`);

         console.log('1. generating embedding for the job description...')
         const jobEmbedding = await embedOne(jobDescription);
         console.log('embedding generated');

         const query = sql `
         SELECT ur.id, ur.content, ur.user_id, u.name as "userName", u.email as "userEmail",
         (ur.embedding <=> ${formatToPgVector(jobEmbedding)}) As distance from ${userResponses} ur join ${userTable} u on ur.user_id = u.id
         order by distance asc limit ${limit}; `;

         const { rows: searchResults } = await db.execute(query);

         console.log(`found ${searchResults.length} matching results.`);

         return NextResponse.json({ results: searchResults });
    } catch(error){
        console.error('Match API Error: ', error);
        return NextResponse.json({ error: 'Failed to perform similarity search.'}, { status: 500 });
    }
}