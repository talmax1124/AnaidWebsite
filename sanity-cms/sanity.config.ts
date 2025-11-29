import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Esthetics By Anna',
  
  // You'll need to update these with your actual project ID and dataset
  projectId: 'rtfvvoxt', // Replace this after creating project
  dataset: 'production',
  
  plugins: [structureTool(), visionTool()],
  
  schema: {
    types: schemaTypes,
  },
})