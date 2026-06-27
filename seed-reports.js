/**
 * Seed script to update existing test_reports with comprehensive parameter data.
 * Run: node seed-reports.js
 * 
 * This script updates the 5 existing reports with full test parameters,
 * lab accreditations, regulatory limits, and compliance data.
 */

const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const REPORTS = [
  {
    _id: '69e518677b9ef6b45470dc86',
    update: {
      productName: 'Akshayakalpa Organic Cow Pasteurised Milk',
      brandName: 'Akshayakalpa Farms & Foods Pvt Ltd',
      category: 'Milk · Organic',
      labName: 'Bangalore Analytical Research Center (NABL)',
      labReportNumber: 'BARC/25/09/0826',
      reportDate: new Date('2025-09-30'),
      testDate: new Date('2025-09-15'),
      batchCode: 'AESLPH4',
      sampleCondition: 'Good · 500 ml',
      totalParametersTested: 290,
      origin: 'Karnataka',
      purityScore: 96,
      scoreVerdict: 'Outstanding',
      scoreFormula: '(10 − EWG score 1.4) ÷ 9 × 100 = 96',
      categoryScores: [
        { categoryName: 'Pesticide Residues', score: 100, description: '232 pesticides tested, all BLQ' },
        { categoryName: 'Antibiotics & Vet Drug Residues', score: 100, description: '36 compounds tested, all BLQ' },
        { categoryName: 'Heavy Metals & Mycotoxins', score: 100, description: 'Lead, Arsenic, Mercury, Cadmium, Aflatoxin M1 — all BLQ' },
        { categoryName: 'Adulterants & Additives', score: 100, description: 'All 13 adulterant checks absent' },
        { categoryName: 'Nutrition Quality', score: 78, description: 'Good profile; EWG penalises saturated fat in full-fat dairy' },
        { categoryName: 'Processing Level', score: 100, description: 'Raw & unprocessed, no homogenisation, no UHT' },
      ],
      testParameters: {
        'Heavy Metals': [
          { parameterName: 'Lead (Pb)', result: '< 0.01', unit: 'mg/kg', fssaiLimit: '0.5 mg/kg', euLimit: '0.02 mg/kg', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Arsenic (As)', result: '< 0.01', unit: 'mg/kg', fssaiLimit: '0.1 mg/kg', euLimit: '0.02 mg/kg', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Mercury (Hg)', result: '< 0.005', unit: 'mg/kg', fssaiLimit: '0.01 mg/kg', euLimit: '0.01 mg/kg', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Cadmium (Cd)', result: '< 0.005', unit: 'mg/kg', fssaiLimit: '0.05 mg/kg', euLimit: '0.005 mg/kg', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Aflatoxin M1', result: '< 0.02', unit: 'µg/kg', fssaiLimit: '0.5 µg/kg', euLimit: '0.05 µg/kg', usFdaLimit: '0.5 µg/kg', status: 'Pass' },
        ],
        'Microbiology': [
          { parameterName: 'Total Plate Count', result: '< 30,000', unit: 'CFU/ml', fssaiLimit: '200,000 CFU/ml', euLimit: '100,000 CFU/ml', usFdaLimit: '100,000 CFU/ml', status: 'Pass' },
          { parameterName: 'Coliform Count', result: '< 10', unit: 'CFU/ml', fssaiLimit: '10 CFU/ml', euLimit: '10 CFU/ml', usFdaLimit: '10 CFU/ml', status: 'Pass' },
          { parameterName: 'E. coli', result: 'Absent', unit: 'per ml', fssaiLimit: 'Absent', euLimit: 'Absent', usFdaLimit: 'Absent', status: 'Pass' },
          { parameterName: 'Salmonella', result: 'Absent', unit: 'per 25ml', fssaiLimit: 'Absent', euLimit: 'Absent', usFdaLimit: 'Absent', status: 'Pass' },
          { parameterName: 'Listeria monocytogenes', result: 'Absent', unit: 'per 25ml', fssaiLimit: 'Absent', euLimit: 'Absent', usFdaLimit: 'Absent', status: 'Pass' },
        ],
        'Antibiotics': [
          { parameterName: 'Chloramphenicol', result: '< 0.1', unit: 'µg/kg', fssaiLimit: 'NMT 0.0003 mg/kg', euLimit: 'Zero tolerance', usFdaLimit: 'Banned', status: 'Pass' },
          { parameterName: 'Tetracycline', result: '< LOQ', unit: 'µg/kg', fssaiLimit: '100 µg/kg', euLimit: '100 µg/kg', usFdaLimit: '300 µg/kg', status: 'Pass' },
          { parameterName: 'Oxytetracycline', result: '< LOQ', unit: 'µg/kg', fssaiLimit: '100 µg/kg', euLimit: '100 µg/kg', usFdaLimit: '300 µg/kg', status: 'Pass' },
          { parameterName: 'Amoxicillin', result: '< LOQ', unit: 'µg/kg', fssaiLimit: '4 µg/kg', euLimit: '4 µg/kg', usFdaLimit: '10 µg/kg', status: 'Pass' },
          { parameterName: 'Ciprofloxacin', result: '< LOQ', unit: 'µg/kg', fssaiLimit: '100 µg/kg', euLimit: '100 µg/kg', usFdaLimit: 'Not specified', status: 'Pass' },
        ],
        'Adulterants': [
          { parameterName: 'Urea', result: 'Absent', unit: '', fssaiLimit: 'Absent', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Starch', result: 'Absent', unit: '', fssaiLimit: 'Absent', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Maltodextrin', result: 'Absent', unit: '', fssaiLimit: 'Absent', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Detergent', result: 'Absent', unit: '', fssaiLimit: 'Absent', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Hydrogen Peroxide', result: 'Absent', unit: '', fssaiLimit: 'Absent', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
        ],
      },
      stats: { totalParameters: 290, passCount: 288, contextNotes: 2, safetyConcerns: 0 },
      parentSummary: 'Akshayakalpa Organic Raw Milk scores 96/100 — an Outstanding rating. Zero pesticides across 232 compounds, zero antibiotics, zero heavy metals, zero adulterants. The only deductions come from EWG penalising saturated fat in full-fat dairy — increasingly challenged by current nutrition research.',
      expertCommentary: 'Exceptional purity across all categories. The organic certification is validated by the complete absence of all 232 pesticide residues tested. This is one of the cleanest milk products we have tested.',
      methodology: 'NABL-accredited multi-residue analysis using LC-MS/MS and GC-MS/MS. Tested at Bangalore Analytical Research Center.',
      isPremium: false,
      reportUrl: '/akshayakalpa-report.html',
    }
  },
  {
    _id: '6a2aff48d90eac2653bc4bf6',
    update: {
      productName: 'Happy Hens Free Range Omega-3 Brown Eggs',
      brandName: 'Sai Happy Farms Pvt. Ltd.',
      category: 'Eggs · Free Range',
      labName: 'Eurofins Analytical Services India (NABL TC-13580)',
      labReportNumber: 'AR-258-2025-20114811',
      reportDate: new Date('2025-12-31'),
      testDate: new Date('2025-12-22'),
      batchCode: 'Sample: 10 eggs',
      sampleCondition: 'Good · 10 eggs',
      totalParametersTested: 40,
      origin: 'Bengaluru',
      purityScore: 88,
      scoreVerdict: 'Good',
      scoreFormula: 'Started 100; −5 non-accredited 27/40 params; −5 no microbiology; −3 no heavy metals/pesticides; +1 hormone panel; +1 HFAC cert. Final: 88',
      categoryScores: [
        { categoryName: 'Nitrofurans & Nitroimidazoles', score: 100, description: '13 NABL-accredited parameters — all not detected' },
        { categoryName: 'Chloramphenicol', score: 100, description: 'NABL accredited — not detected at 0.05 µg/kg' },
        { categoryName: 'Reproductive Hormones', score: 100, description: '6 hormones (unique to this report) — all not detected' },
        { categoryName: 'Regulated Antibiotics', score: 100, description: '20 compounds — all BLQ' },
      ],
      testParameters: {
        'Nitrofurans (NABL Accredited)': [
          { parameterName: 'AHD (Nitrofuran metabolite)', result: '< 0.40', unit: 'µg/kg', fssaiLimit: 'NMT 0.001 mg/kg', euLimit: 'Zero tolerance — banned', usFdaLimit: 'Banned in food animals', status: 'Pass' },
          { parameterName: 'AMOZ (Nitrofuran metabolite)', result: '< 0.40', unit: 'µg/kg', fssaiLimit: 'NMT 0.001 mg/kg', euLimit: 'Zero tolerance — banned', usFdaLimit: 'Banned in food animals', status: 'Pass' },
          { parameterName: 'AOZ (Nitrofuran metabolite)', result: '< 0.40', unit: 'µg/kg', fssaiLimit: 'NMT 0.001 mg/kg', euLimit: 'Zero tolerance — banned', usFdaLimit: 'Banned in food animals', status: 'Pass' },
          { parameterName: 'SEM (Nitrofuran metabolite)', result: '< 0.40', unit: 'µg/kg', fssaiLimit: 'NMT 0.001 mg/kg', euLimit: 'Zero tolerance — banned', usFdaLimit: 'Banned in food animals', status: 'Pass' },
          { parameterName: 'Chloramphenicol', result: '< 0.05', unit: 'µg/kg', fssaiLimit: 'NMT 0.0003 mg/kg', euLimit: 'Zero tolerance — banned', usFdaLimit: 'Banned in food animals', status: 'Pass' },
          { parameterName: 'Dimetridazole', result: '< 0.50', unit: 'µg/kg', fssaiLimit: 'NMT 0.001 mg/kg', euLimit: 'Banned (Annex IV)', usFdaLimit: 'Not approved', status: 'Pass' },
          { parameterName: 'Metronidazole', result: '< 0.50', unit: 'µg/kg', fssaiLimit: 'NMT 0.001 mg/kg', euLimit: 'Banned (Annex IV)', usFdaLimit: 'Not approved', status: 'Pass' },
        ],
        'Hormones': [
          { parameterName: '17 beta-Oestradiol', result: '< 1.000', unit: 'µg/kg', fssaiLimit: 'Not specified', euLimit: 'Banned (Dir 96/22)', usFdaLimit: 'Banned', status: 'Pass' },
          { parameterName: 'Estrone', result: '< 1.000', unit: 'µg/kg', fssaiLimit: 'Not specified', euLimit: 'Banned', usFdaLimit: 'Banned', status: 'Pass' },
          { parameterName: 'Progesterone', result: '< 1.000', unit: 'µg/kg', fssaiLimit: 'Not specified', euLimit: 'Banned', usFdaLimit: 'Banned', status: 'Pass' },
          { parameterName: 'Testosterone', result: '< 1.000', unit: 'µg/kg', fssaiLimit: 'Not specified', euLimit: 'Banned', usFdaLimit: 'Banned', status: 'Pass' },
          { parameterName: '19-Nortestosterone', result: '< 1.000', unit: 'µg/kg', fssaiLimit: 'Not specified', euLimit: 'Banned (Dir 96/22)', usFdaLimit: 'Banned', status: 'Pass' },
        ],
        'Regulated Antibiotics': [
          { parameterName: 'Clenbuterol', result: '< 1.000', unit: 'µg/kg', fssaiLimit: 'Banned', euLimit: 'Banned', usFdaLimit: 'Banned', status: 'Pass' },
          { parameterName: 'Colistin', result: '< 10.00', unit: 'µg/kg', fssaiLimit: 'Banned as promoter', euLimit: 'Banned as promoter', usFdaLimit: 'Banned as promoter', status: 'Pass' },
          { parameterName: 'Tetracycline (sum)', result: '< 6.00', unit: 'µg/kg', fssaiLimit: '200 µg/kg', euLimit: '200 µg/kg', usFdaLimit: '400 µg/kg', status: 'Pass' },
          { parameterName: 'Vancomycin', result: '< 1.000', unit: 'µg/kg', fssaiLimit: 'Critical human antibiotic', euLimit: 'Critical', usFdaLimit: 'Critical', status: 'Pass' },
          { parameterName: 'Malachite Green + Leuco', result: '< 0.40', unit: 'µg/kg', fssaiLimit: 'Banned', euLimit: 'Banned', usFdaLimit: 'Banned', status: 'Pass' },
        ],
      },
      stats: { totalParameters: 40, passCount: 40, contextNotes: 0, safetyConcerns: 0 },
      parentSummary: 'Happy Hens Free Range Omega-3 Brown Eggs score 88/100 in this focused antibiotic and hormone safety test. All 40 parameters are clean. The Certified Humane® certification independently verifies genuine free-range status. Uniquely tests 6 reproductive hormones — important for families concerned about early puberty.',
      expertCommentary: 'Eurofins is one of the world\'s top two food testing labs. The Certified Humane® HFAC certification is the strongest differentiator. The hormone panel is unique to this report.',
      isPremium: true,
      reportUrl: '/happy-hens-eggs-report.html',
      statusBadges: ['Certified Humane® HFAC', 'Eurofins NABL TC-13580'],
    }
  },
  {
    _id: '69ff3dae7570e7a0a513a7d1',
    update: {
      productName: 'Farm Made Free Range Brown Eggs',
      brandName: 'Farm Made Foods (U and V Agro Pvt. Ltd.)',
      category: 'Eggs · Free Range',
      labName: 'SGS India Pvt. Ltd. (NABL Accredited), Chennai',
      labReportNumber: 'SGS/CHE/2025/FT-001',
      reportDate: new Date('2025-12-15'),
      testDate: new Date('2025-12-01'),
      batchCode: 'UV/BE/WT/S/001',
      sampleCondition: 'Good',
      totalParametersTested: 190,
      origin: 'Palladam, Tamil Nadu',
      purityScore: 91,
      scoreVerdict: 'Excellent',
      scoreFormula: '190+ parameters tested · 188+ pass all standards · 2 context notes · 0 safety concerns',
      categoryScores: [
        { categoryName: 'Pesticide Residues', score: 100, description: '140+ pesticides tested, all BLQ' },
        { categoryName: 'Antibiotics & Vet Drugs', score: 100, description: '35+ compounds tested, all ND/BLQ' },
        { categoryName: 'Heavy Metals', score: 100, description: 'Lead, Arsenic, Mercury, Cadmium — all BLQ' },
        { categoryName: 'Microbiology', score: 82, description: '9 clean, 2 context notes (TPC within limits)' },
        { categoryName: 'Nutritional Quality', score: 100, description: 'Excellent protein, balanced fat, very low carbs' },
      ],
      testParameters: {
        'Microbiology': [
          { parameterName: 'Total Plate Count', result: '74,000', unit: 'cfu/g', fssaiLimit: '≤ 500,000 cfu/g', euLimit: '≤ 500,000 cfu/g', usFdaLimit: 'No specific limit', status: 'Pass' },
          { parameterName: 'Salmonella', result: 'Absent per 25g', unit: '', fssaiLimit: 'Absent', euLimit: 'Absent (zero tolerance)', usFdaLimit: 'Absent (zero tolerance)', status: 'Pass' },
          { parameterName: 'Listeria monocytogenes', result: 'Absent per 25g', unit: '', fssaiLimit: 'Absent', euLimit: 'Absent', usFdaLimit: 'Zero tolerance', status: 'Pass' },
          { parameterName: 'E. coli', result: 'Absent per g', unit: '', fssaiLimit: 'Absent', euLimit: 'Absent / <10 cfu/g', usFdaLimit: 'Zero tolerance', status: 'Pass' },
          { parameterName: 'Coliform count', result: '< 10', unit: 'cfu/g', fssaiLimit: '< 100 cfu/g', euLimit: '< 100 cfu/g', usFdaLimit: '< 100 cfu/g', status: 'Pass' },
          { parameterName: 'Yeast and Moulds', result: '4,100', unit: 'cfu/g', fssaiLimit: '< 10,000 cfu/g', euLimit: '< 10,000 cfu/g', usFdaLimit: 'No specific limit', status: 'Pass' },
        ],
        'Heavy Metals': [
          { parameterName: 'Lead (Pb)', result: '< 0.05', unit: 'mg/kg', fssaiLimit: '0.5 mg/kg', euLimit: '0.3 mg/kg', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Arsenic (As)', result: '< 0.05', unit: 'mg/kg', fssaiLimit: '0.5 mg/kg', euLimit: '0.1 mg/kg', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Mercury (Hg)', result: '< 0.01', unit: 'mg/kg', fssaiLimit: '0.025 mg/kg', euLimit: '0.01 mg/kg', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Cadmium (Cd)', result: '< 0.01', unit: 'mg/kg', fssaiLimit: '0.05 mg/kg', euLimit: '0.05 mg/kg', usFdaLimit: 'Not specified', status: 'Pass' },
        ],
      },
      stats: { totalParameters: 190, passCount: 188, contextNotes: 2, safetyConcerns: 0 },
      parentSummary: 'Farm Made Foods Free Range Brown Eggs score 91/100 — an Excellent rating. Zero antibiotics, zero pesticides, zero heavy metals above detection limits. The only context notes are in microbiology (TPC at 15% of FSSAI max limit). These eggs are safe for your family.',
      isPremium: true,
      reportUrl: '/farmmade-eggs-report.html',
      statusBadges: ['SGS Tested', 'NABL Accredited'],
    }
  },
  {
    // Heritage Toned Milk - find by productName
    findBy: { productName: /Heritage/i },
    update: {
      productName: 'Heritage Toned Milk',
      brandName: 'Heritage Foods Ltd.',
      category: 'Milk · Toned',
      labName: 'NABL Accredited Laboratory',
      labReportNumber: 'HER/NABL/2025/TM-001',
      reportDate: new Date('2025-10-15'),
      testDate: new Date('2025-10-01'),
      batchCode: 'HER-TM-2025',
      sampleCondition: 'Good · 500 ml',
      totalParametersTested: 127,
      origin: 'India',
      purityScore: 82,
      scoreVerdict: 'Good (Grade A-)',
      scoreFormula: '125 of 127 parameters clear · 2 watchpoints (Aflatoxin M1 above EU limit, unusual Sodium reading)',
      categoryScores: [
        { categoryName: 'Antibiotics', score: 100, description: '30+ drugs screened, all not detected' },
        { categoryName: 'Pesticide Residues', score: 100, description: '54 compounds screened, all not detected' },
        { categoryName: 'Heavy Metals', score: 100, description: 'Lead, Arsenic, Mercury — all not detected' },
        { categoryName: 'Adulteration', score: 100, description: '18 checks including Melamine — all clean' },
        { categoryName: 'Nutritional Composition', score: 100, description: 'Fat 3.18%, SNF 8.66% — meets FSSAI minimums' },
        { categoryName: 'Mycotoxins', score: 45, description: 'Aflatoxin M1 at 0.273 µg/kg — passes India/US, FAILS EU' },
      ],
      testParameters: {
        'Heavy Metals': [
          { parameterName: 'Lead (Pb)', result: 'Not detected', unit: 'mg/kg', fssaiLimit: '0.5 mg/kg', euLimit: '0.02 mg/kg', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Arsenic (As)', result: 'Not detected', unit: 'mg/kg', fssaiLimit: '0.1 mg/kg', euLimit: '0.02 mg/kg', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Mercury (Hg)', result: 'Not detected', unit: 'mg/kg', fssaiLimit: '0.01 mg/kg', euLimit: '0.01 mg/kg', usFdaLimit: 'Not specified', status: 'Pass' },
        ],
        'Mycotoxins': [
          { parameterName: 'Aflatoxin M1', result: '0.273', unit: 'µg/kg', fssaiLimit: '≤ 0.5 µg/kg', euLimit: '≤ 0.05 µg/kg', usFdaLimit: '≤ 0.5 µg/kg', status: 'Watchpoint' },
        ],
        'Nutritional Composition': [
          { parameterName: 'Milk Fat', result: '3.18', unit: '%', fssaiLimit: '≥ 3.0%', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Solids-Not-Fat (SNF)', result: '8.66', unit: '%', fssaiLimit: '≥ 8.5%', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Sodium', result: '410', unit: 'mg/100g', fssaiLimit: 'Not specified', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Watchpoint' },
        ],
        'Antibiotics': [
          { parameterName: 'Chloramphenicol', result: 'Not detected', unit: '', fssaiLimit: 'Banned', euLimit: 'Zero tolerance', usFdaLimit: 'Banned', status: 'Pass' },
          { parameterName: 'Clenbuterol', result: 'Not detected', unit: '', fssaiLimit: 'Banned', euLimit: 'Banned', usFdaLimit: 'Banned', status: 'Pass' },
          { parameterName: 'Penicillins', result: 'Not detected', unit: '', fssaiLimit: '4 µg/kg', euLimit: '4 µg/kg', usFdaLimit: '5 µg/kg', status: 'Pass' },
          { parameterName: 'Tetracyclines', result: 'Not detected', unit: '', fssaiLimit: '100 µg/kg', euLimit: '100 µg/kg', usFdaLimit: '300 µg/kg', status: 'Pass' },
          { parameterName: 'Sulfonamides', result: 'Not detected', unit: '', fssaiLimit: '100 µg/kg', euLimit: '100 µg/kg', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Streptomycin', result: 'Not detected', unit: '', fssaiLimit: '200 µg/kg', euLimit: '200 µg/kg', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Gentamicin', result: 'Not detected', unit: '', fssaiLimit: '200 µg/kg', euLimit: '100 µg/kg', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Cephalosporins', result: 'Not detected', unit: '', fssaiLimit: '100 µg/kg', euLimit: '100 µg/kg', usFdaLimit: 'Not specified', status: 'Pass' },
        ],
        'Adulterants': [
          { parameterName: 'Melamine', result: 'Absent', unit: '', fssaiLimit: 'Absent', euLimit: 'Absent', usFdaLimit: 'Absent', status: 'Pass' },
          { parameterName: 'Urea', result: 'Absent', unit: '', fssaiLimit: 'Absent', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Glucose', result: 'Absent', unit: '', fssaiLimit: 'Absent', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Starch', result: 'Absent', unit: '', fssaiLimit: 'Absent', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Formaldehyde', result: 'Absent', unit: '', fssaiLimit: 'Absent', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Hydrogen Peroxide', result: 'Absent', unit: '', fssaiLimit: 'Absent', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Detergents', result: 'Absent', unit: '', fssaiLimit: 'Absent', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Neutralizers', result: 'Absent', unit: '', fssaiLimit: 'Absent', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
        ],
      },
      stats: { totalParameters: 127, passCount: 125, contextNotes: 2, safetyConcerns: 0 },
      parentSummary: 'Heritage Toned Milk scores 82/100 — a Good rating (Grade A-). 125 of 127 parameters are completely clean — no antibiotics, no pesticides, no heavy metals, no adulteration. Two watchpoints: Aflatoxin M1 at 0.273 µg/kg (passes Indian/US limits but fails EU\'s stricter 0.05 µg/kg standard), and an unusual sodium reading of 410 mg/100g (10× typical, likely a lab reporting anomaly).',
      expertCommentary: 'The Aflatoxin M1 finding (5.4× the EU limit) is the primary concern. While legal in India, families giving milk to young children daily may want brands that certify below EU thresholds. The sodium anomaly is likely a decimal-point error in reporting.',
      methodology: 'NABL-accredited multi-residue analysis. 127 parameters tested across antibiotics, pesticides, heavy metals, adulterants, mycotoxins, and nutritional composition.',
      isPremium: true,
      reportUrl: '/heritage-report.html',
    }
  },
  {
    // Namdhari Dairy Tales Toned Milk - find by productName
    findBy: { productName: /Namdhari/i },
    update: {
      productName: 'Namdhari Dairy Tales – Toned Milk',
      brandName: 'Namdhari Fresh Pvt. Ltd.',
      category: 'Milk · Toned',
      labName: 'Intertek India Pvt. Ltd. (NABL Accredited – TC-5160)',
      labReportNumber: 'IFSH-251217094',
      reportDate: new Date('2025-12-26'),
      testDate: new Date('2025-12-17'),
      batchCode: 'DT0125348',
      sampleCondition: 'Good · 500 ml × 2 packs',
      totalParametersTested: 300,
      origin: 'India',
      purityScore: 97,
      scoreVerdict: 'Excellent',
      scoreFormula: 'Microbiology 24/25 + Contaminants 38/40 + Adulteration 20/20 + Transparency 15/15 = 97/100',
      categoryScores: [
        { categoryName: 'Microbiology', score: 96, description: 'Very low counts, excellent pasteurization (24/25)' },
        { categoryName: 'Contaminants', score: 95, description: '40+ antibiotics, 250+ pesticides, heavy metals — all BLQ (38/40)' },
        { categoryName: 'Adulteration', score: 100, description: 'All preservatives and adulterants absent (20/20)' },
        { categoryName: 'Transparency', score: 100, description: 'Comprehensive testing panel, NABL-accredited lab (15/15)' },
      ],
      testParameters: {
        'Microbiology': [
          { parameterName: 'Aerobic Plate Count', result: '7,800', unit: 'cfu/ml', fssaiLimit: '≤ 30,000', euLimit: 'Hygiene criteria', usFdaLimit: '≤ 20,000', status: 'Pass' },
          { parameterName: 'Coliform Count', result: '< 1', unit: 'cfu/ml', fssaiLimit: '< 10', euLimit: '< 10', usFdaLimit: '< 10', status: 'Pass' },
          { parameterName: 'Salmonella', result: 'Absent', unit: '', fssaiLimit: 'Must be absent', euLimit: 'Must be absent', usFdaLimit: 'Must be absent', status: 'Pass' },
          { parameterName: 'Listeria monocytogenes', result: 'Absent', unit: '', fssaiLimit: 'Must be absent', euLimit: 'Zero tolerance', usFdaLimit: 'Zero tolerance', status: 'Pass' },
        ],
        'Heavy Metals': [
          { parameterName: 'Lead (Pb)', result: 'BLQ', unit: 'mg/kg', fssaiLimit: '≤ 0.02 mg/kg', euLimit: '0.02 mg/kg', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Arsenic (As)', result: 'BLQ', unit: 'mg/kg', fssaiLimit: '≤ 0.1 mg/kg', euLimit: '0.02 mg/kg', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Cadmium (Cd)', result: 'BLQ', unit: 'mg/kg', fssaiLimit: '≤ 1.5 mg/kg', euLimit: '0.005 mg/kg', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Mercury (Hg)', result: 'BLQ', unit: 'mg/kg', fssaiLimit: '≤ 1 mg/kg', euLimit: '0.01 mg/kg', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Copper (Cu)', result: 'BLQ', unit: 'mg/kg', fssaiLimit: '≤ 30 mg/kg', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Tin (Sn)', result: 'BLQ', unit: 'mg/kg', fssaiLimit: '≤ 250 mg/kg', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
        ],
        'Mycotoxins': [
          { parameterName: 'Aflatoxin M1', result: 'BLQ', unit: 'µg/kg', fssaiLimit: '≤ 0.5 µg/kg', euLimit: '≤ 0.05 µg/kg', usFdaLimit: '≤ 0.5 µg/kg', status: 'Pass' },
        ],
        'Antibiotics': [
          { parameterName: 'Ampicillin', result: 'BLQ', unit: '', fssaiLimit: '4 µg/kg', euLimit: '4 µg/kg', usFdaLimit: '10 µg/kg', status: 'Pass' },
          { parameterName: 'Amoxicillin', result: 'BLQ', unit: '', fssaiLimit: '4 µg/kg', euLimit: '4 µg/kg', usFdaLimit: '10 µg/kg', status: 'Pass' },
          { parameterName: 'Oxytetracycline', result: 'BLQ', unit: '', fssaiLimit: '100 µg/kg', euLimit: '100 µg/kg', usFdaLimit: '300 µg/kg', status: 'Pass' },
          { parameterName: 'Tetracycline', result: 'BLQ', unit: '', fssaiLimit: '100 µg/kg', euLimit: '100 µg/kg', usFdaLimit: '300 µg/kg', status: 'Pass' },
          { parameterName: 'Gentamicin', result: 'BLQ', unit: '', fssaiLimit: '200 µg/kg', euLimit: '100 µg/kg', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Streptomycin', result: 'BLQ', unit: '', fssaiLimit: '200 µg/kg', euLimit: '200 µg/kg', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Chloramphenicol', result: 'BLQ', unit: '', fssaiLimit: 'NMT 0.0003 mg/kg', euLimit: 'Zero tolerance', usFdaLimit: 'Banned', status: 'Pass' },
          { parameterName: 'Penicillin G', result: 'BLQ', unit: '', fssaiLimit: '4 µg/kg', euLimit: '4 µg/kg', usFdaLimit: '5 µg/kg', status: 'Pass' },
          { parameterName: 'Sulfonamides', result: 'BLQ', unit: '', fssaiLimit: '100 µg/kg', euLimit: '100 µg/kg', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Lincomycin', result: 'BLQ', unit: '', fssaiLimit: '150 µg/kg', euLimit: '150 µg/kg', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Trimethoprim', result: 'BLQ', unit: '', fssaiLimit: '50 µg/kg', euLimit: '50 µg/kg', usFdaLimit: 'Not specified', status: 'Pass' },
        ],
        'Nitrofurans & Nitroimidazoles': [
          { parameterName: 'AOZ (Nitrofuran metabolite)', result: 'BLQ', unit: '', fssaiLimit: 'NMT 0.001 mg/kg', euLimit: 'Zero tolerance — banned', usFdaLimit: 'Banned', status: 'Pass' },
          { parameterName: 'SEM (Nitrofuran metabolite)', result: 'BLQ', unit: '', fssaiLimit: 'NMT 0.001 mg/kg', euLimit: 'Zero tolerance — banned', usFdaLimit: 'Banned', status: 'Pass' },
          { parameterName: 'AMOZ (Nitrofuran metabolite)', result: 'BLQ', unit: '', fssaiLimit: 'NMT 0.001 mg/kg', euLimit: 'Zero tolerance — banned', usFdaLimit: 'Banned', status: 'Pass' },
          { parameterName: 'AHD (Nitrofuran metabolite)', result: 'BLQ', unit: '', fssaiLimit: 'NMT 0.001 mg/kg', euLimit: 'Zero tolerance — banned', usFdaLimit: 'Banned', status: 'Pass' },
          { parameterName: 'Dimetridazole', result: 'BLQ', unit: '', fssaiLimit: 'NMT 0.001 mg/kg', euLimit: 'Banned', usFdaLimit: 'Not approved', status: 'Pass' },
          { parameterName: 'Ronidazole', result: 'BLQ', unit: '', fssaiLimit: 'NMT 0.001 mg/kg', euLimit: 'Banned', usFdaLimit: 'Not approved', status: 'Pass' },
          { parameterName: 'Ipronidazole', result: 'BLQ', unit: '', fssaiLimit: 'NMT 0.001 mg/kg', euLimit: 'Banned', usFdaLimit: 'Not approved', status: 'Pass' },
        ],
        'Preservatives & Adulterants': [
          { parameterName: 'Benzoic Acid', result: 'Absent', unit: '', fssaiLimit: 'Absent', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Nitrate', result: 'Absent', unit: '', fssaiLimit: 'Absent', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Anionic Detergent', result: 'Absent', unit: '', fssaiLimit: 'Absent', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Formaldehyde', result: 'Absent', unit: '', fssaiLimit: 'Absent', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Hydrogen Peroxide', result: 'Absent', unit: '', fssaiLimit: 'Absent', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Boric Acid', result: 'Absent', unit: '', fssaiLimit: 'Absent', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Salicylic Acid', result: 'Absent', unit: '', fssaiLimit: 'Absent', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Maltodextrin', result: 'Absent', unit: '', fssaiLimit: 'Absent', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
        ],
        'Nutritional Composition': [
          { parameterName: 'Energy', result: '65.55', unit: 'kcal/100g', fssaiLimit: 'Not specified', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Fat', result: '3.31', unit: 'g/100g', fssaiLimit: '≥ 3.0%', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Protein', result: '3.72', unit: 'g/100g', fssaiLimit: 'Not specified', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Carbohydrates', result: '5.47', unit: 'g/100g', fssaiLimit: 'Not specified', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'SNF', result: '10', unit: '%', fssaiLimit: '≥ 8.5%', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
          { parameterName: 'Cholesterol', result: '15.23', unit: 'mg/100g', fssaiLimit: 'Not specified', euLimit: 'Not specified', usFdaLimit: 'Not specified', status: 'Pass' },
        ],
      },
      stats: { totalParameters: 300, passCount: 300, contextNotes: 0, safetyConcerns: 0 },
      parentSummary: 'Namdhari Dairy Tales Toned Milk scores 97/100 — an Excellent rating. One of the most comprehensive contaminant screens we have seen for milk in India. Zero antibiotics across 40+ drugs, zero pesticides across 250+ compounds, zero heavy metals, zero mycotoxins, zero adulterants. Very low microbial counts confirm excellent pasteurization and hygiene control.',
      expertCommentary: 'This is an exceptionally comprehensive testing panel from Intertek (NABL TC-5160). The BLQ result for Aflatoxin M1 is noteworthy — unlike Heritage which showed 0.273 µg/kg, Namdhari showed no detectable levels. The 250+ pesticide screening is one of the largest panels available.',
      methodology: 'NABL-accredited analysis at Intertek India (TC-5160). Comprehensive panel including 40+ antibiotics, 250+ pesticides, heavy metals, mycotoxins, preservatives, adulteration indicators, and nutritional composition.',
      isPremium: true,
      reportUrl: '/namdhari-report.html',
      statusBadges: ['Intertek NABL TC-5160', '300+ Parameters'],
    }
  },
];

async function seedReports() {
  const client = new MongoClient(process.env.MONGO_URL);
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME || 'choosepure_db');
    const collection = db.collection('test_reports');

    for (const report of REPORTS) {
      let filter;
      if (report._id) {
        filter = { _id: new ObjectId(report._id) };
      } else if (report.findBy) {
        filter = report.findBy;
      } else {
        console.log(`⚠️ Skipping report — no _id or findBy specified`);
        continue;
      }

      const result = await collection.updateOne(
        filter,
        { $set: { ...report.update, updatedAt: new Date() } }
      );
      if (result.matchedCount === 0) {
        console.log(`⚠️ No matching document found for: ${report.update.productName} — inserting new...`);
        await collection.insertOne({ ...report.update, published: true, createdAt: new Date(), updatedAt: new Date() });
        console.log(`✅ Inserted ${report.update.productName}`);
      } else {
        console.log(`✅ Updated ${report.update.productName}: ${result.modifiedCount} modified`);
      }
    }

    console.log('\n🎉 All reports seeded successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

seedReports();
