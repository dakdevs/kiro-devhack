"use client"

import { useState } from 'react';
import { User, Plus, Loader2, CheckCircle, AlertCircle, Eye } from 'lucide-react';

interface CandidateSkillImporterProps {
  onSkillsImported?: () => void;
}

export function CandidateSkillImporter({ onSkillsImported }: CandidateSkillImporterProps) {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [skillsData, setSkillsData] = useState<any>(null);

  const handleCheckSkills = async () => {
    setChecking(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/debug/candidate-skills');
      const data = await response.json();

      if (data.success) {
        setSkillsData(data);
        setMessage(`Found ${data.skillCount} skills in your profile`);
        setStatus(data.skillCount > 0 ? 'success' : 'error');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to check skills');
      }
    } catch (error) {
      console.error('Error checking skills:', error);
      setStatus('error');
      setMessage('Network error. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleAddTestSkills = async () => {
    setLoading(true);
    setStatus('idle');
    setMessage('');

    try {
      const response = await fetch('/api/debug/add-test-skills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(`Added ${data.skillsAdded} test skills to your profile`);
        // Refresh skills data and notify parent
        setTimeout(() => {
          handleCheckSkills();
          onSkillsImported?.();
        }, 1000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to add test skills');
      }
    } catch (error) {
      console.error('Error adding test skills:', error);
      setStatus('error');
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getButtonContent = (isLoading: boolean, defaultText: string, loadingText: string) => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText}
        </>
      );
    }
    return defaultText;
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <User className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-blue-900 mb-2">Candidate Skills Debug</h3>
          <p className="text-blue-800 text-sm mb-4">
            To see job matches, you need skills in your profile from AI interviews. 
            Use the tools below to check your current skills or add test skills for demonstration.
          </p>
          
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={handleCheckSkills}
              disabled={checking}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <Eye className="h-4 w-4" />
              {getButtonContent(checking, 'Check My Skills', 'Checking...')}
            </button>
            
            <button
              onClick={handleAddTestSkills}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              {getButtonContent(loading, 'Add Test Skills', 'Adding...')}
            </button>
          </div>

          {message && (
            <div className={`flex items-center gap-2 text-sm mb-3 ${
              status === 'success' ? 'text-green-700' : 'text-red-700'
            }`}>
              {status === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              {message}
            </div>
          )}

          {skillsData && (
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-gray-900 mb-2">Your Skills Profile</h4>
              <div className="text-sm text-gray-600 mb-3">
                <p><strong>Candidate ID:</strong> {skillsData.candidateId}</p>
                <p><strong>Skills Count:</strong> {skillsData.skillCount}</p>
              </div>
              
              {skillsData.skills && skillsData.skills.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Current Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {skillsData.skills.slice(0, 10).map((skill: any, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                      >
                        {skill.skillName} ({skill.proficiencyScore})
                      </span>
                    ))}
                    {skillsData.skills.length > 10 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        +{skillsData.skills.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}