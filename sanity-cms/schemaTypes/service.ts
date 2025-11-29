import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Service Name',
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
      title: 'Service Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'duration',
      title: 'Duration (minutes)',
      type: 'number',
      validation: (Rule) => Rule.positive(),
    }),
    defineField({
      name: 'description',
      title: 'Short Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'fullDescription',
      title: 'Full Description',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'Quote', value: 'blockquote' },
          ],
        },
      ],
    }),
    defineField({
      name: 'benefits',
      title: 'Benefits',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'category',
      title: 'Service Category',
      type: 'string',
      options: {
        list: [
          { title: 'Facial Treatments', value: 'facial' },
          { title: 'Body Treatments', value: 'body' },
          { title: 'Waxing', value: 'waxing' },
          { title: 'Lashes & Brows', value: 'lashes-brows' },
          { title: 'Special Treatments', value: 'special' },
        ],
      },
    }),
    defineField({
      name: 'addOns',
      title: 'Available Add-ons',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'addOn' }] }],
    }),
    defineField({
      name: 'featured',
      title: 'Featured Service',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'recommendedProducts',
      title: 'Recommended Products',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'product' }] }],
      description: 'Products to recommend for aftercare or enhancement',
      validation: (Rule) => Rule.max(6),
    }),
    defineField({
      name: 'applicableDiscounts',
      title: 'Applicable Discounts',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'discount' }] }],
      description: 'Specific discounts that apply to this service (in addition to general discounts)',
    }),
    defineField({
      name: 'excludeFromDiscounts',
      title: 'Exclude from Discounts',
      type: 'boolean',
      initialValue: false,
      description: 'Exclude this service from all automatic and general discounts',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      price: 'price',
      duration: 'duration',
      media: 'image',
    },
    prepare(selection) {
      const { title, price, duration, media } = selection
      const subtitle = `$${price} • ${duration} min`
      return {
        title,
        subtitle,
        media,
      }
    },
  },
})