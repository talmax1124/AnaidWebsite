const Joi = require('joi');

// Product validation schema
const productSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().allow('').max(5000),
  short_description: Joi.string().allow('').max(500),
  price: Joi.number().positive().required(),
  compare_at_price: Joi.number().positive().allow(null),
  sku: Joi.string().required().min(1).max(100),
  category: Joi.string().required().max(100),
  subcategory: Joi.string().allow('').max(100),
  tags: Joi.array().items(Joi.string()),
  inventory_track_quantity: Joi.boolean(),
  inventory_quantity: Joi.number().integer().min(0),
  inventory_low_stock_threshold: Joi.number().integer().min(0),
  inventory_allow_backorder: Joi.boolean(),
  shipping_weight: Joi.number().min(0).allow(null),
  shipping_dimensions: Joi.object().allow(null),
  shipping_requires_shipping: Joi.boolean(),
  seo_title: Joi.string().allow('').max(255),
  seo_meta_description: Joi.string().allow('').max(500),
  seo_slug: Joi.string().required().min(1).max(255),
  active: Joi.boolean(),
  featured: Joi.boolean()
});

// Product query validation schema
const productQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  category: Joi.string().max(100),
  subcategory: Joi.string().max(100),
  search: Joi.string().max(255),
  sortBy: Joi.string().valid('name', 'price', 'created_at', 'featured'),
  sortDirection: Joi.string().valid('ASC', 'DESC'),
  featured: Joi.string().valid('true', 'false'),
  active: Joi.string().valid('true', 'false', 'all')
});

// Cart item validation schema
const cartItemSchema = Joi.object({
  product_id: Joi.string().uuid().required(),
  quantity: Joi.number().integer().min(1).required(),
  variant_options: Joi.object().allow(null)
});

// Order validation schema
const orderSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  customer_email: Joi.string().email().required(),
  customer_first_name: Joi.string().max(100),
  customer_last_name: Joi.string().max(100),
  customer_phone: Joi.string().max(20),
  shipping_address: Joi.object({
    first_name: Joi.string().required(),
    last_name: Joi.string().required(),
    company: Joi.string().allow(''),
    address_line_1: Joi.string().required(),
    address_line_2: Joi.string().allow(''),
    city: Joi.string().required(),
    state: Joi.string().required(),
    postal_code: Joi.string().required(),
    country: Joi.string().required(),
    phone: Joi.string()
  }).required(),
  payment_method: Joi.string().required(),
  payment_id: Joi.string().allow(''),
  notes: Joi.string().allow('')
});

// User validation schema
const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  first_name: Joi.string().max(100),
  last_name: Joi.string().max(100),
  phone: Joi.string().max(20)
});

// Login validation schema
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Discount validation schema
const discountValidationSchema = Joi.object({
  code: Joi.string().required(),
  cart_total: Joi.number().min(0),
  user_id: Joi.string().uuid()
});

// Generic validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};

// Query validation middleware factory
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Query validation error',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};

// Specific validation middlewares
const validateProduct = validate(productSchema);
const validateProductQuery = validateQuery(productQuerySchema);
const validateCartItem = validate(cartItemSchema);
const validateOrder = validate(orderSchema);
const validateUser = validate(userSchema);
const validateLogin = validate(loginSchema);
const validateDiscountCode = validate(discountValidationSchema);

module.exports = {
  validate,
  validateQuery,
  validateProduct,
  validateProductQuery,
  validateCartItem,
  validateOrder,
  validateUser,
  validateLogin,
  validateDiscountCode,
  productSchema,
  productQuerySchema,
  cartItemSchema,
  orderSchema,
  userSchema,
  loginSchema,
  discountValidationSchema
};