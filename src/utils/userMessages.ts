export const USER_FRIENDLY_ERRORS: Record<string, string> = {
  // Authentication errors
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/too-many-requests': 'Too many failed login attempts. Please wait a few minutes and try again.',
  'auth/email-already-in-use': 'This email address is already registered.',
  'auth/weak-password': 'Password should be at least 6 characters long.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
  
  // Firestore errors
  'firestore/permission-denied': 'You do not have permission to perform this action.',
  'firestore/not-found': 'The requested item could not be found.',
  'firestore/already-exists': 'This item already exists.',
  'firestore/resource-exhausted': 'Too many requests. Please slow down and try again.',
  'firestore/unauthenticated': 'Please log in to continue.',
  'firestore/unavailable': 'Service temporarily unavailable. Please try again in a moment.',
  
  // Storage errors
  'storage/unauthorized': 'You do not have permission to access this file.',
  'storage/object-not-found': 'File not found.',
  'storage/quota-exceeded': 'Storage quota exceeded. Please contact support.',
  'storage/unauthenticated': 'Please log in to upload files.',
  'storage/retry-limit-exceeded': 'Upload failed after multiple attempts. Please try again later.',
  
  // Network errors
  'network/timeout': 'Request timed out. Please check your connection and try again.',
  'network/offline': 'You appear to be offline. Please check your internet connection.',
  
  // Validation errors
  'validation/required-field': 'This field is required.',
  'validation/invalid-format': 'Please enter a valid value.',
  'validation/too-short': 'Value is too short.',
  'validation/too-long': 'Value is too long.',
  
  // Generic fallback
  'unknown': 'An unexpected error occurred. Please try again.',
};

export const SUCCESS_MESSAGES: Record<string, string> = {
  'project/created': 'Project created successfully!',
  'project/updated': 'Project updated successfully!',
  'project/deleted': 'Project deleted successfully!',
  'document/uploaded': 'Document uploaded successfully!',
  'document/deleted': 'Document deleted successfully!',
  'user/created': 'User created successfully!',
  'user/updated': 'User profile updated successfully!',
  'settings/saved': 'Settings saved successfully!',
  'training/completed': 'Training completed successfully!',
  'survey/submitted': 'Survey submitted successfully!',
};

export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return USER_FRIENDLY_ERRORS[error] || error;
  }
  
  if (error instanceof Error) {
    const errorCode = (error as { code?: string }).code;
    if (errorCode && USER_FRIENDLY_ERRORS[errorCode]) {
      return USER_FRIENDLY_ERRORS[errorCode];
    }
    
    // Check message patterns
    const message = error.message.toLowerCase();
    if (message.includes('network')) {
      return USER_FRIENDLY_ERRORS['network/offline'];
    }
    if (message.includes('timeout')) {
      return USER_FRIENDLY_ERRORS['network/timeout'];
    }
    if (message.includes('permission')) {
      return USER_FRIENDLY_ERRORS['firestore/permission-denied'];
    }
    
    return error.message;
  }
  
  return USER_FRIENDLY_ERRORS['unknown'];
}

export function getSuccessMessage(action: string): string {
  return SUCCESS_MESSAGES[action] || 'Action completed successfully!';
}
