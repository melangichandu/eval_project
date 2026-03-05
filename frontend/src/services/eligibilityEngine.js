/**
 * Eligibility engine - same 6 rules as backend. Used for real-time UI feedback.
 * When required fields for a rule are missing, result is neutral (not yet evaluated).
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

  const orgType = (data.organizationType || '').trim() || null;
  const neutral1 = orgType == null;
  results.push({
    id: 1,
    name: 'Nonprofit Status',
    pass: !!orgType && ELIGIBLE_ORG_TYPES.includes(orgType),
    neutral: neutral1,
    message: neutral1
      ? 'Select organization type to evaluate'
      : ELIGIBLE_ORG_TYPES.includes(orgType)
        ? 'Eligible organization type'
        : 'Only nonprofit and community organizations are eligible.',
  });

  const yearFounded = data.yearFounded != null && data.yearFounded !== '' ? Number(data.yearFounded) : null;
  const years = yearFounded != null && !isNaN(yearFounded) ? currentYear - yearFounded : null;
  const neutral2 = years == null;
  results.push({
    id: 2,
    name: 'Minimum Operating History',
    pass: years != null && years >= 2,
    neutral: neutral2,
    message: neutral2
      ? 'Enter year founded to evaluate'
      : years >= 2
        ? `Organization has been operating for ${years} years`
        : 'Organization must be at least 2 years old.',
  });

  const budget = data.annualOperatingBudget != null && data.annualOperatingBudget !== '' ? Number(data.annualOperatingBudget) : null;
  const neutral3 = budget == null || isNaN(budget);
  results.push({
    id: 3,
    name: 'Budget Cap',
    pass: !neutral3 && budget < 2_000_000,
    neutral: neutral3,
    message: neutral3
      ? 'Enter annual operating budget to evaluate'
      : budget < 2_000_000
        ? 'Operating budget is within limit'
        : 'Organizations with budgets of $2M or more are not eligible.',
  });

  const requested = data.amountRequested != null && data.amountRequested !== '' ? Number(data.amountRequested) : null;
  const totalCost = data.totalProjectCost != null && data.totalProjectCost !== '' ? Number(data.totalProjectCost) : null;
  const ratio = totalCost > 0 && requested != null && !isNaN(requested) ? (requested / totalCost) * 100 : null;
  const neutral4 = ratio == null;
  results.push({
    id: 4,
    name: 'Funding Ratio',
    pass: ratio != null && ratio <= 50,
    neutral: neutral4,
    message: neutral4
      ? 'Enter amount requested and total project cost to evaluate'
      : ratio <= 50
        ? `Requested amount is ${ratio.toFixed(1)}% of project cost`
        : 'Requested amount cannot exceed 50% of total project cost.',
  });

  const neutral5 = requested == null || isNaN(requested);
  results.push({
    id: 5,
    name: 'Maximum Request',
    pass: !neutral5 && requested <= 50000,
    neutral: neutral5,
    message: neutral5
      ? 'Enter amount requested to evaluate'
      : requested <= 50000
        ? 'Requested amount is within the $50,000 maximum'
        : 'Maximum grant amount is $50,000.',
  });

  const beneficiaries = data.estimatedBeneficiaries != null && data.estimatedBeneficiaries !== '' ? Number(data.estimatedBeneficiaries) : null;
  const neutral6 = beneficiaries == null || isNaN(beneficiaries);
  results.push({
    id: 6,
    name: 'Minimum Impact',
    pass: !neutral6 && beneficiaries >= 50,
    neutral: neutral6,
    message: neutral6
      ? 'Enter estimated beneficiaries to evaluate'
      : beneficiaries >= 50
        ? `Project will serve ${beneficiaries} beneficiaries`
        : 'Project must serve at least 50 beneficiaries.',
  });

  const passed = results.filter((r) => r.pass).length;
  return { results, score: passed, total: 6, eligible: passed === 6 };
}
