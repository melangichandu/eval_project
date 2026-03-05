/**
 * Eligibility engine - 6 rules. Shared logic for server-side verification.
 * Same rules as frontend for consistent results.
 */

const ELIGIBLE_ORG_TYPES = [
  '501(c)(3)',
  '501(c)(4)',
  'Community-Based Organization',
  'Faith-Based Organization',
];

function run(data) {
  const results = [];
  const currentYear = new Date().getFullYear();

  // Rule 1: Nonprofit Status
  const orgType = data.organizationType || data.organization_type;
  const r1 = {
    id: 1,
    name: 'Nonprofit Status',
    pass: !!orgType && ELIGIBLE_ORG_TYPES.includes(orgType),
    message: orgType && ELIGIBLE_ORG_TYPES.includes(orgType)
      ? 'Eligible organization type'
      : 'Only nonprofit and community organizations are eligible',
  };
  results.push(r1);

  // Rule 2: Minimum Operating History (2+ years)
  const yearFounded = data.yearFounded != null ? Number(data.yearFounded) : data.year_founded;
  const years = yearFounded != null ? currentYear - Number(yearFounded) : null;
  const r2 = {
    id: 2,
    name: 'Minimum Operating History',
    pass: years != null && years >= 2,
    message: years != null
      ? years >= 2
        ? `Organization has been operating for ${years} years`
        : 'Organization must be at least 2 years old'
      : 'Organization must be at least 2 years old',
  };
  results.push(r2);

  // Rule 3: Budget Cap (< $2M)
  const budget = data.annualOperatingBudget != null ? Number(data.annualOperatingBudget) : data.annual_operating_budget;
  const r3 = {
    id: 3,
    name: 'Budget Cap',
    pass: budget != null && budget < 2_000_000,
    message: budget != null
      ? budget < 2_000_000
        ? 'Operating budget is within limit'
        : 'Organizations with budgets of $2M or more are not eligible'
      : 'Organizations with budgets of $2M or more are not eligible',
  };
  results.push(r3);

  // Rule 4: Funding Ratio (requested <= 50% of total cost)
  const requested = data.amountRequested != null ? Number(data.amountRequested) : data.amount_requested;
  const totalCost = data.totalProjectCost != null ? Number(data.totalProjectCost) : data.total_project_cost;
  const ratio = totalCost > 0 && requested != null ? (requested / totalCost) * 100 : null;
  const r4 = {
    id: 4,
    name: 'Funding Ratio',
    pass: ratio != null && ratio <= 50,
    message: ratio != null
      ? ratio <= 50
        ? `Requested amount is ${ratio.toFixed(1)}% of project cost`
        : 'Requested amount cannot exceed 50% of total project cost'
      : 'Requested amount cannot exceed 50% of total project cost',
  };
  results.push(r4);

  // Rule 5: Maximum Request ($50,000)
  const r5 = {
    id: 5,
    name: 'Maximum Request',
    pass: requested != null && requested <= 50000,
    message: requested != null
      ? requested <= 50000
        ? 'Requested amount is within the $50,000 maximum'
        : 'Maximum grant amount is $50,000'
      : 'Maximum grant amount is $50,000',
  };
  results.push(r5);

  // Rule 6: Minimum Impact (50+ beneficiaries)
  const beneficiaries = data.estimatedBeneficiaries != null ? Number(data.estimatedBeneficiaries) : data.estimated_beneficiaries;
  const r6 = {
    id: 6,
    name: 'Minimum Impact',
    pass: beneficiaries != null && beneficiaries >= 50,
    message: beneficiaries != null
      ? beneficiaries >= 50
        ? `Project will serve ${beneficiaries} beneficiaries`
        : 'Project must serve at least 50 beneficiaries'
      : 'Project must serve at least 50 beneficiaries',
  };
  results.push(r6);

  const passed = results.filter((r) => r.pass).length;
  const total = 6;
  return {
    results,
    score: passed,
    total,
    eligible: passed === total,
  };
}

module.exports = { run };
