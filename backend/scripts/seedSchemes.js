/**
 * Seed script: Real Government Agriculture Schemes
 * Run once: node scripts/seedSchemes.js
 * Data sourced from official Government of India portals.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Scheme = require('../models/Scheme');
const connectDB = require('../config/db');

const SCHEMES = [
  {
    schemeName: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    ministry: 'Ministry of Agriculture and Farmers Welfare',
    schemeType: 'subsidy',
    benefitSummary:
      '₹6,000 per year direct income support to eligible farmer families, transferred in 3 equal installments of ₹2,000 every 4 months directly to bank accounts.',
    eligibility:
      'All land-holding farmer families with cultivable landholding subject to exclusion criteria (income tax payers, pensioners, constitutional post holders excluded).',
    howToApply:
      'Apply online at pmkisan.gov.in or visit nearest Common Service Centre (CSC) or Agriculture Department office.',
    applicationUrl: 'https://pmkisan.gov.in',
    applicableStates: ['all'],
    applicableCrops: ['all'],
    deadline: 'Rolling / Ongoing',
    isActive: true,
  },
  {
    schemeName: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    ministry: 'Ministry of Agriculture and Farmers Welfare',
    schemeType: 'insurance',
    benefitSummary:
      'Crop insurance scheme providing financial support to farmers suffering crop loss/damage due to unforeseen events. Premium as low as 1.5% for Rabi, 2% for Kharif, and 5% for Commercial/Horticultural crops.',
    eligibility:
      'All farmers growing notified crops in notified areas. Loanee farmers are mandatorily enrolled; non-loanee farmers can enroll voluntarily.',
    howToApply:
      'Through Common Service Centers, insurance company portals, or nearest bank branch before the deadline for the season. Online at pmfby.gov.in.',
    applicationUrl: 'https://pmfby.gov.in',
    applicableStates: ['all'],
    applicableCrops: ['grape', 'onion', 'tomato', 'wheat', 'rice', 'cotton', 'sugarcane'],
    deadline: 'Season-specific deadlines (check pmfby.gov.in)',
    isActive: true,
  },
  {
    schemeName: 'Kisan Credit Card (KCC)',
    ministry: 'Ministry of Agriculture and Farmers Welfare / NABARD',
    schemeType: 'loan',
    benefitSummary:
      'Provides farmers with short-term credit at subsidized interest rate of 4% per annum (with 3% interest subvention) for crop cultivation, post-harvest expenses, and maintenance of farm assets. Credit limit up to ₹3 lakh.',
    eligibility:
      'All farmers including owner cultivators, tenant farmers, oral lessees, share croppers, and SHG members.',
    howToApply:
      'Apply at any Bank branch, NABARD-linked cooperative, or Regional Rural Bank. Documents: land records, Aadhaar, passport photo.',
    applicationUrl: 'https://www.nabard.org/content1.aspx?id=572',
    applicableStates: ['all'],
    applicableCrops: ['all'],
    deadline: 'Rolling / Ongoing',
    isActive: true,
  },
  {
    schemeName: 'National Mission for Sustainable Agriculture (NMSA) - Micro Irrigation',
    ministry: 'Ministry of Agriculture and Farmers Welfare',
    schemeType: 'subsidy',
    benefitSummary:
      'Subsidy on drip and sprinkler irrigation systems — up to 55% for small/marginal farmers and 45% for other farmers. Promotes water use efficiency and reduces irrigation costs significantly.',
    eligibility:
      'All categories of farmers. Small and marginal farmers get higher subsidy. Prior registration through agriculture department required.',
    howToApply:
      'Apply through State Agriculture Department / Horticulture Department. Documents: land records, Aadhaar, bank account details.',
    applicationUrl: 'https://pmksy.gov.in',
    applicableStates: ['all'],
    applicableCrops: ['grape', 'onion', 'tomato', 'sugarcane', 'cotton'],
    deadline: 'Rolling / Ongoing',
    isActive: true,
  },
  {
    schemeName: 'PM Kisan Maan Dhan Yojana (PM-KMY)',
    ministry: 'Ministry of Agriculture and Farmers Welfare',
    schemeType: 'other',
    benefitSummary:
      'Pension scheme providing assured pension of ₹3,000 per month to eligible farmers at age 60. Nominal monthly contribution between ₹55–₹200 depending on age of entry. Government contributes matching amount.',
    eligibility:
      'Small and marginal farmers between 18–40 years of age. Land holding up to 2 hectares. Should not be an income tax payer.',
    howToApply:
      'Enroll at nearest Common Service Centre (CSC) with Aadhaar card and savings bank account / Jan Dhan account.',
    applicationUrl: 'https://maandhan.in/farmerspension',
    applicableStates: ['all'],
    applicableCrops: ['all'],
    deadline: 'Rolling / Ongoing',
    isActive: true,
  },
  {
    schemeName: 'Grape Subsidy Scheme (Maharashtra Horticulture Mission)',
    ministry: 'Maharashtra Department of Horticulture',
    schemeType: 'subsidy',
    benefitSummary:
      'Subsidy on grape cultivation inputs including plant material, drip irrigation, pandal structures, and post-harvest management. Subsidy up to ₹1.25 lakh per hectare for new plantations.',
    eligibility:
      'Farmers in Maharashtra with suitable land for grape cultivation. Minimum 0.2 hectare area required.',
    howToApply:
      'Apply through Maharashtra Agri Department portal (mahadbt.gov.in) or District Horticulture Office.',
    applicationUrl: 'https://mahadbt.maharashtra.gov.in',
    applicableStates: ['Maharashtra'],
    applicableCrops: ['grape'],
    deadline: 'Annual (check mahadbt.maharashtra.gov.in)',
    isActive: true,
  },
  {
    schemeName: 'Onion Export Promotion & Storage Subsidy',
    ministry: 'APEDA / Maharashtra State Horticultural Produce Export Development Foundation',
    schemeType: 'subsidy',
    benefitSummary:
      'Subsidy for onion cold storage construction (up to 30% of project cost), quality testing, export certification, and packing materials to facilitate international onion trade.',
    eligibility:
      'Onion farmer cooperatives, FPOs (Farmer Producer Organizations), and individual farmers with registered entities.',
    howToApply:
      'Apply through APEDA (Agricultural and Processed Food Products Export Development Authority) or MSAMB offices.',
    applicationUrl: 'https://apeda.gov.in',
    applicableStates: ['Maharashtra', 'Gujarat', 'Karnataka', 'Madhya Pradesh'],
    applicableCrops: ['onion'],
    deadline: 'Rolling / Ongoing',
    isActive: true,
  },
  {
    schemeName: 'E-NAM (National Agriculture Market)',
    ministry: 'Ministry of Agriculture and Farmers Welfare',
    schemeType: 'other',
    benefitSummary:
      'Online trading platform for agricultural commodities connecting farmers to buyers across India. Eliminates middlemen for better price discovery. Farmers can list and sell produce from any registered mandi.',
    eligibility:
      'All farmers. Requires registration with nearest E-NAM linked mandi with Aadhaar, bank account, and land records.',
    howToApply:
      'Register at enam.gov.in or at the nearest E-NAM enabled mandi (APMC). A farmer app is also available.',
    applicationUrl: 'https://enam.gov.in',
    applicableStates: ['all'],
    applicableCrops: ['all'],
    deadline: 'Rolling / Ongoing',
    isActive: true,
  },
];

const seedSchemes = async () => {
  await connectDB();

  const existing = await Scheme.countDocuments();
  if (existing > 0) {
    console.log(`✓ ${existing} schemes already seeded. Skipping.`);
    process.exit(0);
  }

  await Scheme.insertMany(SCHEMES);
  console.log(`✓ Seeded ${SCHEMES.length} government schemes successfully.`);
  process.exit(0);
};

seedSchemes().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
