import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'addOn',
  title: 'Add-on',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Add-on Name',
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
      name: 'price',
      title: 'Price',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'detailedDescription',
      title: 'Detailed Description',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H3', value: 'h3' },
            { title: 'Quote', value: 'blockquote' },
          ],
        },
      ],
    }),
    defineField({
      name: 'category',
      title: 'Add-on Category',
      type: 'string',
      options: {
        list: [
          { title: 'Service Enhancement', value: 'service-enhancement' },
          { title: 'Product Bundle', value: 'product-bundle' },
          { title: 'Aftercare Product', value: 'aftercare' },
          { title: 'Extended Treatment', value: 'extended-treatment' },
          { title: 'Premium Service', value: 'premium-service' },
        ],
      },
    }),
    defineField({
      name: 'applicableToProducts',
      title: 'Can be added to Products',
      type: 'boolean',
      initialValue: false,
      description: 'Check if this add-on can be applied to products',
    }),
    defineField({
      name: 'applicableToServices',
      title: 'Can be added to Services',
      type: 'boolean',
      initialValue: true,
      description: 'Check if this add-on can be applied to services',
    }),
    defineField({
      name: 'compatibleProducts',
      title: 'Compatible Products',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'product' }] }],
      description: 'Select specific products this add-on works with (leave empty for all products)',
      hidden: ({ document }) => !document?.applicableToProducts,
    }),
    defineField({
      name: 'compatibleServices',
      title: 'Compatible Services',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'service' }] }],
      description: 'Select specific services this add-on works with (leave empty for all services)',
      hidden: ({ document }) => !document?.applicableToServices,
    }),
    defineField({
      name: 'duration',
      title: 'Additional Duration (minutes)',
      type: 'number',
      description: 'Extra time this add-on adds to a service (for service add-ons)',
      validation: (Rule) => Rule.min(0),
      hidden: ({ document }) => !document?.applicableToServices,
    }),
    defineField({
      name: 'image',
      title: 'Add-on Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'featured',
      title: 'Featured Add-on',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      price: 'price',
      active: 'active',
      category: 'category',
      applicableToProducts: 'applicableToProducts',
      applicableToServices: 'applicableToServices',
      media: 'image',
    },
    prepare(selection) {
      const { title, price, active, category, applicableToProducts, applicableToServices, media } = selection
      const applicability = []
      if (applicableToProducts) applicability.push('Products')
      if (applicableToServices) applicability.push('Services')
      
      const subtitle = `$${price} • ${applicability.join(' & ') || 'No targets'} ${!active ? '(Inactive)' : ''}`
      return {
        title,
        subtitle,
        media,
      }
    },
  },
})