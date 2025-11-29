const { createClient } = require('@sanity/client');

const projectId = process.env.SANITY_PROJECT_ID || 'rtfvvoxt';
const dataset = process.env.SANITY_DATASET || 'production';
const apiVersion = process.env.SANITY_API_VERSION || '2023-11-28';
const token = process.env.SANITY_API_TOKEN;

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token
});

module.exports = client;
