import { describe, it, expect } from 'vitest';
import { vectorToString, stringToVector } from '~/db/vector-utils';

describe('Vector Utilities', () => {
  describe('vectorToString', () => {
    it('should convert number array to pgvector string format', () => {
      const vector = [0.1, 0.2, -0.3, 0.0];
      const result = vectorToString(vector);
      expect(result).toBe('[0.1,0.2,-0.3,0]');
    });

    it('should handle empty vector', () => {
      const vector: number[] = [];
      const result = vectorToString(vector);
      expect(result).toBe('[]');
    });

    it('should handle single element vector', () => {
      const vector = [0.5];
      const result = vectorToString(vector);
      expect(result).toBe('[0.5]');
    });

    it('should handle large vectors', () => {
      const vector = new Array(2560).fill(0.1);
      const result = vectorToString(vector);
      expect(result).toMatch(/^\[0\.1(,0\.1)*\]$/);
      expect(result.split(',').length).toBe(2560);
    });

    it('should handle scientific notation', () => {
      const vector = [1e-5, 1e5, -1e-10];
      const result = vectorToString(vector);
      expect(result).toBe('[0.00001,100000,-1e-10]');
    });
  });

  describe('stringToVector', () => {
    it('should convert pgvector string to number array', () => {
      const vectorString = '[0.1,0.2,-0.3,0]';
      const result = stringToVector(vectorString);
      expect(result).toEqual([0.1, 0.2, -0.3, 0]);
    });

    it('should handle empty vector string', () => {
      const vectorString = '[]';
      const result = stringToVector(vectorString);
      expect(result).toEqual([]);
    });

    it('should handle single element vector string', () => {
      const vectorString = '[0.5]';
      const result = stringToVector(vectorString);
      expect(result).toEqual([0.5]);
    });

    it('should handle scientific notation in string', () => {
      const vectorString = '[1e-5,1e5,-1e-10]';
      const result = stringToVector(vectorString);
      expect(result).toEqual([0.00001, 100000, -1e-10]);
    });

    it('should throw error for invalid format', () => {
      expect(() => stringToVector('invalid')).toThrow('Invalid vector string format');
      expect(() => stringToVector('[1,2,3')).toThrow('Invalid vector string format');
      expect(() => stringToVector('1,2,3]')).toThrow('Invalid vector string format');
      expect(() => stringToVector('[1,2,abc]')).toThrow('Invalid vector string format');
    });

    it('should handle whitespace in vector string', () => {
      const vectorString = '[ 0.1 , 0.2 , -0.3 ]';
      const result = stringToVector(vectorString);
      expect(result).toEqual([0.1, 0.2, -0.3]);
    });
  });

  describe('round-trip conversion', () => {
    it('should maintain precision through round-trip conversion', () => {
      const originalVector = [0.123456789, -0.987654321, 0.0, 1.0];
      const vectorString = vectorToString(originalVector);
      const convertedVector = stringToVector(vectorString);
      
      expect(convertedVector).toHaveLength(originalVector.length);
      convertedVector.forEach((value, index) => {
        expect(value).toBeCloseTo(originalVector[index], 10);
      });
    });

    it('should handle large vectors in round-trip', () => {
      const originalVector = Array.from({ length: 100 }, (_, i) => Math.sin(i) * 0.5);
      const vectorString = vectorToString(originalVector);
      const convertedVector = stringToVector(vectorString);
      
      expect(convertedVector).toHaveLength(originalVector.length);
      convertedVector.forEach((value, index) => {
        expect(value).toBeCloseTo(originalVector[index], 10);
      });
    });
  });
});