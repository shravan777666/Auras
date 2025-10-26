// Simple test to verify environment variables are embedded correctly
console.log('=== ENVIRONMENT VARIABLE TEST ===');
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('All VITE_ variables:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')).reduce((obj, key) => {
  obj[key] = import.meta.env[key];
  return obj;
}, {}));
console.log('================================');