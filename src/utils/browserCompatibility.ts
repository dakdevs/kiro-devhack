/**
 * Browser Compatibility Detection Utilities
 * Detects browser capabilities and provides appropriate fallback messaging
 */

export interface BrowserInfo {
  name: string;
  version: string;
  isSupported: boolean;
  supportLevel: 'full' | 'partial' | 'none';
  recommendedBrowsers: string[];
  limitations?: string[];
  guidance?: string;
}

export interface CompatibilityFeatures {
  speechRecognition: boolean;
  mediaDevices: boolean;
  permissions: boolean;
  secureContext: boolean;
}

/**
 * Detect current browser and version
 */
export function detectBrowser(): { name: string; version: string } {
  // Return default if running on server side
  if (typeof navigator === 'undefined') {
    return { name: 'Unknown', version: 'unknown' };
  }
  
  const userAgent = navigator.userAgent;
  
  // Brave (appears as Chrome but has different behavior)
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    // Check if it's Brave browser (only available in browser context)
    const isBrave = typeof window !== 'undefined' && (navigator as any).brave && (navigator as any).brave.isBrave;
    if (isBrave) {
      const match = userAgent.match(/Chrome\/(\d+)/);
      return { name: 'Brave', version: match ? match[1] : 'unknown' };
    }
    
    // Regular Chrome
    const match = userAgent.match(/Chrome\/(\d+)/);
    return { name: 'Chrome', version: match ? match[1] : 'unknown' };
  }
  
  // Edge
  if (userAgent.includes('Edg')) {
    const match = userAgent.match(/Edg\/(\d+)/);
    return { name: 'Edge', version: match ? match[1] : 'unknown' };
  }
  
  // Safari
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    const match = userAgent.match(/Version\/(\d+)/);
    return { name: 'Safari', version: match ? match[1] : 'unknown' };
  }
  
  // Firefox
  if (userAgent.includes('Firefox')) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    return { name: 'Firefox', version: match ? match[1] : 'unknown' };
  }
  
  // Opera
  if (userAgent.includes('OPR')) {
    const match = userAgent.match(/OPR\/(\d+)/);
    return { name: 'Opera', version: match ? match[1] : 'unknown' };
  }
  
  return { name: 'Unknown', version: 'unknown' };
}

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
  // Return false if running on server side
  if (typeof navigator === 'undefined') {
    return false;
  }
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Check available browser features
 */
export function checkBrowserFeatures(): CompatibilityFeatures {
  // Return default values if running on server side
  if (typeof window === 'undefined') {
    return {
      speechRecognition: false,
      mediaDevices: false,
      permissions: false,
      secureContext: false
    };
  }

  return {
    speechRecognition: !!(
      window.SpeechRecognition || 
      (window as any).webkitSpeechRecognition
    ),
    mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    permissions: !!(navigator.permissions && navigator.permissions.query),
    secureContext: !!(
      window.isSecureContext || 
      (typeof location !== 'undefined' && (
        location.protocol === 'https:' || 
        location.hostname === 'localhost'
      ))
    )
  };
}

/**
 * Get comprehensive browser compatibility information
 */
export function getBrowserCompatibility(): BrowserInfo {
  const browser = detectBrowser();
  const features = checkBrowserFeatures();
  const isMobile = isMobileDevice();
  
  // Define browser support levels
  const browserSupport: Record<string, { 
    supportLevel: 'full' | 'partial' | 'none';
    limitations?: string[];
    minVersion?: number;
  }> = {
    Chrome: { 
      supportLevel: 'full',
      minVersion: 25
    },
    Brave: { 
      supportLevel: 'full',
      limitations: ['May require additional privacy settings'],
      minVersion: 25
    },
    Edge: { 
      supportLevel: 'full',
      minVersion: 79
    },
    Safari: { 
      supportLevel: isMobile ? 'full' : 'partial',
      limitations: isMobile ? [] : ['Limited desktop support', 'May require user interaction'],
      minVersion: 14
    },
    Firefox: { 
      supportLevel: 'none',
      limitations: ['No Web Speech API support', 'Feature not implemented']
    },
    Opera: { 
      supportLevel: 'partial',
      limitations: ['Limited support', 'May have compatibility issues'],
      minVersion: 27
    }
  };
  
  const support = browserSupport[browser.name] || { supportLevel: 'none' as const };
  const version = parseInt(browser.version);
  
  // Check version requirements
  let isSupported = features.speechRecognition;
  if (support.minVersion && !isNaN(version) && version < support.minVersion) {
    isSupported = false;
  }
  
  // Override support based on actual feature detection
  if (!features.speechRecognition) {
    isSupported = false;
  }
  
  // Determine support level
  let supportLevel = support.supportLevel;
  if (!isSupported) {
    supportLevel = 'none';
  } else if (!features.mediaDevices || !features.secureContext) {
    supportLevel = 'partial';
  }
  
  // Generate recommendations
  const recommendedBrowsers = ['Chrome', 'Edge'];
  if (isMobile) {
    recommendedBrowsers.push('Safari (iOS)', 'Chrome (Android)');
  } else {
    recommendedBrowsers.push('Safari (macOS)');
  }
  
  // Generate guidance message
  let guidance = '';
  if (!isSupported) {
    if (browser.name === 'Firefox') {
      guidance = 'Firefox does not support the Web Speech API. Please use Chrome, Edge, or Safari for voice input functionality.';
    } else if (!features.secureContext) {
      guidance = 'Voice input requires a secure connection (HTTPS). Please access this page over HTTPS to enable voice input.';
    } else if (!features.mediaDevices) {
      guidance = 'Your browser does not support microphone access. Please update to a newer version or use a supported browser.';
    } else {
      guidance = `Voice input is not supported in ${browser.name}. Please use Chrome, Edge, or Safari for the best experience.`;
    }
  } else if (supportLevel === 'partial') {
    if (browser.name === 'Safari' && !isMobile) {
      guidance = 'Safari desktop has limited voice input support. For the best experience, use Chrome or Edge, or try Safari on iOS.';
    } else if (!features.secureContext) {
      guidance = 'Voice input works better over HTTPS. Some features may be limited on non-secure connections.';
    } else {
      guidance = 'Voice input is partially supported. Some features may not work as expected.';
    }
  }
  
  return {
    name: browser.name,
    version: browser.version,
    isSupported,
    supportLevel,
    recommendedBrowsers,
    limitations: support.limitations,
    guidance
  };
}

/**
 * Get user-friendly error message for unsupported browsers
 */
export function getUnsupportedBrowserMessage(browserInfo?: BrowserInfo): string {
  if (!browserInfo) {
    browserInfo = getBrowserCompatibility();
  }
  
  if (browserInfo.isSupported) {
    return '';
  }
  
  const { name, recommendedBrowsers, guidance } = browserInfo;
  
  let message = `Voice input is not supported in ${name}.`;
  
  if (guidance) {
    message += `\n\n${guidance}`;
  } else {
    message += `\n\nFor voice input functionality, please use one of these browsers:\n• ${recommendedBrowsers.join('\n• ')}`;
  }
  
  return message;
}

/**
 * Check if current environment supports voice input
 */
export function isVoiceInputSupported(): boolean {
  // Return false if running on server side
  if (typeof window === 'undefined') {
    return false;
  }
  
  const features = checkBrowserFeatures();
  return features.speechRecognition && features.mediaDevices && features.secureContext;
}

/**
 * Get mobile-specific compatibility information
 */
export function getMobileCompatibility(): {
  isSupported: boolean;
  limitations: string[];
  recommendations: string[];
} {
  if (!isMobileDevice()) {
    return { isSupported: false, limitations: [], recommendations: [] };
  }
  
  const browser = detectBrowser();
  const features = checkBrowserFeatures();
  
  const limitations: string[] = [];
  const recommendations: string[] = [];
  
  if (!features.speechRecognition) {
    limitations.push('Web Speech API not available');
    recommendations.push('Update to the latest browser version');
  }
  
  if (!features.secureContext) {
    limitations.push('Requires secure connection (HTTPS)');
    recommendations.push('Access the site over HTTPS');
  }
  
  // Browser-specific mobile limitations
  if (browser.name === 'Safari') {
    recommendations.push('Ensure iOS 14.5 or later for best compatibility');
  } else if (browser.name === 'Chrome') {
    recommendations.push('Chrome for Android provides excellent voice input support');
  } else if (browser.name === 'Firefox') {
    limitations.push('Firefox mobile does not support Web Speech API');
    recommendations.push('Use Chrome or Safari for voice input');
  }
  
  return {
    isSupported: features.speechRecognition && features.secureContext,
    limitations,
    recommendations
  };
}

/**
 * Log browser compatibility information for debugging
 */
export function logCompatibilityInfo(): void {
  const browserInfo = getBrowserCompatibility();
  const features = checkBrowserFeatures();
  const mobile = getMobileCompatibility();
  
  console.group('🎤 Voice Input Browser Compatibility');
  console.log('Browser:', browserInfo.name, browserInfo.version);
  console.log('Support Level:', browserInfo.supportLevel);
  console.log('Is Supported:', browserInfo.isSupported);
  console.log('Is Mobile:', isMobileDevice());
  
  console.group('Features');
  console.log('Speech Recognition:', features.speechRecognition);
  console.log('Media Devices:', features.mediaDevices);
  console.log('Permissions API:', features.permissions);
  console.log('Secure Context:', features.secureContext);
  console.groupEnd();
  
  if (browserInfo.limitations && browserInfo.limitations.length > 0) {
    console.group('Limitations');
    browserInfo.limitations.forEach(limitation => console.log('•', limitation));
    console.groupEnd();
  }
  
  if (browserInfo.guidance) {
    console.log('Guidance:', browserInfo.guidance);
  }
  
  if (isMobileDevice()) {
    console.group('Mobile Compatibility');
    console.log('Supported:', mobile.isSupported);
    if (mobile.limitations.length > 0) {
      console.log('Limitations:', mobile.limitations);
    }
    if (mobile.recommendations.length > 0) {
      console.log('Recommendations:', mobile.recommendations);
    }
    console.groupEnd();
  }
  
  console.groupEnd();
}