// Simple test to verify imports work correctly
import { nanoid } from 'nanoid';
import { cn } from './src/lib/utils.js';

console.log('Testing imports...');
console.log('nanoid():', nanoid());
console.log('cn("test", "class"):', cn("test", "class"));
console.log('All imports working correctly!');