"use client";

import { useState } from 'react';

export default function TestValidationPage() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);

  const testValidation = async () => {
    try {
      const response = await fetch('/api/test-validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : String(error) });
    }
  };

  const testGreenhouseText = () => {
    setText(`Senior Software Engineer, Data Experience

Our mission at Greenhouse is to make every company great at hiring – so we go to great lengths to hire great people because we believe that they're the foundation of our success. At Greenhouse, you'll join a team that collaborates purposefully, fosters inclusivity, and communicates with transparency and accountability so we can help companies measurably improve the way they hire.

Join us to do the best work of your career, solving meaningful problems with remarkable teams.

Greenhouse is searching for a Senior Software Engineer to join our team!

As a member of the Data Experience team, you will actively contribute to a swift software release cycle and the overall success of Greenhouse. Our Data Experience team owns our Reporting capabilities in Greenhouse Recruiting. You'll lead key projects, provide technical guidance, collaborate with product and design, and mentor junior engineers, directly contributing to the growth and evolution of our platform.

Who will love this job:
- A mentor - you're passionate about guiding and developing your peers
- A doer – you're driven to get things done, act with agility
- A problem solver – you think about the bigger picture, connect the dots
- An excellent communicator – you have a knack for explaining technical processes

What you'll do:
- Collaborate closely with Product Managers and Designers
- Lead the planning and execution of projects
- Contribute across the entire software development lifecycle
- Develop clean, efficient, maintainable, and scalable production code
- Work cross-functionally with engineering teams
- Mentor and guide junior and mid-level engineers

You should have:
- 5+ years experience in writing production code
- Experience leading or owning projects
- Experience with Ruby, C#, Java, or Python
- Strong understanding of Javascript or Typescript fundamentals
- Experience working in the full stack
- REST/web development experience`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Test Text Validation</h1>
      
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Text to validate:</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Enter text to test validation..."
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={testValidation}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Validation
          </button>
          
          <button
            onClick={testGreenhouseText}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Use Greenhouse Example
          </button>
        </div>
      </div>

      {result && (
        <div className={`px-4 py-3 rounded mb-4 ${
          result.error ? 'bg-red-100 border border-red-400 text-red-700' : 'bg-green-100 border border-green-400 text-green-700'
        }`}>
          <h3 className="font-bold">Result:</h3>
          <pre className="whitespace-pre-wrap text-sm mt-2">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}