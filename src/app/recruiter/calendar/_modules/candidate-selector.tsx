"use client"

import { useState } from 'react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  position: string;
  calUsername?: string;
}

// Mock data - in production this would come from your database
const mockCandidates: Candidate[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    position: 'Frontend Developer',
    calUsername: 'john-doe'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    position: 'Backend Developer',
    calUsername: 'jane-smith'
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    position: 'Full Stack Developer',
    calUsername: 'mike-johnson'
  }
];

export function CandidateSelector() {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCandidates = mockCandidates.filter(candidate =>
    candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
          Select Candidate
        </h3>
        
        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20"
          />
        </div>

        {/* Candidate List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredCandidates.map((candidate) => (
            <button
              key={candidate.id}
              onClick={() => setSelectedCandidate(candidate)}
              className={`w-full text-left p-3 rounded-lg border transition-colors duration-150 ${
                selectedCandidate?.id === candidate.id
                  ? 'border-apple-blue bg-apple-blue/10 text-apple-blue'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 hover:dark:bg-gray-900 text-black dark:text-white'
              }`}
            >
              <div className="font-medium text-sm">{candidate.name}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {candidate.position}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {candidate.email}
              </div>
            </button>
          ))}
        </div>

        {filteredCandidates.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No candidates found
          </div>
        )}
      </div>

      {/* Selected Candidate Info */}
      {selectedCandidate && (
        <div className="bg-apple-blue/10 border border-apple-blue/20 rounded-xl p-4">
          <h4 className="font-semibold text-apple-blue mb-2">
            Selected Candidate
          </h4>
          <div className="text-sm text-apple-blue/80">
            <div className="font-medium">{selectedCandidate.name}</div>
            <div>{selectedCandidate.position}</div>
            <div>{selectedCandidate.email}</div>
          </div>
          
          {selectedCandidate.calUsername ? (
            <div className="mt-3 text-xs text-apple-blue/70">
              ✓ Cal.com profile available
            </div>
          ) : (
            <div className="mt-3 text-xs text-orange-600 dark:text-orange-400">
              ⚠ No Cal.com profile linked
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
        <h4 className="font-medium text-black dark:text-white mb-2 text-sm">
          How it works
        </h4>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>1. Select a candidate from the list</li>
          <li>2. Choose an available time slot</li>
          <li>3. Both parties receive calendar invites</li>
          <li>4. Interview details are automatically synced</li>
        </ul>
      </div>
    </div>
  );
}