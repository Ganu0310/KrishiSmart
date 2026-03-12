const { query } = require('express-validator');

const advisoryQueryValidator = [
  query('crop').optional().trim().notEmpty().withMessage('Crop parameter cannot be empty if provided')
    .isIn(['wheat', 'rice', 'tomato', 'potato', 'onion', 'cotton', 'sugarcane', 'soybean', 'maize', 'grape']).withMessage('Unsupported crop type'),
  query('location').optional().trim().notEmpty().withMessage('Location parameter cannot be empty if provided'),
];

const sowingCalendarValidator = [
  query('crop').optional().trim().notEmpty().withMessage('Crop parameter cannot be empty if provided')
    .isIn(['wheat', 'rice', 'tomato', 'potato', 'onion', 'cotton', 'sugarcane', 'soybean', 'maize', 'grape']).withMessage('Unsupported crop type'),
  query('location').optional().trim().notEmpty().withMessage('Location parameter cannot be empty if provided'),
];

const pestRiskValidator = [
  query('crop').trim().notEmpty().withMessage('Crop parameter is required for pest risk')
    .isIn(['wheat', 'rice', 'tomato', 'potato', 'onion', 'cotton', 'sugarcane', 'soybean', 'maize', 'grape']).withMessage('Unsupported crop type'),
  query('location').optional().trim().notEmpty().withMessage('Location parameter cannot be empty if provided'),
];

module.exports = {
  advisoryQueryValidator,
  sowingCalendarValidator,
  pestRiskValidator
};
