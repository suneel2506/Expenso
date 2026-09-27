export type SplitMethod = 'equal' | 'unequal' | 'percentage';

export type UserRole =
  | 'org_admin'
  | 'event_admin'
  | 'finance_manager'
  | 'team_lead'
  | 'member'
  | 'viewer';

export type EventStatus = 'planning' | 'active' | 'completed' | 'archived';

export type ExpenseCategory =
  | 'Food'
  | 'Transport'
  | 'Accommodation'
  | 'Decoration'
  | 'Prizes'
  | 'Marketing'
  | 'Emergency'
  | 'Technical'
  | 'Stall & Setup'
  | 'Activities'
  | 'Snacks'
  | 'Fuel'
  | 'Medical'
  | 'Other';

export type PaymentSource = 'event_money' | 'personal_money' | 'advance';

export type ApprovalStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'paid';

export type IncomeCategory =
  | 'College Funding'
  | 'Sponsorship'
  | 'Registration Fees'
  | 'Ticket Sales'
  | 'Donations'
  | 'Department Contribution'
  | 'Stall Fees'
  | 'Other';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color?: string;
  role: UserRole;
}

export interface Organization {
  id: string;
  name: string;
  type: 'College' | 'Department' | 'Club' | 'Association' | 'Committee';
  code: string;
}

export interface EventTeam {
  id: string;
  eventId: string;
  name: string;
  budget: number;
  leadMemberId?: string;
  leadMemberName?: string;
}

export interface EventMember {
  id: string;
  eventId: string;
  userId?: string;
  name: string;
  email?: string;
  color: string;
  role: UserRole;
  teamId?: string;
  teamName?: string;
  joinedAt: string;
}

export interface IncomeRecord {
  id: string;
  eventId: string;
  amount: number; // in ₹
  source: string;
  category: IncomeCategory;
  date: string;
  description: string;
  proofUrl?: string;
  addedBy: string;
  status: 'received' | 'pending';
  createdAt: string;
}

export interface CategoryBudget {
  id: string;
  eventId: string;
  category: ExpenseCategory | string;
  allocatedAmount: number;
  teamId?: string;
  teamName?: string;
}

export interface ExpenseSplit {
  memberId: string;
  memberName: string;
  shareAmount: number; // in ₹ (rupees)
  percentage?: number;
}

export interface ExpenseItem {
  name: string;
  price: number;
  quantity?: number;
}

export interface ExtractedOcrData {
  merchant?: string;
  amount?: number;
  date?: string;
  tax?: number;
  category?: ExpenseCategory | string;
  teamName?: string;
  items?: ExpenseItem[];
  confidence?: number;
  paymentMethod?: string;
  rawNotes?: string;
  suggestedDescription?: string;
}

export interface Expense {
  id: string;
  eventId: string;
  amount: number; // in ₹
  currency: string; // 'INR'
  merchant: string;
  category: ExpenseCategory | string;
  teamId?: string;
  teamName?: string;
  date: string; // YYYY-MM-DD
  description: string;
  notes?: string;
  paidByMemberId: string;
  paidByMemberName: string;
  paymentSource: PaymentSource;
  advanceId?: string;
  approvalStatus: ApprovalStatus;
  approvalThresholdNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  splitMethod: SplitMethod;
  splits: ExpenseSplit[];
  billImageUrl?: string;
  ocrData?: ExtractedOcrData;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventAdvance {
  id: string;
  eventId: string;
  memberId: string;
  memberName: string;
  teamId?: string;
  teamName?: string;
  amountReceived: number;
  amountSpent: number;
  returnedAmount: number;
  purpose: string;
  date: string;
  status: 'pending' | 'partially_settled' | 'settled';
  notes?: string;
  createdAt: string;
}

export interface Reimbursement {
  id: string;
  eventId: string;
  expenseId: string;
  memberId: string;
  memberName: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  date: string;
  paidAt?: string;
  approvedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface Vendor {
  id: string;
  eventId: string;
  name: string;
  contact: string;
  category: string;
  totalContract: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string;
  status: 'unpaid' | 'partial' | 'paid';
  invoiceUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  eventId: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  details: string;
  oldValue?: string;
  newValue?: string;
}

export interface Settlement {
  id: string;
  eventId: string;
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  amount: number;
  date: string;
  time: string;
  note?: string;
  createdAt: string;
}

export interface FundingSourceInput {
  id?: string;
  sourceName: string;
  category: IncomeCategory;
  amount: number;
  date: string;
  description: string;
}

export interface CategoryBudgetInput {
  category: string;
  allocatedAmount: number;
}

export interface CreateEventParams {
  name: string;
  eventType?: string;
  startDate: string;
  endDate: string;
  destination?: string;
  description?: string;
  totalBudget: number;
  budgetAllocationMode: 'overall' | 'category';
  categoryBudgets?: CategoryBudgetInput[];
  initialFunding?: number;
  fundingSources?: FundingSourceInput[];
}

export interface EventModel {
  id: string;
  orgId: string;
  orgName: string;
  name: string;
  eventType?: string;
  description?: string;
  destination?: string;
  startDate: string;
  endDate: string;
  code: string; // 6-character unique code
  currency: string;
  status: EventStatus;
  totalBudget?: number;
  budgetAllocationMode?: 'overall' | 'category';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  teams: EventTeam[];
  members: EventMember[];
  incomeRecords: IncomeRecord[];
  budgets: CategoryBudget[];
  expenses: Expense[];
  advances: EventAdvance[];
  reimbursements: Reimbursement[];
  vendors: Vendor[];
  auditLogs: AuditLogItem[];
  settlements: Settlement[];
}

export interface MemberBalance {
  memberId: string;
  memberName: string;
  avatar?: string;
  color: string;
  totalPaid: number;
  totalShare: number;
  netBalance: number; // positive = receives, negative = owes, 0 = settled
  status: 'receives' | 'owes' | 'settled';
}

export interface SimplifiedDebt {
  id: string;
  fromMemberId: string;
  fromMemberName: string;
  toMemberId: string;
  toMemberName: string;
  amount: number;
}

export interface FilterState {
  search: string;
  category: string;
  teamId: string;
  memberId: string;
  paymentSource: string;
  approvalStatus: string;
  startDate: string;
  endDate: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy: 'newest' | 'oldest' | 'highest' | 'lowest';
}
