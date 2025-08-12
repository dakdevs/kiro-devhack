/**
 * Browser Compatibility Tests for Voice Input Feature
 * Tests browser detection, graceful degradation, and cross-browser functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  detectBrowser, 
  isMobileDevice, 
  checkBrowserFeatures, 
  getBrowserCompatibility,
  getUnsupportedBrowserMessage,
  isVoiceInputSupported,
  getMobileCompatibility,
  logCompatibilityInfo
} from '../utils/browserCompatibility';

// Test data for different browser environments
const testUserAgents = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  edge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  chromeMobile: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  safariMobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  unknown: 'Mozilla/5.0 (compatible; OldBrowser/1.0)'
};

// Helper to mock browser environment
function mockBrowser(userAgent: string, options: {
  speechRecognition?: boolean;
  webkitSpeechRecognition?: boolean;
  mediaDevices?: boolean;
  permissions?: boolean;
  secureContext?: boolean;
} = {}) {
  // Mock user agent
  Object.defineProperty(navigator, 'userAgent', {
    writable: true,
    configurable: true,
    value: userAgent,
  });

  // Mock APIs
  if (options.speechRecognition !== undefined) {
    Object.defineProperty(window, 'SpeechRecognition', {
      writable: true,
      configurable: true,
      value: options.speechRecognition ? vi.fn() : undefined,
    });
  }

  if (options.webkitSpeechRecognition !== undefined) {
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      writable: true,
      configurable: true,
      value: options.webkitSpeechRecognition ? vi.fn() : undefined,
    });
  }

  if (options.mediaDevices !== undefined) {
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      configurable: true,
      value: options.mediaDevices ? { getUserMedia: vi.fn() } : undefined,
    });
  }

  if (options.permissions !== undefined) {
    Object.defineProperty(navigator, 'permissions', {
      writable: true,
      configurable: true,
      value: options.permissions ? { query: vi.fn() } : undefined,
    });
  }

  if (options.secureContext !== undefined) {
    Object.defineProperty(window, 'isSecureContext', {
      writable: true,
      configurable: true,
      value: options.secureContext,
    });
  }
}

describe('Browser Compatibility Tests', () => {
  let originalUserAgent: string;
  let originalWindow: any;
  let originalNavigator: any;

  beforeEach(() => {
    // Store original values
    originalUserAgent = navigator.userAgent;
    originalWindow = {
      SpeechRecognition: window.SpeechRecognition,
      webkitSpeechRecognition: (window as any).webkitSpeechRecognition,
      isSecureContext: window.isSecureContext,
    };
    originalNavigator = {
      mediaDevices: navigator.mediaDevices,
      permissions: navigator.permissions,
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      configurable: true,
      value: originalUserAgent,
    });
    
    Object.defineProperty(window, 'SpeechRecognition', {
      writable: true,
      configurable: true,
      value: originalWindow.SpeechRecognition,
    });
    
    Object.defineProperty(window, 'webkitSpeechRecognition', {
      writable: true,
      configurable: true,
      value: originalWindow.webkitSpeechRecognition,
    });
    
    Object.defineProperty(window, 'isSecureContext', {
      writable: true,
      configurable: true,
      value: originalWindow.isSecureContext,
    });
    
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      configurable: true,
      value: originalNavigator.mediaDevices,
    });
    
    Object.defineProperty(navigator, 'permissions', {
      writable: true,
      configurable: true,
      value: originalNavigator.permissions,
    });
  });

  describe('Browser Detection', () => {
    it('should detect Chrome browser correctly', () => {
      mockBrowser(testUserAgents.chrome);
      const browser = detectBrowser();
      expect(browser.name).toBe('Chrome');
      expect(browser.version).toBe('120');
    });

    it('should detect Edge browser correctly', () => {
      mockBrowser(testUserAgents.edge);
      const browser = detectBrowser();
      expect(browser.name).toBe('Edge');
      expect(browser.version).toBe('120');
    });

    it('should detect Safari browser correctly', () => {
      mockBrowser(testUserAgents.safari);
      const browser = detectBrowser();
      expect(browser.name).toBe('Safari');
      expect(browser.version).toBe('17');
    });

    it('should detect Firefox browser correctly', () => {
      mockBrowser(testUserAgents.firefox);
      const browser = detectBrowser();
      expect(browser.name).toBe('Firefox');
      expect(browser.version).toBe('120');
    });

    it('should detect unknown browser', () => {
      mockBrowser(testUserAgents.unknown);
      const browser = detectBrowser();
      expect(browser.name).toBe('Unknown');
      expect(browser.version).toBe('unknown');
    });
  });

  describe('Mobile Device Detection', () => {
    it('should detect mobile Chrome correctly', () => {
      mockBrowser(testUserAgents.chromeMobile);
      expect(isMobileDevice()).toBe(true);
    });

    it('should detect mobile Safari correctly', () => {
      mockBrowser(testUserAgents.safariMobile);
      expect(isMobileDevice()).toBe(true);
    });

    it('should detect desktop browsers as non-mobile', () => {
      mockBrowser(testUserAgents.chrome);
      expect(isMobileDevice()).toBe(false);
    });
  });

  describe('Feature Detection', () => {
    it('should detect speech recognition support when available', () => {
      mockBrowser(testUserAgents.chrome, {
        webkitSpeechRecognition: true,
        mediaDevices: true,
        secureContext: true
      });
      
      const features = checkBrowserFeatures();
      expect(features.speechRecognition).toBe(true);
      expect(features.mediaDevices).toBe(true);
      expect(features.secureContext).toBe(true);
    });

    it('should detect lack of speech recognition support', () => {
      mockBrowser(testUserAgents.firefox, {
        speechRecognition: false,
        webkitSpeechRecognition: false,
        mediaDevices: true,
        secureContext: true
      });
      
      const features = checkBrowserFeatures();
      expect(features.speechRecognition).toBe(false);
      expect(features.mediaDevices).toBe(true);
      expect(features.secureContext).toBe(true);
    });

    it('should detect insecure context', () => {
      // Mock location for insecure context
      const originalLocation = global.location;
      delete (global as any).location;
      global.location = {
        protocol: 'http:',
        hostname: 'example.com'
      } as any;
      
      mockBrowser(testUserAgents.chrome, {
        webkitSpeechRecognition: true,
        mediaDevices: true,
        secureContext: false
      });
      
      const features = checkBrowserFeatures();
      expect(features.secureContext).toBe(false);
      
      // Restore location
      global.location = originalLocation;
    });

    it('should detect missing MediaDevices API', () => {
      mockBrowser(testUserAgents.chrome, {
        webkitSpeechRecognition: true,
        mediaDevices: false,
        secureContext: true
      });
      
      const features = checkBrowserFeatures();
      expect(features.mediaDevices).toBe(false);
    });
  });

  describe('Browser Compatibility Assessment', () => {
    it('should assess Chrome as fully supported', () => {
      mockBrowser(testUserAgents.chrome, {
        webkitSpeechRecognition: true,
        mediaDevices: true,
        permissions: true,
        secureContext: true
      });
      
      const compatibility = getBrowserCompatibility();
      expect(compatibility.name).toBe('Chrome');
      expect(compatibility.isSupported).toBe(true);
      expect(compatibility.supportLevel).toBe('full');
      expect(compatibility.recommendedBrowsers).toContain('Chrome');
    });

    it('should assess Firefox as unsupported', () => {
      mockBrowser(testUserAgents.firefox, {
        speechRecognition: false,
        webkitSpeechRecognition: false,
        mediaDevices: true,
        permissions: true,
        secureContext: true
      });
      
      const compatibility = getBrowserCompatibility();
      expect(compatibility.name).toBe('Firefox');
      expect(compatibility.isSupported).toBe(false);
      expect(compatibility.supportLevel).toBe('none');
      expect(compatibility.limitations).toContain('No Web Speech API support');
    });

    it('should assess Safari mobile as fully supported', () => {
      mockBrowser(testUserAgents.safariMobile, {
        speechRecognition: true,
        mediaDevices: true,
        permissions: true,
        secureContext: true
      });
      
      const compatibility = getBrowserCompatibility();
      expect(compatibility.name).toBe('Safari');
      expect(compatibility.isSupported).toBe(true);
      expect(compatibility.supportLevel).toBe('full');
    });

    it('should handle insecure context appropriately', () => {
      // Mock location for insecure context
      const originalLocation = global.location;
      delete (global as any).location;
      global.location = {
        protocol: 'http:',
        hostname: 'example.com'
      } as any;
      
      mockBrowser(testUserAgents.chrome, {
        webkitSpeechRecognition: true,
        mediaDevices: true,
        permissions: true,
        secureContext: false
      });
      
      const compatibility = getBrowserCompatibility();
      expect(compatibility.supportLevel).toBe('partial');
      
      // Restore location
      global.location = originalLocation;
    });
  });

  describe('Error Messages and Guidance', () => {
    it('should provide appropriate error message for unsupported browsers', () => {
      mockBrowser(testUserAgents.firefox, {
        speechRecognition: false,
        webkitSpeechRecognition: false,
        mediaDevices: true,
        secureContext: true
      });
      
      const browserInfo = getBrowserCompatibility();
      const message = getUnsupportedBrowserMessage(browserInfo);
      
      expect(message).toContain('Voice input is not supported in Firefox');
      expect(message).toContain('Chrome');
      expect(message).toContain('Edge');
      expect(message).toContain('Safari');
    });

    it('should provide guidance for insecure context', () => {
      // Mock location for insecure context
      const originalLocation = global.location;
      delete (global as any).location;
      global.location = {
        protocol: 'http:',
        hostname: 'example.com'
      } as any;
      
      mockBrowser(testUserAgents.chrome, {
        webkitSpeechRecognition: true,
        mediaDevices: true,
        secureContext: false
      });
      
      const browserInfo = getBrowserCompatibility();
      expect(browserInfo.guidance).toContain('HTTPS');
      
      // Restore location
      global.location = originalLocation;
    });

    it('should provide specific guidance for Safari desktop', () => {
      mockBrowser(testUserAgents.safari, {
        speechRecognition: true,
        mediaDevices: true,
        secureContext: true
      });
      
      const browserInfo = getBrowserCompatibility();
      if (browserInfo.supportLevel === 'partial') {
        expect(browserInfo.guidance).toContain('Safari desktop has limited');
      }
    });
  });

  describe('Voice Input Support Assessment', () => {
    it('should correctly assess voice input support when all features are available', () => {
      mockBrowser(testUserAgents.chrome, {
        webkitSpeechRecognition: true,
        mediaDevices: true,
        secureContext: true
      });
      
      expect(isVoiceInputSupported()).toBe(true);
    });

    it('should correctly assess lack of support when speech recognition is missing', () => {
      mockBrowser(testUserAgents.firefox, {
        speechRecognition: false,
        webkitSpeechRecognition: false,
        mediaDevices: true,
        secureContext: true
      });
      
      expect(isVoiceInputSupported()).toBe(false);
    });

    it('should correctly assess lack of support in insecure context', () => {
      // Mock location for insecure context
      const originalLocation = global.location;
      delete (global as any).location;
      global.location = {
        protocol: 'http:',
        hostname: 'example.com'
      } as any;
      
      mockBrowser(testUserAgents.chrome, {
        webkitSpeechRecognition: true,
        mediaDevices: true,
        secureContext: false
      });
      
      expect(isVoiceInputSupported()).toBe(false);
      
      // Restore location
      global.location = originalLocation;
    });

    it('should correctly assess lack of support when MediaDevices is missing', () => {
      mockBrowser(testUserAgents.chrome, {
        webkitSpeechRecognition: true,
        mediaDevices: false,
        secureContext: true
      });
      
      expect(isVoiceInputSupported()).toBe(false);
    });
  });

  describe('Mobile Compatibility', () => {
    it('should provide mobile-specific compatibility information', () => {
      mockBrowser(testUserAgents.chromeMobile, {
        webkitSpeechRecognition: true,
        mediaDevices: true,
        secureContext: true
      });
      
      const mobileCompat = getMobileCompatibility();
      expect(mobileCompat.isSupported).toBe(true);
      expect(mobileCompat.recommendations).toContain('Chrome for Android provides excellent voice input support');
    });

    it('should handle Firefox mobile limitations', () => {
      // Use a proper Firefox mobile user agent that will be detected as mobile
      mockBrowser('Mozilla/5.0 (Android 10; Mobile; rv:120.0) Gecko/120.0 Firefox/120.0', {
        speechRecognition: false,
        webkitSpeechRecognition: false,
        mediaDevices: true,
        secureContext: true
      });
      
      // Verify it's detected as mobile
      expect(isMobileDevice()).toBe(true);
      
      const mobileCompat = getMobileCompatibility();
      expect(mobileCompat.isSupported).toBe(false);
      // Check that we have some limitations and recommendations
      expect(mobileCompat.limitations.length).toBeGreaterThan(0);
      expect(mobileCompat.recommendations.length).toBeGreaterThan(0);
    });

    it('should provide Safari iOS recommendations', () => {
      mockBrowser(testUserAgents.safariMobile, {
        speechRecognition: true,
        mediaDevices: true,
        secureContext: true
      });
      
      const mobileCompat = getMobileCompatibility();
      expect(mobileCompat.isSupported).toBe(true);
      // Check that we have recommendations for Safari iOS
      expect(mobileCompat.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Utility Functions', () => {
    it('should log compatibility information without errors', () => {
      mockBrowser(testUserAgents.chrome, {
        webkitSpeechRecognition: true,
        mediaDevices: true,
        permissions: true,
        secureContext: true
      });
      
      // Mock console methods
      const consoleSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
      
      expect(() => logCompatibilityInfo()).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleGroupEndSpy).toHaveBeenCalled();
      
      // Restore console methods
      consoleSpy.mockRestore();
      consoleLogSpy.mockRestore();
      consoleGroupEndSpy.mockRestore();
    });

    it('should handle edge cases in browser detection', () => {
      // Test with empty user agent
      mockBrowser('');
      const browser = detectBrowser();
      expect(browser.name).toBe('Unknown');
      expect(browser.version).toBe('unknown');
    });

    it('should handle missing APIs gracefully', () => {
      // Mock location for insecure context
      const originalLocation = global.location;
      delete (global as any).location;
      global.location = {
        protocol: 'http:',
        hostname: 'example.com'
      } as any;
      
      mockBrowser(testUserAgents.chrome, {
        speechRecognition: false,
        webkitSpeechRecognition: false,
        mediaDevices: false,
        permissions: false,
        secureContext: false
      });
      
      const features = checkBrowserFeatures();
      expect(features.speechRecognition).toBe(false);
      expect(features.mediaDevices).toBe(false);
      expect(features.permissions).toBe(false);
      expect(features.secureContext).toBe(false);
      
      const compatibility = getBrowserCompatibility();
      expect(compatibility.isSupported).toBe(false);
      expect(compatibility.supportLevel).toBe('none');
      
      // Restore location
      global.location = originalLocation;
    });
  });
});