// Environment variable validation for deployment
export function validateEnvironment() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
    'E2B_API_KEY',
    'OPENAI_API_KEY',
    'INNGEST_EVENT_KEY',
    'INNGEST_SIGNING_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
  }

  console.log('Environment validation passed');
}

export function logEnvironmentStatus() {
  console.log('Environment status:', {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Missing',
    CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'Set' : 'Missing',
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? 'Set' : 'Missing',
    E2B_API_KEY: process.env.E2B_API_KEY ? 'Set' : 'Missing',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Set' : 'Missing',
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY ? 'Set' : 'Missing',
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY ? 'Set' : 'Missing',
  });
}
