// Test file to check what API URL is being used
console.log('VITE_API_URL from import.meta.env:', import.meta.env.VITE_API_URL);
console.log('Full URL that should be used:', `${import.meta.env.VITE_API_URL || 'http://localhost:5011/api'}/auth/login`);