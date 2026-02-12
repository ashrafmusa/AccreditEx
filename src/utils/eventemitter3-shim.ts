/**
 * Compatibility shim for eventemitter3
 * 
 * Problem: eventemitter3's index.mjs imports from index.js (CommonJS) but Vite
 * has issues with the CommonJS to ESM conversion, causing "does not provide 
 * an export named 'default'" error.
 * 
 * Solution: Import the entire module and extract the EventEmitter class,
 * then re-export both as default and named exports for maximum compatibility.
 */

// Create a direct re-export wrapper
// The actual eventemitter3 package will be resolved by Node's module system
// We just need to ensure both default and named exports are available
export { default } from 'eventemitter3';
export { default as EventEmitter } from 'eventemitter3';
