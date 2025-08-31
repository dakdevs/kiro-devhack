"use client"

import { useEffect, useState } from 'react';

/**
 * Hook to manage CSRF tokens for secure API requests
 */
export function useCSRFToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Generate a new CSRF token
    const generateToken = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 32; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    // Check if we already have a token in cookies
    const existingToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrf-token='))
      ?.split('=')[1];

    if (existingToken) {
      setToken(existingToken);
    } else {
      // Generate new token
      const newToken = generateToken();
      
      // Set as cookie (httpOnly: false so client can read it)
      document.cookie = `csrf-token=${newToken}; path=/; secure=${window.location.protocol === 'https:'}; samesite=strict`;
      
      setToken(newToken);
    }
  }, []);

  return token;
}

/**
 * Utility function to make secure API requests with CSRF protection
 */
export async function secureApiRequest(url: string, options: RequestInit = {}) {
  // Get CSRF token from cookie
  const csrfToken = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf-token='))
    ?.split('=')[1];

  if (!csrfToken) {
    throw new Error('CSRF token not found. Please refresh the page.');
  }

  // Add CSRF token to headers
  const headers = {
    'Content-Type': 'application/json',
    'x-csrf-token': csrfToken,
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}