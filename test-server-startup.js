import { spawn } from 'child_process';

// console.log removed for production

// Test with minimal environment variables
const env = {
  ...process.env,
  NODE_ENV: 'production',
  PORT: '5002',
  SESSION_SECRET: 'test-secret',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test'
};

const child = spawn('node', ['dist/server/index.js'], {
  env,
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';
let errorOutput = '';

child.stdout.on('data', (data) => {
  output += data.toString();
  console.log('STDOUT:', data.toString());
});

child.stderr.on('data', (data) => {
  errorOutput += data.toString();
  console.log('STDERR:', data.toString());
});

child.on('close', (code) => {
  // console.log removed for production
  // console.log removed for production
  // console.log removed for production
});

// Kill the process after 30 seconds
setTimeout(() => {
  child.kill();
  // console.log removed for production
}, 30000); 