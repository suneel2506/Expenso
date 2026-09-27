import {
  ApprovalStatus,
  CategoryBudget,
  EventAdvance,
  EventModel,
  EventTeam,
  Expense,
  ExpenseSplit,
  IncomeRecord,
  MemberBalance,
  Reimbursement,
  Settlement,
  SimplifiedDebt,
  UserRole,
  Vendor,
} from '../types';

/**
 * Format Indian Rupees (INR) accurately with commas according to Indian numbering system
 */
export function formatINR(amount: number, includeDecimals = false): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const hasDecimals = includeDecimals || Math.round(absAmount * 100) % 100 !== 0;

  let formatted = '';
  if (hasDecimals) {
    formatted = absAmount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else {
    formatted = Math.round(absAmount).toLocaleString('en-IN', {
      maximumFractionDigits: 0,
    });
  }

  return `${isNegative ? '-' : ''}₹${formatted}`;
}

/**
 * Calculate Event Wallet & Financial Summary
 * Formula definitions:
 * - Total Budget: Maximum planned event expenditure.
 * - Total Funding: Actual money received (IncomeRecords with status 'received').
 * - Spent: Actual approved/paid expenditure.
 * - Committed: Submitted/under-review expenses + unpaid vendor balances.
 * - Available Cash: Total Funding - Spent (actual cash on hand).
 * - Remaining Budget: Total Budget - Spent - Committed (spending allowance).
 * - Unfunded Budget: Total Budget - Total Funding.
 */
export function calculateEventWallet(event: EventModel) {
  // Total Budget
  const totalBudget =
    typeof event.totalBudget === 'number' && event.totalBudget > 0
      ? event.totalBudget
      : (event.budgets || []).reduce((sum, b) => sum + (b.allocatedAmount || 0), 0);

  // Total Funds / Funding received
  const totalFunds = (event.incomeRecords || [])
    .filter((i) => i.status === 'received')
    .reduce((sum, i) => sum + i.amount, 0);

  // Spent = Expenses with status 'approved' or 'paid'
  const spent = (event.expenses || [])
    .filter((e) => e.approvalStatus === 'approved' || e.approvalStatus === 'paid')
    .reduce((sum, e) => sum + e.amount, 0);

  // Committed = Expenses submitted/under_review + Unpaid Vendor contract balances
  const pendingExpensesAmount = (event.expenses || [])
    .filter((e) => e.approvalStatus === 'submitted' || e.approvalStatus === 'under_review')
    .reduce((sum, e) => sum + e.amount, 0);

  const vendorCommittedAmount = (event.vendors || []).reduce(
    (sum, v) => sum + (v.pendingAmount || 0),
    0
  );

  const committed = pendingExpensesAmount + vendorCommittedAmount;

  // Available Cash = Total Funding - Spent
  const availableCash = totalFunds - spent;

  // Available / Net Wallet Balance (accounting for committed funds)
  const available = totalFunds - spent - committed;

  // Remaining Budget = Total Budget - Spent - Committed
  const remainingBudget = Math.max(0, totalBudget - spent - committed);

  // Unfunded Budget = Total Budget - Total Funding
  const unfundedBudget = Math.max(0, totalBudget - totalFunds);

  const pendingReimbursements = (event.reimbursements || [])
    .filter((r) => r.status === 'pending' || r.status === 'approved')
    .reduce((sum, r) => sum + r.amount, 0);

  const outstandingAdvances = (event.advances || [])
    .filter((a) => a.status !== 'settled')
    .reduce((sum, a) => sum + Math.max(0, a.amountReceived - a.amountSpent - a.returnedAmount), 0);

  const pendingApprovalsCount = (event.expenses || []).filter(
    (e) => e.approvalStatus === 'submitted' || e.approvalStatus === 'under_review'
  ).length;

  return {
    totalBudget,
    totalFunding: totalFunds,
    totalFunds,
    spent,
    committed,
    availableCash,
    available,
    remainingBudget,
    unfundedBudget,
    pendingReimbursements,
    outstandingAdvances,
    pendingApprovalsCount,
  };
}

/**
 * Calculate Budget progress for a specific category or team
 */
export function getBudgetHealthStatus(spent: number, budgetAmount: number) {
  if (!budgetAmount || budgetAmount <= 0) {
    return { percent: 0, status: 'normal' as const, label: 'No Budget Set', badgeColor: 'bg-slate-100 text-slate-600' };
  }

  const percent = Math.round((spent / budgetAmount) * 100);

  if (percent > 100) {
    return {
      percent,
      status: 'exceeded' as const,
      label: `Exceeded by ${formatINR(spent - budgetAmount)}`,
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
      barColor: 'bg-rose-500',
    };
  } else if (percent >= 80) {
    return {
      percent,
      status: 'warning' as const,
      label: `${percent}% Used (Warning)`,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      barColor: 'bg-amber-500',
    };
  } else {
    return {
      percent,
      status: 'normal' as const,
      label: `${percent}% Used`,
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      barColor: 'bg-emerald-500',
    };
  }
}

/**
 * Determine required approval level based on amount threshold
 */
export function getApprovalThresholdRole(amount: number): {
  requiredRole: UserRole;
  label: string;
} {
  if (amount <= 1000) {
    return { requiredRole: 'team_lead', label: 'Team Lead Approval' };
  } else if (amount <= 5000) {
    return { requiredRole: 'finance_manager', label: 'Finance Manager Approval' };
  } else {
    return { requiredRole: 'event_admin', label: 'Event Admin Approval' };
  }
}

/**
 * Check if a role can approve an expense of a given amount
 */
export function canRoleApproveExpense(role: UserRole, amount: number): boolean {
  if (role === 'org_admin' || role === 'event_admin') return true;
  if (role === 'finance_manager' && amount <= 5000) return true;
  if (role === 'team_lead' && amount <= 1000) return true;
  return false;
}

/**
 * Split an amount equally between members with paise-precision deterministic rounding.
 */
export function calculateEqualSplits(
  totalAmount: number,
  participants: Array<{ id: string; name: string }>
): ExpenseSplit[] {
  if (!participants.length || totalAmount <= 0) return [];

  const count = participants.length;
  const totalPaise = Math.round(totalAmount * 100);
  const baseSharePaise = Math.floor(totalPaise / count);
  let remainderPaise = totalPaise - baseSharePaise * count;

  return participants.map((member) => {
    let memberSharePaise = baseSharePaise;
    if (remainderPaise > 0) {
      memberSharePaise += 1;
      remainderPaise -= 1;
    }

    const shareAmount = memberSharePaise / 100;
    return {
      memberId: member.id,
      memberName: member.name,
      shareAmount,
      percentage: Number(((shareAmount / totalAmount) * 100).toFixed(2)),
    };
  });
}

/**
 * Calculate percentage splits with paise-precision deterministic rounding.
 */
export function calculatePercentageSplits(
  totalAmount: number,
  participants: Array<{ member: { id: string; name: string }; percentage: number }>
): ExpenseSplit[] {
  if (!participants.length || totalAmount <= 0) return [];

  const totalPaise = Math.round(totalAmount * 100);
  const rawShares = participants.map((p) => {
    const rawPaise = Math.round((totalPaise * p.percentage) / 100);
    return {
      member: p.member,
      percentage: p.percentage,
      sharePaise: rawPaise,
    };
  });

  const currentTotalPaise = rawShares.reduce((acc, curr) => acc + curr.sharePaise, 0);
  let diffPaise = totalPaise - currentTotalPaise;

  const sortedIndices = rawShares
    .map((item, idx) => ({ idx, pct: item.percentage }))
    .sort((a, b) => b.pct - a.pct)
    .map((item) => item.idx);

  let i = 0;
  while (diffPaise !== 0 && sortedIndices.length > 0) {
    const targetIdx = sortedIndices[i % sortedIndices.length];
    if (diffPaise > 0) {
      rawShares[targetIdx].sharePaise += 1;
      diffPaise -= 1;
    } else {
      rawShares[targetIdx].sharePaise -= 1;
      diffPaise += 1;
    }
    i++;
  }

  return rawShares.map((item) => ({
    memberId: item.member.id,
    memberName: item.member.name,
    shareAmount: item.sharePaise / 100,
    percentage: item.percentage,
  }));
}

/**
 * Validate that custom unequal split amounts sum to the total expense
 */
export function validateUnequalSplits(
  totalAmount: number,
  splits: Array<{ shareAmount: number }>
): { isValid: boolean; diff: number } {
  const sum = splits.reduce((acc, curr) => acc + (Number(curr.shareAmount) || 0), 0);
  const totalPaise = Math.round(totalAmount * 100);
  const sumPaise = Math.round(sum * 100);
  const diffPaise = totalPaise - sumPaise;

  return {
    isValid: diffPaise === 0,
    diff: diffPaise / 100,
  };
}

/**
 * Calculate net balances for each member in an event.
 */
export function calculateMemberBalances(
  members: Array<{ id: string; name: string; avatar?: string; color: string }>,
  expenses: Expense[],
  settlements: Settlement[]
): MemberBalance[] {
  const memberMap = new Map<
    string,
    {
      paidForExpenses: number;
      settlementsPaid: number;
      settlementsReceived: number;
      totalShare: number;
    }
  >();

  members.forEach((m) => {
    memberMap.set(m.id, {
      paidForExpenses: 0,
      settlementsPaid: 0,
      settlementsReceived: 0,
      totalShare: 0,
    });
  });

  expenses.forEach((expense) => {
    if (expense.approvalStatus !== 'approved' && expense.approvalStatus !== 'paid') return;

    const payerData = memberMap.get(expense.paidByMemberId);
    if (payerData) {
      payerData.paidForExpenses += expense.amount;
    }

    expense.splits.forEach((split) => {
      const participantData = memberMap.get(split.memberId);
      if (participantData) {
        participantData.totalShare += split.shareAmount;
      }
    });
  });

  settlements.forEach((s) => {
    const fromData = memberMap.get(s.fromMemberId);
    if (fromData) {
      fromData.settlementsPaid += s.amount;
    }
    const toData = memberMap.get(s.toMemberId);
    if (toData) {
      toData.settlementsReceived += s.amount;
    }
  });

  return members.map((member) => {
    const data = memberMap.get(member.id) || {
      paidForExpenses: 0,
      settlementsPaid: 0,
      settlementsReceived: 0,
      totalShare: 0,
    };

    const totalPaid = data.paidForExpenses + data.settlementsPaid;
    const effectiveShare = data.totalShare + data.settlementsReceived;

    const netBalancePaise = Math.round((totalPaid - effectiveShare) * 100);
    const netBalance = netBalancePaise / 100;

    let status: 'receives' | 'owes' | 'settled' = 'settled';
    if (netBalancePaise > 0) {
      status = 'receives';
    } else if (netBalancePaise < 0) {
      status = 'owes';
    }

    return {
      memberId: member.id,
      memberName: member.name,
      avatar: member.avatar,
      color: member.color,
      totalPaid: Math.round(data.paidForExpenses * 100) / 100,
      totalShare: Math.round(data.totalShare * 100) / 100,
      netBalance,
      status,
    };
  });
}

/**
 * Greedy Debt Simplification Algorithm (Min-Cash-Flow)
 */
export function simplifyDebts(balances: MemberBalance[]): SimplifiedDebt[] {
  interface Party {
    memberId: string;
    memberName: string;
    amountPaise: number;
  }

  const debtors: Party[] = [];
  const creditors: Party[] = [];

  balances.forEach((b) => {
    const amountPaise = Math.round(b.netBalance * 100);
    if (amountPaise < 0) {
      debtors.push({
        memberId: b.memberId,
        memberName: b.memberName,
        amountPaise: -amountPaise,
      });
    } else if (amountPaise > 0) {
      creditors.push({
        memberId: b.memberId,
        memberName: b.memberName,
        amountPaise: amountPaise,
      });
    }
  });

  const transactions: SimplifiedDebt[] = [];
  let transactionIndex = 0;

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    debtors.sort((a, b) => b.amountPaise - a.amountPaise);
    creditors.sort((a, b) => b.amountPaise - a.amountPaise);

    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    if (debtor.amountPaise <= 0) {
      dIdx++;
      continue;
    }
    if (creditor.amountPaise <= 0) {
      cIdx++;
      continue;
    }

    const settlePaise = Math.min(debtor.amountPaise, creditor.amountPaise);
    if (settlePaise > 0) {
      transactionIndex++;
      transactions.push({
        id: `tx-${transactionIndex}-${debtor.memberId}-${creditor.memberId}`,
        fromMemberId: debtor.memberId,
        fromMemberName: debtor.memberName,
        toMemberId: creditor.memberId,
        toMemberName: creditor.memberName,
        amount: settlePaise / 100,
      });

      debtor.amountPaise -= settlePaise;
      creditor.amountPaise -= settlePaise;
    }

    if (debtor.amountPaise === 0) dIdx++;
    if (creditor.amountPaise === 0) cIdx++;
  }

  return transactions;
}

/**
 * Generate a random 6-character event code
 */
export function generateTripCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const MEMBER_COLORS = [
  '#10B981', // emerald
  '#0EA5E9', // sky blue
  '#8B5CF6', // purple
  '#F59E0B', // amber
  '#EC4899', // pink
  '#6366F1', // indigo
  '#14B8A6', // teal
  '#F97316', // orange
  '#06B6D4', // cyan
  '#84CC16', // lime
];

export function getMemberColor(index: number): string {
  return MEMBER_COLORS[index % MEMBER_COLORS.length];
}

export const CATEGORY_CONFIG: Record<
  string,
  { label: string; emoji: string; color: string; bg: string }
> = {
  Food: { label: 'Food & Catering', emoji: '🍴', color: '#EA580C', bg: '#FFF7ED' },
  Transport: { label: 'Transport & Travel', emoji: '🚌', color: '#2563EB', bg: '#EFF6FF' },
  Accommodation: { label: 'Stay & Accommodation', emoji: '🏨', color: '#7C3AED', bg: '#F5F3FF' },
  Decoration: { label: 'Decoration & Stage', emoji: '🎭', color: '#DB2777', bg: '#FDF2F8' },
  Prizes: { label: 'Prizes & Trophies', emoji: '🏆', color: '#D97706', bg: '#FFFBEB' },
  Marketing: { label: 'Marketing & Banners', emoji: '📢', color: '#0284C7', bg: '#F0F9FF' },
  Technical: { label: 'Technical & Sound', emoji: '🎧', color: '#4F46E5', bg: '#EEF2FF' },
  'Stall & Setup': { label: 'Stalls & Staging', emoji: '🎪', color: '#059669', bg: '#ECFDF5' },
  Emergency: { label: 'Emergency Fund', emoji: '🚨', color: '#DC2626', bg: '#FEF2F2' },
  Activities: { label: 'Activities & Workshops', emoji: '🎟️', color: '#0D9488', bg: '#F0FDFA' },
  Snacks: { label: 'Snacks & Beverages', emoji: '☕', color: '#B45309', bg: '#FEF3C7' },
  Fuel: { label: 'Fuel & Commute', emoji: '⛽', color: '#9333EA', bg: '#FAF5FF' },
  Medical: { label: 'Medical & First Aid', emoji: '💊', color: '#E11D48', bg: '#FFF1F2' },
  Other: { label: 'Other Expenses', emoji: '📦', color: '#4B5563', bg: '#F3F4F6' },
};
