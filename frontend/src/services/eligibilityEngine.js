/**
 * Eligibility engine - same 6 rules as backend. Used for real-time UI feedback.
 */

const ELIGIBLE_ORG_TYPES = [
  '501(c)(3)',
  '501(c)(4)',
  'Community-Based Organization',
  'Faith-Based Organization',
];

export function run(data) {
  const results = [];
  const currentYear = new Date().getFullYear();

  const orgType = data.organizationType;
  results.push({
    id: 1,
    name: 'Nonprofit Status',
    pass: !!orgType && ELIGIBLE_ORG_TYPES.includes(orgType),
    message: orgType && ELIGIBLE_ORG_TYPES.includes(orgType)
      ? 'Eligible organization type'
      : 'Only nonprofit and community organizations are eligible',
  });

  const yearFounded = data.yearFounded != null ? Number(data.yearFounded) : null;
  const years = yearFounded != null ? currentYear - Number(yearFounded) : null;
  results.push({
    id: 2,
    name: 'Minimum Operating History',
    pass: years != null && years >= 2,
    message: years != null
      ? years >= 2
        ? `Organization has been operating for ${years} years`
        : 'Organization must be at least 2 years old'
      : 'Organization must be at least 2 years old',
  });

  const budget = data.annualOperatingBudget != null ? Number(data.annualOperatingBudget) : null;
  results.push({
    id: 3,
    name: 'Budget Cap',
    pass: budget != null && budget < 2_000_000,
    message: budget != null
      ? budget < 2_000_000
        ? 'Operating budget is within limit'
        : 'Organizations with budgets of $2M or more are not eligible'
      : 'Organizations with budgets of $2M or more are not eligible',
  });

  const requested = data.amountRequested != null ? Number(data.amountRequested) : null;
  const totalCost = data.totalProjectCost != null ? Number(data.totalProjectCost) : null;
  const ratio = totalCost > 0 && requested != null ? (requested / totalCost) * 100 : null;
  results.push({
    id: 4,
    name: 'Funding Ratio',
    pass: ratio != null && ratio <= 50,
    message: ratio != null
      ? ratio <= 50
        ? `Requested amount is ${ratio.toFixed(1)}% of project cost`
        : 'Requested amount cannot exceed 50% of total project cost'
      : 'Requested amount cannot exceed 50% of total project cost',
  });

  results.push({
    id: 5,
    name: 'Maximum Request',
    pass: requested != null && requested <= 50000,
    message: requested != null
      ? requested <= 50000
        ? 'Requested amount is within the $50,000 maximum'
        : 'Maximum grant amount is $50,000'
      : 'Maximum grant amount is $50,000',
  });

  const beneficiaries = data.estimatedBeneficiaries != null ? Number(data.estimatedBeneficiaries) : null;
  results.push({
    id: 6,
    name: 'Minimum Impact',
    pass: beneficiaries != null && beneficiaries >= 50,
    message: beneficiaries != null
      ? beneficiaries >= 50
        ? `Project will serve ${beneficiaries} beneficiaries`
        : 'Project must serve at least 50 beneficiaries'
      : 'Project must serve at least 50 beneficiaries',
  });

  const passed = results.filter((r) => r.pass).length;
  return { results, score: passed, total: 6, eligible: passed === 6 };
}
