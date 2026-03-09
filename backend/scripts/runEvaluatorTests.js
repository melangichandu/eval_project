/**
 * Evaluator Validation Tests - Maplewood County Grant System
 * Runs test cases from Copy of Evaluator_Validation_Test_Data.md
 * against the backend eligibility engine and award calculator.
 *
 * Run: node scripts/runEvaluatorTests.js
 */

const eligibilityEngine = require('../src/services/eligibilityEngine');
const awardCalculator = require('../src/services/awardCalculator');

const assert = require('assert');

// --- Helpers: build app payload (camelCase for engines that accept both)
function app(data) {
  return {
    organizationType: data.organizationType,
    yearFounded: data.yearFounded,
    annualOperatingBudget: data.annualOperatingBudget,
    amountRequested: data.amountRequested,
    totalProjectCost: data.totalProjectCost,
    estimatedBeneficiaries: data.estimatedBeneficiaries,
    projectCategory: data.projectCategory || 'Public Health',
    // snake_case for award calculator when used from DB shape
    organization_type: data.organizationType,
    year_founded: data.yearFounded,
    annual_operating_budget: data.annualOperatingBudget,
    amount_requested: data.amountRequested,
    total_project_cost: data.totalProjectCost,
    estimated_beneficiaries: data.estimatedBeneficiaries,
    project_category: data.projectCategory || 'Public Health',
  };
}

function runEligibility(data) {
  return eligibilityEngine.run(data);
}

function runAward(data) {
  return awardCalculator.calculate(data);
}

// --- Test Application 1: Fully Eligible, High Award
const TEST_APP_1 = app({
  organizationType: '501(c)(3)',
  yearFounded: 2005,
  annualOperatingBudget: 85000,
  amountRequested: 50000,
  totalProjectCost: 200000,
  estimatedBeneficiaries: 2500,
  projectCategory: 'Public Health',
});

// --- Test Application 2: Fully Ineligible
const TEST_APP_2 = app({
  organizationType: 'For-Profit Business',
  yearFounded: 2025,
  annualOperatingBudget: 5000000,
  amountRequested: 55000,
  totalProjectCost: 80000,
  estimatedBeneficiaries: 30,
  projectCategory: 'Workforce Development',
});

// --- Test Application 3: Boundary Values
const TEST_APP_3 = app({
  organizationType: 'Community-Based Organization',
  yearFounded: 2024,
  annualOperatingBudget: 1999999,
  amountRequested: 20000,
  totalProjectCost: 40000,
  estimatedBeneficiaries: 50,
  projectCategory: 'Arts & Culture',
});

// --- Test Application 4: Eligible, Minimum Scores
const TEST_APP_4 = app({
  organizationType: '501(c)(4)',
  yearFounded: 2021,
  annualOperatingBudget: 750000,
  amountRequested: 14000,
  totalProjectCost: 30000,
  estimatedBeneficiaries: 150,
  projectCategory: 'Senior Services',
});

// --- Test Application 5: Eligible, Maximum Scores
const TEST_APP_5 = app({
  organizationType: 'Faith-Based Organization',
  yearFounded: 1998,
  annualOperatingBudget: 65000,
  amountRequested: 50000,
  totalProjectCost: 250000,
  estimatedBeneficiaries: 5000,
  projectCategory: 'Neighborhood Safety',
});

const results = { passed: 0, failed: 0, tests: [] };

function ok(name, condition, detail = '') {
  if (condition) {
    results.passed++;
    results.tests.push({ name, ok: true, detail });
    return true;
  }
  results.failed++;
  results.tests.push({ name, ok: false, detail });
  return false;
}

function eq(name, actual, expected, extra = '') {
  const pass = actual === expected;
  const detail = pass ? '' : `Expected ${expected}, got ${actual}${extra ? ' | ' + extra : ''}`;
  ok(name, pass, detail);
  return pass;
}

function numEq(name, actual, expected, tolerance = 0) {
  const pass = tolerance ? Math.abs(actual - expected) <= tolerance : actual === expected;
  const detail = pass ? '' : `Expected ${expected}, got ${actual}`;
  ok(name, pass, detail);
  return pass;
}

console.log('\n========== Evaluator Validation Tests ==========\n');
console.log('Running tests from Copy of Evaluator_Validation_Test_Data.md\n');

// ---- Section 2: Test Application 1 - Fully Eligible, High Award
console.log('--- Test Application 1: Fully Eligible, High Award ---');
const e1 = runEligibility(TEST_APP_1);
eq('App1: Eligible 6/6', e1.eligible, true);
eq('App1: Score 6', e1.score, 6);
const a1 = runAward(TEST_APP_1);
eq('App1: Total score 15', a1.totalScore, 15);
eq('App1: Final award $50,000', a1.awardAmount, 50000);
// Factor scores
const b1 = a1.breakdown;
ok('App1: Community Impact = 3', b1[0].score === 3, b1[0].score + '');
ok('App1: Track Record = 3', b1[1].score === 3, b1[1].score + '');
ok('App1: Category = 3', b1[2].score === 3, b1[2].score + '');
ok('App1: Financial Need = 3', b1[3].score === 3, b1[3].score + '');
ok('App1: Cost Efficiency = 3', b1[4].score === 3, b1[4].score + '');

// ---- Section 3: Test Application 2 - Fully Ineligible
console.log('--- Test Application 2: Fully Ineligible ---');
const e2 = runEligibility(TEST_APP_2);
eq('App2: Not eligible', e2.eligible, false);
eq('App2: Score 0', e2.score, 0);
e2.results.forEach((r, i) => ok(`App2: Rule ${i + 1} fail`, !r.pass, r.name));

// ---- Section 4: Test Application 3 - Boundary Values
console.log('--- Test Application 3: Boundary Values ---');
const e3 = runEligibility(TEST_APP_3);
eq('App3: Eligible 6/6', e3.eligible, true);
eq('App3: Score 6', e3.score, 6);
const a3 = runAward(TEST_APP_3);
eq('App3: Total score 5', a3.totalScore, 5);
eq('App3: Final award $6,700', a3.awardAmount, 6700);

// ---- Section 5: Test Application 4 - Eligible, Minimum Scores
console.log('--- Test Application 4: Eligible, Minimum Scores ---');
const e4 = runEligibility(TEST_APP_4);
eq('App4: Eligible 6/6', e4.eligible, true);
const a4 = runAward(TEST_APP_4);
eq('App4: Total score 6', a4.totalScore, 6);
eq('App4: Final award $5,600', a4.awardAmount, 5600);

// ---- Section 6: Test Application 5 - Eligible, Maximum Scores
console.log('--- Test Application 5: Eligible, Maximum Scores ---');
const e5 = runEligibility(TEST_APP_5);
eq('App5: Eligible 6/6', e5.eligible, true);
const a5 = runAward(TEST_APP_5);
eq('App5: Total score 15', a5.totalScore, 15);
eq('App5: Final award $50,000', a5.awardAmount, 50000);

// ---- Section 8: Eligibility Engine Edge Cases
console.log('--- Eligibility Edge Cases (E-01 to E-14) ---');
const edgeCases = [
  { id: 'E-01', mod: { organizationType: 'Individual' }, expectPass: false },
  { id: 'E-02', mod: { organizationType: 'Government Agency' }, expectPass: false },
  { id: 'E-03', mod: { organizationType: 'Faith-Based Organization' }, expectPass: true },
  { id: 'E-04', mod: { yearFounded: 2025 }, expectPass: false },
  { id: 'E-05', mod: { yearFounded: 2024 }, expectPass: true },
  { id: 'E-06', mod: { yearFounded: 2026 }, expectPass: false },
  { id: 'E-07', mod: { annualOperatingBudget: 2000000 }, expectPass: false },
  { id: 'E-08', mod: { annualOperatingBudget: 1999999.99 }, expectPass: true },
  { id: 'E-09', mod: { amountRequested: 25001, totalProjectCost: 50000 }, expectPass: false },
  { id: 'E-10', mod: { amountRequested: 25000, totalProjectCost: 50000 }, expectPass: true },
  { id: 'E-11', mod: { amountRequested: 50001 }, expectPass: false },
  { id: 'E-12', mod: { estimatedBeneficiaries: 49 }, expectPass: false },
  { id: 'E-13', mod: { estimatedBeneficiaries: 50 }, expectPass: true },
  { id: 'E-14', mod: { estimatedBeneficiaries: 1 }, expectPass: false },
];

edgeCases.forEach(({ id, mod, expectPass }) => {
  const payload = app({ ...TEST_APP_1, ...mod });
  const res = runEligibility(payload);
  ok(`${id}: ${expectPass ? 'PASS' : 'FAIL'}`, res.eligible === expectPass, `eligible=${res.eligible}`);
});

// ---- Section 9: Award Calculator Edge Cases (subset)
console.log('--- Award Calculator Edge Cases ---');
// A-01: Beneficiaries 200 -> Impact=1, Total 13, Award $43,300
const a01 = app({ ...TEST_APP_1, estimatedBeneficiaries: 200 });
const calc01 = runAward(a01);
ok('A-01: Impact=1 for 200 beneficiaries', calc01.breakdown[0].score === 1);
eq('A-01: Total 13', calc01.totalScore, 13);
eq('A-01: Award $43,300', calc01.awardAmount, 43300);

// A-02: Beneficiaries 201 -> Impact=2, Total 14, $46,700
const a02 = app({ ...TEST_APP_1, estimatedBeneficiaries: 201 });
const calc02 = runAward(a02);
ok('A-02: Impact=2 for 201 beneficiaries', calc02.breakdown[0].score === 2);
eq('A-02: Total 14', calc02.totalScore, 14);
eq('A-02: Award $46,700', calc02.awardAmount, 46700);

// A-04: Beneficiaries 1,001 -> Impact=3, Total 15, $50,000
const a04 = app({ ...TEST_APP_1, estimatedBeneficiaries: 1001 });
const calc04 = runAward(a04);
ok('A-04: Impact=3 for 1,001 beneficiaries', calc04.breakdown[0].score === 3);
eq('A-04: Total 15', calc04.totalScore, 15);
eq('A-04: Award $50,000', calc04.awardAmount, 50000);

// A-05: Budget $100,000 -> Need=2, Total 14, $46,700
const a05 = app({ ...TEST_APP_1, annualOperatingBudget: 100000 });
const calc05 = runAward(a05);
ok('A-05: Financial Need=2 for $100K budget', calc05.breakdown[3].score === 2);
eq('A-05: Award $46,700', calc05.awardAmount, 46700);

// A-06: Budget $99,999 -> Need=3, $50,000
const a06 = app({ ...TEST_APP_1, annualOperatingBudget: 99999 });
const calc06 = runAward(a06);
ok('A-06: Financial Need=3 for $99,999', calc06.breakdown[3].score === 3);
eq('A-06: Award $50,000', calc06.awardAmount, 50000);

// A-09: Ratio 25% -> Efficiency 3
const a09 = app({ ...TEST_APP_1, amountRequested: 50000, totalProjectCost: 200000 });
const calc09 = runAward(a09);
ok('A-09: Cost Efficiency=3 at 25%', calc09.breakdown[4].score === 3);
eq('A-09: Award $50,000', calc09.awardAmount, 50000);

// A-10: Ratio 26% -> Efficiency 2, $46,700
const a10 = app({ ...TEST_APP_1, amountRequested: 50000, totalProjectCost: 192308 });
const calc10 = runAward(a10);
ok('A-10: Cost Efficiency=2 at 26%', calc10.breakdown[4].score === 2);
eq('A-10: Award $46,700', calc10.awardAmount, 46700);

// A-12: Ratio 41% -> Efficiency 1, $43,300
const a12 = app({ ...TEST_APP_1, amountRequested: 50000, totalProjectCost: 121951 });
const calc12 = runAward(a12);
ok('A-12: Cost Efficiency=1 at 41%', calc12.breakdown[4].score === 1);
eq('A-12: Award $43,300', calc12.awardAmount, 43300);

// A-13 to A-17: Track record
const trackTests = [
  { year: 2024, expectScore: 1 },
  { year: 2021, expectScore: 1 },
  { year: 2020, expectScore: 2 },
  { year: 2011, expectScore: 2 },
  { year: 2010, expectScore: 3 },
];
trackTests.forEach(({ year, expectScore }, i) => {
  const t = app({ ...TEST_APP_1, yearFounded: year });
  const c = runAward(t);
  ok(`A-${13 + i}: Track score ${expectScore} for year ${year}`, c.breakdown[1].score === expectScore);
});

// A-18 to A-24: Category scores
const categoryScores = {
  'Public Health': 3,
  'Neighborhood Safety': 3,
  'Youth Programs': 2,
  'Senior Services': 2,
  'Arts & Culture': 1,
  'Workforce Development': 1,
  'Other': 1,
};
Object.entries(categoryScores).forEach(([cat, expectScore], i) => {
  const t = app({ ...TEST_APP_1, projectCategory: cat });
  const c = runAward(t);
  ok(`A-${18 + i}: Category "${cat}" = ${expectScore}`, c.breakdown[2].score === expectScore);
});

// A-25: Amount $10,000, Total Score 7/15 -> 46.7% -> $4,666.67 rounded to $4,700
// Impact 1, Track 1, Cat 1, Need 1, Eff 3 = 7 (e.g. 50 ben, 2024, Other, $1M, $10k/$40k=25%)
const a25 = app({
  organizationType: '501(c)(3)',
  yearFounded: 2024,
  annualOperatingBudget: 1000000,
  amountRequested: 10000,
  totalProjectCost: 40000,
  estimatedBeneficiaries: 50,
  projectCategory: 'Other',
});
const calc25 = runAward(a25);
eq('A-25: Rounding $4,666.67 -> $4,700', calc25.awardAmount, 4700);

// A-26: Amount $10,000, Total Score 8/15 -> 53.3% -> $5,333.33 rounded to $5,300
// Impact 1, Track 1, Cat 2, Need 2, Eff 2 = 8 (e.g. 100 ben, 2024, Senior Services, $300k, $10k/$25k=40%)
const a26 = app({
  organizationType: '501(c)(3)',
  yearFounded: 2024,
  annualOperatingBudget: 300000,
  amountRequested: 10000,
  totalProjectCost: 25000,
  estimatedBeneficiaries: 100,
  projectCategory: 'Senior Services',
});
const calc26 = runAward(a26);
eq('A-26: Rounding $5,333.33 -> $5,300', calc26.awardAmount, 5300);

// ---- Summary
console.log('\n========== Results Summary ==========\n');
const total = results.passed + results.failed;
console.log(`Total: ${results.passed}/${total} passed, ${results.failed} failed.\n`);

const failed = results.tests.filter((t) => !t.ok);
if (failed.length > 0) {
  console.log('Failed tests:');
  failed.forEach((t) => console.log(`  - ${t.name}${t.detail ? ': ' + t.detail : ''}`));
  console.log('');
}

process.exit(results.failed > 0 ? 1 : 0);
