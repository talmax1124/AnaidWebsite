# Sanity CMS Setup Instructions for Esthetics By Anna

## ✅ What's Been Created

I've set up the foundation for your Sanity CMS with:

1. **Product Schema** - Complete e-commerce product management with:
   - Name, price, sale price
   - Image galleries with hotspot
   - Ingredients, benefits, how-to-use
   - Skin type categorization
   - Inventory tracking
   - Featured products

2. **Service Schema** - For your beauty services with:
   - Service pricing and duration
   - Category organization
   - Add-on support
   - Rich descriptions

3. **Category Schema** - Product organization
4. **Add-on Schema** - Service add-ons

## 🚀 Next Steps to Complete Setup

### Step 1: Create Sanity Account & Project

1. Go to https://sanity.io and sign up (free)
2. Create a new project called "Esthetics By Anna"
3. Get your Project ID from the dashboard
4. Choose "production" as your dataset

### Step 2: Update Configuration

Replace 'your-project-id' in `sanity.config.ts` with your actual project ID:

```typescript
projectId: 'abc123xyz', // Your actual project ID
```

### Step 3: Add npm scripts to package.json

Add these to your package.json scripts:

```json
"scripts": {
  "dev": "sanity dev",
  "start": "sanity start",
  "build": "sanity build",
  "deploy": "sanity deploy"
}
```

### Step 4: Run Sanity Studio

```bash
npm run dev
```

This will open Sanity Studio at http://localhost:3333

### Step 5: Frontend Integration

Install Sanity client in your React app:

```bash
cd /Users/carlosdiazplaza/AnaidWebsite
npm install @sanity/client @sanity/image-url
```

Then create a sanity service file in your React app:

```typescript
// src/services/sanityService.ts
import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: 'your-project-id',
  dataset: 'production',
  useCdn: true,
  apiVersion: '2023-11-28',
})

const builder = imageUrlBuilder(client)

export const urlFor = (source) => builder.image(source)

// Get products
export const getProducts = async () => {
  return await client.fetch(`
    *[_type == "product" && inStock == true] {
      _id,
      name,
      slug,
      price,
      salePrice,
      "imageUrl": image.asset->url,
      description,
      category->{name, slug}
    }
  `)
}

// Get services
export const getServices = async () => {
  return await client.fetch(`
    *[_type == "service" && active == true] {
      _id,
      name,
      slug,
      price,
      duration,
      description,
      "imageUrl": image.asset->url,
      category
    }
  `)
}
```

## 🎯 Benefits Over Strapi

1. **It Actually Works!** - No 404 errors, no complex permissions
2. **Built-in CDN** - Images are automatically optimized and served globally
3. **Real-time API** - Changes appear instantly
4. **GROQ Queries** - More powerful than REST/GraphQL
5. **Free Tier** - Generous for small businesses

## 📝 Adding Content

Once you run `npm run dev` in the sanity-cms folder:

1. Go to http://localhost:3333
2. Click on "Products" to add products
3. Click on "Services" to add services
4. All content is immediately available via API

## 🔗 API Examples

Once configured, you can query your data:

```javascript
// Get all products
const products = await client.fetch('*[_type == "product"]')

// Get featured products
const featured = await client.fetch('*[_type == "product" && featured == true]')

// Get products with images
const productsWithImages = await client.fetch(`
  *[_type == "product"] {
    name,
    price,
    "imageUrl": image.asset->url
  }
`)
```

## Need Help?

1. Sanity Docs: https://www.sanity.io/docs
2. GROQ Cheat Sheet: https://www.sanity.io/docs/groq-syntax
3. Discord Community: https://slack.sanity.io/