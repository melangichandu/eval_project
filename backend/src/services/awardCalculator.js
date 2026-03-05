/**
 * Award calculation engine - pure function, backend only.
 * Scoring matrix: 5 factors, 1-3 points each. Total 5-15.
 * Award = (Total/15) * Amount Requested, rounded to nearest $100, cap $50,000.
 */

const CATEGORY_SCORES = {
  'Public Health': 3,
  'Neighborhood Safety': 3,
  'Youth Programs': 2,
  'Senior Services': 2,
  'Arts & Culture': 1,
  'Workforce Development': 1,
  'Other': 1,
};

function scoreCommunityImpact(beneficiaries) {
  const n = Number(beneficiaries) || 0;
  if (n >= 1001) return 3;
  if (n >= 201) return 2;
  if (n >= 50) return 1;
  return 0;
}

function scoreTrackRecord(yearFounded) {
  const year = Number(yearFounded);
  if (isNaN(year)) return 0;
  const years = new Date().getFullYear() - year;
  if (years >= 16) return 3;
  if (years >= 6) return 2;
  if (years >= 2) return 1;
  return 0;
}

function scoreCategory(category) {
  return CATEGORY_SCORES[category] ?? 1;
}

function scoreFinancialNeed(annualBudget) {
  const b = Number(annualBudget) || 0;
  if (b < 100_000) return 3;
  if (b < 500_000) return 2;
  if (b < 2_000_000) return 1;
  return 0;
}

function scoreCostEfficiency(amountRequested, totalProjectCost) {
  const req = Number(amountRequested) || 0;
  const total = Number(totalProjectCost) || 1;
  const pct = total > 0 ? (req / total) * 100 : 0;
  if (pct <= 25) return 3;
  if (pct <= 40) return 2;
  if (pct <= 50) return 1;
  return 0;
}

function calculate(app) {
  const beneficiaries = app.estimated_beneficiaries ?? app.estimatedBeneficiaries;
  const yearFounded = app.year_founded ?? app.yearFounded;
  const category = app.project_category ?? app.projectCategory;
  const budget = app.annual_operating_budget ?? app.annualOperatingBudget;
  const amountRequested = Number(app.amount_requested ?? app.amountRequested) || 0;
  const totalCost = app.total_project_cost ?? app.totalProjectCost;

  const impactScore = scoreCommunityImpact(beneficiaries);
  const trackScore = scoreTrackRecord(yearFounded);
  const categoryScore = scoreCategory(category);
  const needScore = scoreFinancialNeed(budget);
  const efficiencyScore = scoreCostEfficiency(amountRequested, totalCost);

  const totalScore = impactScore + trackScore + categoryScore + needScore + efficiencyScore;
  const awardPercentage = totalScore / 15;
  let awardAmount = amountRequested * awardPercentage;
  awardAmount = Math.round(awardAmount / 100) * 100;
  awardAmount = Math.min(50000, awardAmount);

  const trackValue = yearFounded ? (new Date().getFullYear() - Number(yearFounded)) + ' years' : null;
  const efficiencyValue = totalCost ? ((amountRequested / Number(totalCost)) * 100).toFixed(1) + '%' : null;

  return {
    breakdown: [
      { factor: 'Community Impact', value: beneficiaries, score: impactScore, max: 3 },
      { factor: 'Track Record', value: trackValue, score: trackScore, max: 3 },
      { factor: 'Category Priority', value: category, score: categoryScore, max: 3 },
      { factor: 'Financial Need', value: budget, score: needScore, max: 3 },
      { factor: 'Cost Efficiency', value: efficiencyValue, score: efficiencyScore, max: 3 },
    ],
    totalScore,
    maxScore: 15,
    awardPercentage,
    amountRequested,
    awardAmount,
  };
}

module.exports = { calculate };
