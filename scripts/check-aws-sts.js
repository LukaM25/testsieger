#!/usr/bin/env node
const { loadEnvConfig } = require('@next/env');
const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');

// Load .env.local and other Next-style env files into process.env
loadEnvConfig(process.cwd());

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
if (!region) {
  console.error('Missing AWS_REGION or AWS_DEFAULT_REGION env var');
  process.exit(1);
}

const credsMissing = !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY;
if (credsMissing) {
  console.error('Missing AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY env vars');
  process.exit(1);
}

const client = new STSClient({ region });
client
  .send(new GetCallerIdentityCommand({}))
  .then((res) => {
    console.log('STS OK:', {
      account: res.Account,
      userId: res.UserId,
      arn: res.Arn,
      region,
    });
    process.exit(0);
  })
  .catch((err) => {
    console.error('STS error:', err?.message || err);
    process.exit(1);
  });
