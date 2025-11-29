import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'discount',
  title: 'Discount',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Discount Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
      description: 'Internal name for the discount',
    }),
    defineField({
      name: 'code',
      title: 'Discount Code',
      type: 'string',
      validation: (Rule) => Rule.required().min(3).max(20).uppercase(),
      description: 'The code customers will enter (automatically converted to uppercase)',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
      description: 'Description of what this discount offers',
    }),
    defineField({
      name: 'type',
      title: 'Discount Type',
      type: 'string',
      options: {
        list: [
          { title: 'Percentage Off', value: 'percentage' },
          { title: 'Fixed Amount Off', value: 'fixed' },
          { title: 'Free Shipping', value: 'free_shipping' },
          { title: 'Buy X Get Y Free', value: 'bxgy' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'value',
      title: 'Discount Value',
      type: 'number',
      validation: (Rule) => Rule.required().positive(),
      description: 'Percentage (0-100) or fixed amount in dollars',
    }),
    defineField({
      name: 'minimumOrderValue',
      title: 'Minimum Order Value',
      type: 'number',
      description: 'Minimum purchase amount required to use this discount',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'maximumDiscount',
      title: 'Maximum Discount Amount',
      type: 'number',
      description: 'Maximum discount amount for percentage-based discounts',
      validation: (Rule) => Rule.min(0),
      hidden: ({ document }) => document?.type !== 'percentage',
    }),
    defineField({
      name: 'applicableTo',
      title: 'Applies To',
      type: 'string',
      options: {
        list: [
          { title: 'All Products & Services', value: 'all' },
          { title: 'Products Only', value: 'products' },
          { title: 'Services Only', value: 'services' },
          { title: 'Specific Items', value: 'specific' },
          { title: 'Categories', value: 'categories' },
        ],
      },
      initialValue: 'all',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'specificProducts',
      title: 'Specific Products',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'product' }] }],
      description: 'Select specific products this discount applies to',
      hidden: ({ document }) => document?.applicableTo !== 'specific',
    }),
    defineField({
      name: 'specificServices',
      title: 'Specific Services',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'service' }] }],
      description: 'Select specific services this discount applies to',
      hidden: ({ document }) => document?.applicableTo !== 'specific',
    }),
    defineField({
      name: 'categories',
      title: 'Product Categories',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
      description: 'Select product categories this discount applies to',
      hidden: ({ document }) => document?.applicableTo !== 'categories',
    }),
    defineField({
      name: 'serviceCategories',
      title: 'Service Categories',
      type: 'array',
      of: [{ 
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
      }],
      description: 'Select service categories this discount applies to',
      hidden: ({ document }) => document?.applicableTo !== 'categories',
    }),
    defineField({
      name: 'validFrom',
      title: 'Valid From',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: 'validUntil',
      title: 'Valid Until',
      type: 'datetime',
      validation: (Rule) => Rule.min(Rule.valueOfField('validFrom')),
      description: 'Leave empty for no expiration date',
    }),
    defineField({
      name: 'usageLimit',
      title: 'Usage Limit',
      type: 'number',
      description: 'Maximum number of times this discount can be used (leave empty for unlimited)',
      validation: (Rule) => Rule.min(1),
    }),
    defineField({
      name: 'usagePerCustomer',
      title: 'Usage Per Customer',
      type: 'number',
      description: 'Maximum uses per customer (leave empty for unlimited)',
      validation: (Rule) => Rule.min(1),
    }),
    defineField({
      name: 'currentUses',
      title: 'Current Uses',
      type: 'number',
      initialValue: 0,
      readOnly: true,
      description: 'Number of times this discount has been used',
    }),
    defineField({
      name: 'firstTimeCustomerOnly',
      title: 'First-time Customers Only',
      type: 'boolean',
      initialValue: false,
      description: 'Restrict this discount to first-time customers',
    }),
    defineField({
      name: 'combinableWithOthers',
      title: 'Can be combined with other discounts',
      type: 'boolean',
      initialValue: false,
      description: 'Allow this discount to be used with other discounts',
    }),
    defineField({
      name: 'automaticallyApply',
      title: 'Automatically Apply',
      type: 'boolean',
      initialValue: false,
      description: 'Apply this discount automatically when conditions are met (no code needed)',
    }),
    defineField({
      name: 'priority',
      title: 'Priority',
      type: 'number',
      initialValue: 1,
      validation: (Rule) => Rule.min(1).max(10),
      description: 'Priority when multiple discounts apply (1 = highest priority)',
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'notes',
      title: 'Internal Notes',
      type: 'text',
      rows: 2,
      description: 'Internal notes about this discount (not visible to customers)',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      code: 'code',
      type: 'type',
      value: 'value',
      active: 'active',
      validUntil: 'validUntil',
    },
    prepare(selection) {
      const { title, code, type, value, active, validUntil } = selection
      
      let valueDisplay = ''
      if (type === 'percentage') {
        valueDisplay = `${value}% off`
      } else if (type === 'fixed') {
        valueDisplay = `$${value} off`
      } else if (type === 'free_shipping') {
        valueDisplay = 'Free shipping'
      } else if (type === 'bxgy') {
        valueDisplay = 'BXGY'
      }
      
      const isExpired = validUntil && new Date(validUntil) < new Date()
      const status = !active ? '(Inactive)' : isExpired ? '(Expired)' : ''
      
      return {
        title: `${title} - ${code}`,
        subtitle: `${valueDisplay} ${status}`,
      }
    },
  },
  orderings: [
    {
      title: 'Priority',
      name: 'priority',
      by: [{ field: 'priority', direction: 'asc' }],
    },
    {
      title: 'Valid From',
      name: 'validFrom',
      by: [{ field: 'validFrom', direction: 'desc' }],
    },
    {
      title: 'Code',
      name: 'code',
      by: [{ field: 'code', direction: 'asc' }],
    },
  ],
})