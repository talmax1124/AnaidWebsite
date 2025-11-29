import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Product Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Main Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'gallery',
      title: 'Product Gallery',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'salePrice',
      title: 'Sale Price',
      type: 'number',
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'details',
      title: 'Product Details',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H1', value: 'h1' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'Quote', value: 'blockquote' },
          ],
        },
      ],
    }),
    defineField({
      name: 'ingredients',
      title: 'Ingredients',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'howToUse',
      title: 'How to Use',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'benefits',
      title: 'Benefits',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'skinType',
      title: 'Skin Type',
      type: 'string',
      options: {
        list: [
          { title: 'All Skin Types', value: 'all' },
          { title: 'Dry', value: 'dry' },
          { title: 'Oily', value: 'oily' },
          { title: 'Combination', value: 'combination' },
          { title: 'Sensitive', value: 'sensitive' },
          { title: 'Mature', value: 'mature' },
        ],
      },
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
    }),
    defineField({
      name: 'featured',
      title: 'Featured Product',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'inStock',
      title: 'In Stock',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'inventory',
      title: 'Inventory Count',
      type: 'number',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'addOns',
      title: 'Available Add-ons',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'addOn' }] }],
      description: 'Select add-ons that can be purchased with this product',
    }),
    defineField({
      name: 'recommendedProducts',
      title: 'Recommended Products',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'product' }] }],
      description: 'Products commonly bought together with this product',
      validation: (Rule) => Rule.max(6),
    }),
    defineField({
      name: 'relatedServices',
      title: 'Related Services',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'service' }] }],
      description: 'Services that complement this product',
      validation: (Rule) => Rule.max(4),
    }),
    defineField({
      name: 'applicableDiscounts',
      title: 'Applicable Discounts',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'discount' }] }],
      description: 'Specific discounts that apply to this product (in addition to general discounts)',
    }),
    defineField({
      name: 'excludeFromDiscounts',
      title: 'Exclude from Discounts',
      type: 'boolean',
      initialValue: false,
      description: 'Exclude this product from all automatic and general discounts',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      price: 'price',
      salePrice: 'salePrice',
      media: 'image',
    },
    prepare(selection) {
      const { title, price, salePrice, media } = selection
      const priceDisplay = salePrice ? `$${salePrice} (was $${price})` : `$${price}`
      return {
        title,
        subtitle: priceDisplay,
        media,
      }
    },
  },
})