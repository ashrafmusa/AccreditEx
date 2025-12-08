/**
 * Firebase Runtime Diagnostics
 * Logs Firebase initialization and app loading status
 * Run this in the browser console to debug initialization issues
 */

console.log('%c🔍 Firebase Runtime Diagnostics Started', 'font-size: 16px; font-weight: bold; color: #4f46e5;');
console.log('');

// Check if Firebase is available
try {
  const check = (label, condition) => {
    const icon = condition ? '✅' : '❌';
    const style = condition ? 'color: #10b981' : 'color: #ef4444';
    console.log(`%c${icon} ${label}`, `${style}; font-weight: bold;`);
    return condition;
  };

  console.log('%c1. Firebase App Initialization', 'font-size: 14px; font-weight: bold; margin-top: 10px;');
  
  // Check if window.location includes localhost:3001
  check('Running on correct port (localhost:3001)', window.location.includes('localhost:3001') || window.location.includes('127.0.0.1:3001'));
  
  // Check for Firebase in window
  check('Firebase SDK loaded', typeof window !== 'undefined');

  console.log('%c2. App State', 'font-size: 14px; font-weight: bold; margin-top: 10px;');
  
  // Check for React/zustand state
  const hasReact = typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined';
  check('React DevTools available', hasReact);

  // Check localStorage
  const hasOnboardingFlag = localStorage.getItem('accreditex-onboarding-complete');
  console.log(`   📍 Onboarding status: ${hasOnboardingFlag ? 'Completed' : 'Not completed'}`);

  console.log('%c3. Network Requests', 'font-size: 14px; font-weight: bold; margin-top: 10px;');
  console.log('   📡 Check the Network tab in DevTools for:');
  console.log('   • Failed requests to Firebase');
  console.log('   • Stuck/hanging requests');
  console.log('   • CORS errors');
  console.log('   • 403/401 authentication errors');

  console.log('%c4. What to look for if app is stuck loading:', 'font-size: 14px; font-weight: bold; color: #f59e0b; margin-top: 10px;');
  console.log('   1. Request to firestore.googleapis.com - is it stuck?');
  console.log('   2. Request to securetoken.googleapis.com - does it have CORS errors?');
  console.log('   3. Any JS console errors about Firebase?');
  console.log('   4. Is there a request to the /users endpoint that hangs?');

  console.log('%c5. Debug Commands (run these):', 'font-size: 14px; font-weight: bold; color: #3b82f6; margin-top: 10px;');
  console.log('   localStorage.getItem("accreditex-onboarding-complete") - check onboarding');
  console.log('   performance.getEntriesByType("resource") - see all loaded resources');
  console.log('   navigator.onLine - check internet connection');

  console.log('%c✅ Diagnostics console ready', 'font-size: 12px; color: #10b981; margin-top: 10px;');
} catch (error) {
  console.error('❌ Error during diagnostics:', error);
}

console.log('');
