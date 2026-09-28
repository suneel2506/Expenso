import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  ApprovalStatus,
  AuditLogItem,
  CategoryBudget,
  CreateEventParams,
  EventAdvance,
  EventModel,
  EventTeam,
  Expense,
  IncomeRecord,
  Reimbursement,
  Settlement,
  UserProfile,
  UserRole,
  Vendor,
} from '../types';
import { createPondicherryDemoTrip, createTechnovaDemoEvent, DEMO_ORGANIZATION, DEMO_USER } from '../utils/demoData';
import { generateTripCode, getApprovalThresholdRole, getMemberColor } from '../utils/calculations';
import {
  saveEventToFirestore,
  fetchEventByCode,
  subscribeToFirestoreEvent,
  deleteEventFromFirestore,
  extractEventCode,
  sanitizeLoadedEvent,
} from '../utils/firebase';

interface AppContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  events: EventModel[];
  activeEventId: string | null;
  activeEvent: EventModel | null;
  setActiveEventId: (id: string) => void;
  createEvent: (
    paramsOrName: CreateEventParams | string,
    description?: string,
    destination?: string,
    startDate?: string,
    endDate?: string
  ) => Promise<EventModel>;
  joinEvent: (code: string, userName: string) => Promise<{ success: boolean; error?: string; event?: EventModel }>;
  
  // Money In & Budget
  addIncomeRecord: (record: Omit<IncomeRecord, 'id' | 'createdAt'>) => Promise<void>;
  updateCategoryBudget: (category: string, allocatedAmount: number, teamId?: string) => Promise<void>;
  addTeam: (name: string, budget: number, leadMemberId?: string) => Promise<EventTeam>;
  
  // Expenses & Approvals
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'currency' | 'approvalStatus'>) => Promise<void>;
  updateExpense: (expenseId: string, updated: Partial<Expense>) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  approveExpense: (expenseId: string, notes?: string) => Promise<void>;
  rejectExpense: (expenseId: string, reason?: string) => Promise<void>;
  markExpensePaid: (expenseId: string) => Promise<void>;

  // Advances & Reimbursements
  addAdvance: (advance: Omit<EventAdvance, 'id' | 'createdAt' | 'amountSpent' | 'returnedAmount' | 'status'>) => Promise<void>;
  settleAdvance: (advanceId: string, spentAmount: number, returnedAmount: number, notes?: string) => Promise<void>;
  approveReimbursement: (reimbursementId: string) => Promise<void>;
  markReimbursementPaid: (reimbursementId: string) => Promise<void>;

  // Vendors
  addVendor: (vendor: Omit<Vendor, 'id' | 'createdAt' | 'paidAmount' | 'pendingAmount' | 'status'>) => Promise<void>;
  recordVendorPayment: (vendorId: string, paymentAmount: number) => Promise<void>;

  // Personal Settlements
  recordSettlement: (settlement: Omit<Settlement, 'id' | 'createdAt' | 'time'>) => Promise<void>;

  // Members & Admin
  addMember: (name: string, email?: string, role?: UserRole, teamId?: string) => Promise<any>;
  updateMember: (memberId: string, newName: string, role?: UserRole, teamId?: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<{ success: boolean; error?: string }>;
  closeEvent: () => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  resetToDemoEvents: () => void;
  clearAllData: () => Promise<void>;

  // App UI Navigation & State
  isOnline: boolean;
  isSyncing: boolean;
  activeTab: 'home' | 'expenses' | 'money' | 'more' | 'balances' | 'reports';
  setActiveTab: (tab: 'home' | 'expenses' | 'money' | 'more' | 'balances' | 'reports') => void;
  moreSubTab: 'teams' | 'members' | 'budget' | 'reimbursements' | 'advances' | 'vendors' | 'audit' | 'closure' | 'settings' | null;
  setMoreSubTab: (sub: 'teams' | 'members' | 'budget' | 'reimbursements' | 'advances' | 'vendors' | 'audit' | 'closure' | 'settings' | null) => void;
  isAddExpenseOpen: boolean;
  setIsAddExpenseOpen: (open: boolean) => void;
  selectedExpense: Expense | null;
  setSelectedExpense: (exp: Expense | null) => void;
  broadcastChange: (event: string, payload: any) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_EVENTS = 'expenso_events_v2';
const STORAGE_KEY_ACTIVE_EVENT = 'expenso_active_event_id_v2';
const STORAGE_KEY_USER = 'expenso_user_profile_v2';
const STORAGE_KEY_ROLE = 'expenso_user_role_v2';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current user state
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return DEMO_USER;
  });

  // Role Switcher state for easy testing
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ROLE);
      if (saved) return saved as UserRole;
    } catch (e) {
      console.error(e);
    }
    return DEMO_USER.role;
  });

  // All Events State
  const [events, setEvents] = useState<EventModel[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EVENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // Active Event ID
  const [activeEventId, setActiveEventId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_EVENT);
      if (saved) return saved;
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'home' | 'expenses' | 'money' | 'more' | 'balances' | 'reports'>('home');
  const [moreSubTab, setMoreSubTab] = useState<'teams' | 'members' | 'budget' | 'reimbursements' | 'advances' | 'vendors' | 'audit' | 'closure' | 'settings' | null>(null);

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Network and sync state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  // Network listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  }, [events]);

  useEffect(() => {
    if (activeEventId) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_EVENT, activeEventId);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_EVENT);
    }
  }, [activeEventId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ROLE, currentRole);
  }, [currentRole]);

  // Active Event derived object
  const activeEvent = useMemo(() => {
    return events.find((e) => e.id === activeEventId) || events[0] || null;
  }, [events, activeEventId]);

  // Broadcast change to server for SSE
  const broadcastChange = useCallback(
    async (event: string, payload: any) => {
      if (!isOnline || !activeEventId) return;
      try {
        await fetch('/api/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tripId: activeEventId,
            event,
            payload,
          }),
        });
      } catch (err) {
        console.warn('Broadcast failed (offline or server unreachable):', err);
      }
    },
    [isOnline, activeEventId]
  );

  // Listen to SSE updates
  useEffect(() => {
    if (!activeEventId || !isOnline) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/events?tripId=${activeEventId}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.event === 'SYNC_EVENT' && data.payload) {
            setEvents((prevEvents) => {
              const updated = data.payload;
              const idx = prevEvents.findIndex((e) => e.id === updated.id);
              if (idx >= 0) {
                const next = [...prevEvents];
                next[idx] = updated;
                return next;
              }
              return [...prevEvents, updated];
            });
          }
        } catch {
          // ignore non-json messages
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch (err) {
      console.warn('SSE connection error:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [activeEventId, isOnline]);

  // Listen to Firestore real-time updates for activeEventId
  useEffect(() => {
    if (!activeEventId) return;

    try {
      const unsubscribe = subscribeToFirestoreEvent(activeEventId, (updated) => {
        if (updated && updated.id === activeEventId) {
          setEvents((prev) => {
            const idx = prev.findIndex((e) => e.id === updated.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = updated;
              return next;
            }
            return [updated, ...prev];
          });
        }
      });

      return () => {
        unsubscribe();
      };
    } catch (err) {
      console.warn('Firestore subscription setup error:', err);
    }
  }, [activeEventId]);

  // Helper to persist event update to Firestore and backend
  const syncEventToBackend = useCallback(
    async (updatedEvent: EventModel) => {
      setIsSyncing(true);
      try {
        // 1. Sync to Firestore (cross-device real-time cloud database)
        await saveEventToFirestore(updatedEvent);

        // 2. Also sync to backend API
        if (isOnline) {
          await fetch(`/api/trips/${updatedEvent.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedEvent),
          });
        }
      } catch (err) {
        console.warn('Sync failed:', err);
      } finally {
        setIsSyncing(false);
      }
    },
    [isOnline]
  );

  // Helper to log audit actions
  const logAudit = useCallback(
    (event: EventModel, action: string, details: string, oldValue?: string, newValue?: string): EventModel => {
      const now = new Date();
      const timeStr = `${now.toISOString().split('T')[0]} ${now.toTimeString().slice(0, 5)}`;
      const newLog: AuditLogItem = {
        id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        eventId: event.id,
        timestamp: timeStr,
        actorName: currentUser.name,
        actorRole: currentRole,
        action,
        details,
        oldValue,
        newValue,
      };

      return {
        ...event,
        auditLogs: [newLog, ...(event.auditLogs || [])],
        updatedAt: now.toISOString(),
      };
    },
    [currentUser.name, currentRole]
  );

  // Create a new Event
  const createEvent = useCallback(
    async (
      paramsOrName: CreateEventParams | string,
      argDesc?: string,
      argDest?: string,
      argStart?: string,
      argEnd?: string
    ): Promise<EventModel> => {
      const newEventId = `evt-${Date.now()}`;
      const code = generateTripCode();

      let name = '';
      let eventType = 'IV Trip';
      let description = '';
      let destination = '';
      let startDate = new Date().toISOString().split('T')[0];
      let endDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      let totalBudget = 0;
      let budgetAllocationMode: 'overall' | 'category' = 'category';
      let categoryBudgetsInput: { category: string; allocatedAmount: number }[] = [];
      let initialFundingInput = 0;
      let fundingSourcesInput: any[] = [];

      if (typeof paramsOrName === 'object') {
        name = paramsOrName.name;
        eventType = paramsOrName.eventType || 'IV Trip';
        description = paramsOrName.description || '';
        destination = paramsOrName.destination || '';
        startDate = paramsOrName.startDate || startDate;
        endDate = paramsOrName.endDate || endDate;
        totalBudget = paramsOrName.totalBudget || 0;
        budgetAllocationMode = paramsOrName.budgetAllocationMode || 'category';
        categoryBudgetsInput = paramsOrName.categoryBudgets || [];
        initialFundingInput = paramsOrName.initialFunding || 0;
        fundingSourcesInput = paramsOrName.fundingSources || [];
      } else {
        name = paramsOrName;
        description = argDesc || '';
        destination = argDest || '';
        startDate = argStart || startDate;
        endDate = argEnd || endDate;
      }

      const ownerMember = {
        id: `mem-${Date.now()}`,
        eventId: newEventId,
        userId: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        color: getMemberColor(0),
        role: 'event_admin' as UserRole,
        joinedAt: new Date().toISOString().split('T')[0],
      };

      const defaultTeams = [
        { id: `tm-1-${Date.now()}`, eventId: newEventId, name: 'General & Core', budget: Math.round(totalBudget * 0.2) },
        { id: `tm-2-${Date.now()}`, eventId: newEventId, name: 'Food & Catering', budget: Math.round(totalBudget * 0.4) },
        { id: `tm-3-${Date.now()}`, eventId: newEventId, name: 'Transport & Logistics', budget: Math.round(totalBudget * 0.3) },
      ];

      // Convert categoryBudgetsInput
      const budgets: CategoryBudget[] = categoryBudgetsInput
        .filter((c) => c.allocatedAmount > 0)
        .map((c, idx) => ({
          id: `bgt-${idx}-${Date.now()}`,
          eventId: newEventId,
          category: c.category,
          allocatedAmount: c.allocatedAmount,
        }));

      // Convert fundingSourcesInput to IncomeRecord[]
      const incomeRecords: IncomeRecord[] = [];
      if (fundingSourcesInput && fundingSourcesInput.length > 0) {
        fundingSourcesInput.forEach((fs, idx) => {
          if (fs.amount > 0) {
            incomeRecords.push({
              id: `inc-${idx}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              eventId: newEventId,
              amount: fs.amount,
              source: fs.sourceName || fs.category || 'Initial Funding',
              category: fs.category || 'College Funding',
              date: fs.date || startDate,
              description: fs.description || `Initial funding source (${fs.sourceName || fs.category})`,
              addedBy: currentUser.name,
              status: 'received',
              createdAt: new Date().toISOString(),
            });
          }
        });
      } else if (initialFundingInput > 0) {
        incomeRecords.push({
          id: `inc-init-${Date.now()}`,
          eventId: newEventId,
          amount: initialFundingInput,
          source: 'Initial Funding',
          category: 'College Funding',
          date: startDate,
          description: 'Initial event funding setup',
          addedBy: currentUser.name,
          status: 'received',
          createdAt: new Date().toISOString(),
        });
      }

      let newEvent: EventModel = {
        id: newEventId,
        orgId: DEMO_ORGANIZATION.id,
        orgName: DEMO_ORGANIZATION.name,
        name: name.trim(),
        eventType,
        description: description.trim() || undefined,
        destination: destination.trim() || undefined,
        startDate,
        endDate,
        code,
        currency: 'INR',
        status: 'active',
        totalBudget,
        budgetAllocationMode,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        teams: defaultTeams,
        members: [ownerMember],
        incomeRecords,
        budgets,
        expenses: [],
        advances: [],
        reimbursements: [],
        vendors: [],
        auditLogs: [],
        settlements: [],
      };

      newEvent = logAudit(
        newEvent,
        'EVENT_CREATED',
        `Event "${name}" created with code ${code}. Total budget: ₹${totalBudget.toLocaleString('en-IN')}`
      );

      setEvents((prev) => [newEvent, ...prev]);
      setActiveEventId(newEvent.id);
      await syncEventToBackend(newEvent);
      return newEvent;
    },
    [currentUser, syncEventToBackend, logAudit]
  );

  // Join Event by code (from local memory, Firestore cloud database, demo presets, or backend API)
  const joinEvent = useCallback(
    async (code: string, userName: string): Promise<{ success: boolean; error?: string; event?: EventModel }> => {
      const cleanCode = extractEventCode(code);
      const cleanName = userName.trim();

      if (!cleanCode || cleanCode.length < 4) {
        return { success: false, error: 'Please enter a valid event code.' };
      }

      // 1. Check local state first
      let foundEvent = events.find((e) => e.code?.toUpperCase() === cleanCode);

      // 2. If not found locally, query Firestore cloud database
      if (!foundEvent) {
        try {
          const cloudEvent = await fetchEventByCode(cleanCode);
          if (cloudEvent) {
            foundEvent = cloudEvent;
          }
        } catch (err) {
          console.warn('Firestore code lookup error:', err);
        }
      }

      // 3. Fallback: Check built-in demo events
      if (!foundEvent) {
        if (cleanCode === 'X7K9P2' || cleanCode === 'TECHNOVA') {
          foundEvent = createTechnovaDemoEvent();
        } else if (cleanCode === 'IVPND6' || cleanCode === 'PONDY') {
          foundEvent = createPondicherryDemoTrip();
        }
      }

      // 4. Fallback: Query backend API /api/trips?code=...
      if (!foundEvent) {
        try {
          const res = await fetch(`/api/trips?code=${cleanCode}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.trip) {
              foundEvent = data.trip;
            } else if (Array.isArray(data?.trips)) {
              foundEvent = data.trips.find((t: any) => t.code?.toUpperCase() === cleanCode);
            }
          }
        } catch (err) {
          console.warn('API code lookup error:', err);
        }
      }

      if (!foundEvent) {
        return {
          success: false,
          error: `Event not found with code "${cleanCode}". Double-check the code or ask your event organizer!`,
        };
      }

      // Ensure all arrays are defined
      const sanitized = sanitizeLoadedEvent(foundEvent);

      const existingMember = sanitized.members.find(
        (m) => m.name.toLowerCase() === cleanName.toLowerCase()
      );

      if (existingMember) {
        setEvents((prev) => {
          const next = [sanitized, ...prev.filter((e) => e.id !== sanitized.id)];
          try {
            localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(next));
          } catch {}
          return next;
        });
        setActiveEventId(sanitized.id);
        setActiveTab('home');
        setMoreSubTab(null);
        if (existingMember.role) {
          setCurrentRole(existingMember.role);
          try {
            localStorage.setItem(STORAGE_KEY_ROLE, existingMember.role);
          } catch {}
        }
        try {
          localStorage.setItem(STORAGE_KEY_ACTIVE_EVENT, sanitized.id);
          localStorage.setItem(STORAGE_KEY_USER, JSON.stringify({ ...currentUser, name: cleanName }));
        } catch {}
        setCurrentUser((u) => ({ ...u, name: cleanName }));
        return { success: true, event: sanitized };
      }

      const newMember = {
        id: `mem-${Date.now()}`,
        eventId: sanitized.id,
        userId: currentUser.id,
        name: cleanName,
        color: getMemberColor(sanitized.members.length),
        role: 'member' as UserRole,
        joinedAt: new Date().toISOString().split('T')[0],
      };

      let updatedEvent: EventModel = {
        ...sanitized,
        members: [...sanitized.members, newMember],
      };

      updatedEvent = logAudit(updatedEvent, 'MEMBER_JOINED', `${cleanName} joined the event via code ${cleanCode}`);

      setEvents((prev) => {
        const next = [updatedEvent, ...prev.filter((e) => e.id !== updatedEvent.id)];
        try {
          localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(next));
        } catch {}
        return next;
      });

      setActiveEventId(updatedEvent.id);
      setActiveTab('home');
      setMoreSubTab(null);
      setCurrentRole('member');
      try {
        localStorage.setItem(STORAGE_KEY_ACTIVE_EVENT, updatedEvent.id);
        localStorage.setItem(STORAGE_KEY_ROLE, 'member');
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify({ ...currentUser, name: cleanName }));
      } catch {}
      setCurrentUser((u) => ({ ...u, name: cleanName }));
      await syncEventToBackend(updatedEvent);
      await broadcastChange('SYNC_EVENT', updatedEvent);

      return { success: true, event: updatedEvent };
    },
    [events, currentUser, syncEventToBackend, broadcastChange, logAudit]
  );

  // Money In: Add Income
  const addIncomeRecord = useCallback(
    async (recordData: Omit<IncomeRecord, 'id' | 'createdAt'>) => {
      if (!activeEvent) return;

      const newRecord: IncomeRecord = {
        ...recordData,
        id: `inc-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      let updatedEvent: EventModel = {
        ...activeEvent,
        incomeRecords: [newRecord, ...(activeEvent.incomeRecords || [])],
      };

      updatedEvent = logAudit(
        updatedEvent,
        'INCOME_ADDED',
        `Added income ₹${newRecord.amount.toLocaleString('en-IN')} from ${newRecord.source} (${newRecord.category})`
      );

      setEvents((prev) => prev.map((e) => (e.id === activeEvent.id ? updatedEvent : e)));
      await syncEventToBackend(updatedEvent);
      await broadcastChange('SYNC_EVENT', updatedEvent);
    },
    [activeEvent, syncEventToBackend, broadcastChange, logAudit]
  );

  // Update Category Budget
  const updateCategoryBudget = useCallback(
    async (categoryName: string, allocatedAmount: number, teamId?: string) => {
      if (!activeEvent) return;

      const existingIndex = (activeEvent.budgets || []).findIndex((b) => b.category === categoryName);
      let updatedBudgets = [...(activeEvent.budgets || [])];

      const teamObj = teamId ? activeEvent.teams.find((t) => t.id === teamId) : undefined;

      if (existingIndex >= 0) {
        updatedBudgets[existingIndex] = {
          ...updatedBudgets[existingIndex],
          allocatedAmount,
          teamId,
          teamName: teamObj?.name,
        };
      } else {
        updatedBudgets.push({
          id: `bgt-${Date.now()}`,
          eventId: activeEvent.id,
          category: categoryName,
          allocatedAmount,
          teamId,
          teamName: teamObj?.name,
        });
      }

      let updatedEvent: EventModel = {
        ...activeEvent,
        budgets: updatedBudgets,
      };

      updatedEvent = logAudit(
        updatedEvent,
        'BUDGET_UPDATED',
        `Set budget for ${categoryName} to ₹${allocatedAmount.toLocaleString('en-IN')}`
      );

      setEvents((prev) => prev.map((e) => (e.id === activeEvent.id ? updatedEvent : e)));
      await syncEventToBackend(updatedEvent);
      await broadcastChange('SYNC_EVENT', updatedEvent);
    },
    [activeEvent, syncEventToBackend, broadcastChange, logAudit]
  );

  // Add Team
  const addTeam = useCallback(
    async (name: string, budget: number, leadMemberId?: string): Promise<EventTeam> => {
      if (!activeEvent) throw new Error('No active event');

      const lead = leadMemberId ? activeEvent.members.find((m) => m.id === leadMemberId) : undefined;

      const newTeam: EventTeam = {
        id: `team-${Date.now()}`,
        eventId: activeEvent.id,
        name: name.trim(),
        budget,
        leadMemberId,
        leadMemberName: lead?.name,
      };

      let updatedEvent: EventModel = {
        ...activeEvent,
        teams: [...activeEvent.teams, newTeam],
      };

      updatedEvent = logAudit(
        updatedEvent,
        'TEAM_CREATED',
        `Created team "${name}" with budget ₹${budget.toLocaleString('en-IN')}`
      );

      setEvents((prev) => prev.map((e) => (e.id === activeEvent.id ? updatedEvent : e)));
      await syncEventToBackend(updatedEvent);
      await broadcastChange('SYNC_EVENT', updatedEvent);
      return newTeam;
    },
    [activeEvent, syncEventToBackend, broadcastChange, logAudit]
  );

  // Add Expense with Approval Routing
  const addExpense = useCallback(
    async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'currency' | 'approvalStatus'>) => {
      if (!activeEvent) return;

      const requiredApproval = getApprovalThresholdRole(expenseData.amount);
      const isAutoApproved = currentRole === 'event_admin' || currentRole === 'org_admin';

      let initialStatus: ApprovalStatus = isAutoApproved ? 'approved' : 'submitted';

      const newExpense: Expense = {
        ...expenseData,
        id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        currency: 'INR',
        approvalStatus: initialStatus,
        approvalThresholdNote: `${requiredApproval.label} (${expenseData.amount > 5000 ? '₹5,001+' : expenseData.amount > 1000 ? '₹1,001–₹5,000' : 'Up to ₹1,000'})`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let updatedReimbursements = [...(activeEvent.reimbursements || [])];

      // If paid with Personal Money -> Automatically create Reimbursement record
      if (expenseData.paymentSource === 'personal_money') {
        const newReimbursement: Reimbursement = {
          id: `rem-${Date.now()}`,
          eventId: activeEvent.id,
          expenseId: newExpense.id,
          memberId: newExpense.paidByMemberId,
          memberName: newExpense.paidByMemberName,
          amount: newExpense.amount,
          status: isAutoApproved ? 'approved' : 'pending',
          date: newExpense.date,
          notes: `Reimbursement for ${newExpense.merchant} (${newExpense.category})`,
          createdAt: new Date().toISOString(),
        };
        updatedReimbursements.unshift(newReimbursement);
      }

      let updatedEvent: EventModel = {
        ...activeEvent,
        expenses: [newExpense, ...activeEvent.expenses],
        reimbursements: updatedReimbursements,
      };

      updatedEvent = logAudit(
        updatedEvent,
        'EXPENSE_ADDED',
        `Added expense ₹${newExpense.amount.toLocaleString('en-IN')} for ${newExpense.merchant} (${newExpense.paymentSource})`
      );

      setEvents((prev) => prev.map((e) => (e.id === activeEvent.id ? updatedEvent : e)));
      await syncEventToBackend(updatedEvent);
      await broadcastChange('SYNC_EVENT', updatedEvent);
    },
    [activeEvent, currentRole, syncEventToBackend, broadcastChange, logAudit]
  );

  // Update Expense
  const updateExpense = useCallback(
    async (expenseId: string, updated: Partial<Expense>) => {
      if (!activeEvent) return;

      const updatedExpenses = activeEvent.expenses.map((e) =>
        e.id === expenseId ? { ...e, ...updated, updatedAt: new Date().toISOString() } : e
      );

      let updatedEvent: EventModel = {
        ...activeEvent,
        expenses: updatedExpenses,
      };

      updatedEvent = logAudit(updatedEvent, 'EXPENSE_UPDATED', `Updated expense details for ID ${expenseId}`);

      setEvents((prev) => prev.map((e) => (e.id === activeEvent.id ? updatedEvent : e)));
      await syncEventToBackend(updatedEvent);
      await broadcastChange('SYNC_EVENT', updatedEvent);
    },
    [activeEvent, syncEventToBackend, broadcastChange, logAudit]
  );

  // Delete Expense
  const deleteExpense = useCallback(
    async (expenseId: string) => {
      if (!activeEvent) return;

      const targetExpense = activeEvent.expenses.find((e) => e.id === expenseId);
      const updatedExpenses = activeEvent.expenses.filter((e) => e.id !== expenseId);
      const updatedReimbursements = (activeEvent.reimbursements || []).filter((r) => r.expenseId !== expenseId);

      let updatedEvent: EventModel = {
        ...activeEvent,
        expenses: updatedExpenses,
        reimbursements: updatedReimbursements,
      };

      updatedEvent = logAudit(
        updatedEvent,
        'EXPENSE_DELETED',
        `Deleted expense ₹${targetExpense?.amount || 0} (${targetExpense?.merchant || 'N/A'})`
      );

      setEvents((prev) => prev.map((e) => (e.id === activeEvent.id ? updatedEvent : e)));
      await syncEventToBackend(updatedEvent);
      await broadcastChange('SYNC_EVENT', updatedEvent);
    },
    [activeEvent, syncEventToBackend, broadcastChange, logAudit]
  );

  // Approve Expense
  const approveExpense = useCallback(
    async (expenseId: string, notes?: string) => {
      if (!activeEvent) return;

      const updatedExpenses = activeEvent.expenses.map((e) =>
        e.id === expenseId
          ? {
              ...e,
              approvalStatus: 'approved' as ApprovalStatus,
              reviewedBy: currentUser.name,
              reviewedAt: new Date().toISOString(),
              notes: notes ? `${e.notes || ''}\nApproval note: ${notes}` : e.notes,
              updatedAt: new Date().toISOString(),
            }
          : e
      );

      const updatedReimbursements = (activeEvent.reimbursements || []).map((r) =>
        r.expenseId === expenseId ? { ...r, status: 'approved' as const, approvedBy: currentUser.name } : r
      );

      const target = activeEvent.expenses.find((e) => e.id === expenseId);

      let updatedEvent: EventModel = {
        ...activeEvent,
        expenses: updatedExpenses,
        reimbursements: updatedReimbursements,
      };

      updatedEvent = logAudit(
        updatedEvent,
        'EXPENSE_APPROVED',
        `${currentUser.name} (${currentRole}) approved expense of ₹${target?.amount || 0} for ${target?.merchant}`
      );

      setEvents((prev) => prev.map((e) => (e.id === activeEvent.id ? updatedEvent : e)));
      await syncEventToBackend(updatedEvent);
      await broadcastChange('SYNC_EVENT', updatedEvent);
    },
    [activeEvent, currentUser, currentRole, syncEventToBackend, broadcastChange, logAudit]
  );

  // Reject Expense
  const rejectExpense = useCallback(
    async (expenseId: string, reason?: string) => {
      if (!activeEvent) return;

      const updatedExpenses = activeEvent.expenses.map((e) =>
        e.id === expenseId
          ? {
              ...e,
              approvalStatus: 'rejected' as ApprovalStatus,
              reviewedBy: currentUser.name,
              reviewedAt: new Date().toISOString(),
              notes: reason ? `${e.notes || ''}\nRejection reason: ${reason}` : e.notes,
              updatedAt: new Date().toISOString(),
            }
          : e
      );

      const updatedReimbursements = (activeEvent.reimbursements || []).map((r) =>
        r.expenseId === expenseId ? { ...r, status: 'rejected' as const } : r
      );

      const target = activeEvent.expenses.find((e) => e.id === expenseId);

      let updatedEvent: EventModel = {
        ...activeEvent,
        expenses: updatedExpenses,
        reimbursements: updatedReimbursements,
      };

      updatedEvent = logAudit(
        updatedEvent,
        'EXPENSE_REJECTED',
        `Rejected expense of ₹${target?.amount || 0} for ${target?.merchant}. Reason: ${reason || 'Not specified'}`
      );

      setEvents((prev) => prev.map((e) => (e.id === activeEvent.id ? updatedEvent : e)));
      await syncEventToBackend(updatedEvent);
      await broadcastChange('SYNC_EVENT', updatedEvent);
    },
    [activeEvent, currentUser, syncEventToBackend, broadcastChange, logAudit]
  );

  // Mark Expense Paid
  const markExpensePaid = useCallback(
    async (expenseId: string) => {
      if (!activeEvent) return;

      const updatedExpenses = activeEvent.expenses.map((e) =>
        e.id === expenseId ? { ...e, approvalStatus: 'paid' as ApprovalStatus, updatedAt: new Date().toISOString() } : e
      );

      const updatedReimbursements = (activeEvent.reimbursements || []).map((r) =>
        r.expenseId === expenseId ? { ...r, status: 'paid' as const, paidAt: new Date().toISOString() } : r
      );

      let updatedEvent: EventModel = {
        ...activeEvent,
        expenses: updatedExpenses,
        reimbursements: updatedReimbursements,
      };

      updatedEvent = logAudit(updatedEvent, 'EXPENSE_MARKED_PAID', `Marked expense ID ${expenseId} as paid`);

      setEvents((prev) => prev.map((e) => (e.id === activeEvent.id ? updatedEvent : e)));
      await syncEventToBackend(updatedEvent);
      await broadcastChange('SYNC_EVENT', updatedEvent);
    },
    [activeEvent, syncEventToBackend, broadcastChange, logAudit]
  );

  // Add Advance
  const addAdvance = useCallback(
    async (advanceData: Omit<EventAdvance, 'id' | 'createdAt' | 'amountSpent' | 'returnedAmount' | 'status'>) => {
      if (!activeEvent) return;

      const newAdvance: EventAdvance = {
        ...advanceData,
        id: `adv-${Date.now()}`,
        amountSpent: 0,
        returnedAmount: 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      let updatedEvent: EventModel = {
        ...activeEvent,
        advances: [newAdvance, ...(activeEvent.advances || [])],
      };

      updatedEvent = logAudit(
        updatedEvent,
        'ADVANCE_ISSUED',
        `Issued event advance of ₹${newAdvance.amountReceived.toLocaleString('en-IN')} to ${newAdvance.memberName}`
      );

      setEvents((prev) => prev.map((e) => (e.id === activeEvent.id ? updatedEvent : e)));
      await syncEventToBackend(updatedEvent);
      await broadcastChange('SYNC_EVENT', updatedEvent);
    },
    [activeEvent, syncEventToBackend, broadcastChange, logAudit]
  );

  // Settle Advance
  const settleAdvance = useCallback(
    async (advanceId: string, spentAmount: number, returnedAmount: number, notes?: string) => {
      if (!activeEvent) return;

      const updatedAdvances = (activeEvent.advances || []).map((a) => {
        if (a.id === advanceId) {
          const totalAccounted = spentAmount + returnedAmount;
          const status = totalAccounted >= a.amountReceived ? 'settled' : 'partially_settled';
          return {
            ...a,
            amountSpent: spentAmount,
            returnedAmount,
            status: status as any,
            notes: notes || a.notes,
          };
        }
        return a;
      });

      const target = (activeEvent.advances || []).find((a) => a.id === advanceId);

      let updatedEvent: EventModel = {
        ...activeEvent,
        advances: updatedAdvances,
      };

      updatedEvent = logAudit(
        updatedEvent,
        'ADVANCE_SETTLED',
        `Settled advance for ${target?.memberName} (Spent: ₹${spentAmount}, Returned: ₹${returnedAmount})`
      );

      setEvents((prev) => prev.map((e) => (e.id === activeEvent.id ? updatedEvent : e)));
      await syncEventToBackend(updatedEvent);
      await broadcastChange('SYNC_EVENT', updatedEvent);
    },
    [activeEvent, syncEventToBackend, broadcastChange, logAudit]
  );

  // Reimbursements
  const approveReimbursement = useCallback(
    async (reimbursementId: string) => {
      if (!activeEvent) return;

      const updatedReimbursements = (activeEvent.reimbursements || []).map((r) =>
        r.id === reimbursementId ? { ...r, status: 'approved' as const, approvedBy: currentUser.name } : r
      );

      let updatedEvent: EventModel = {
        ...activeEvent,
        reimbursements: updatedReimbursements,
      };

      updatedEvent = logAudit(updatedEvent, 'REIMBURSEMENT_APPROVED', `Approved reimbursement ID ${reimbursementId}`);

      setEvents((prev) => prev.map((e) => (e.id === activeEvent.id ? updatedEvent : e)));
      await syncEventToBackend(updatedEvent);
      await broadcastChange('SYNC_EVENT', updatedEvent);
    },
    [activeEvent, currentUser.name, syncEventToBackend, broadcastChange, logAudit]
  );

  const markReimbursementPaid = useCallback(
    async (reimbursementId: string) => {
      if (!activeEvent) return;

      const updatedReimbursements = (activeEvent.reimbursements || []).map((r) =>
        r.id === reimbursementId ? { ...r, status: 'paid' as const, paidAt: new Date().toISOString() } : r
      );

      let updatedEvent: EventModel = {
        ...activeEvent,
        reimbursements: updatedReimbursements,
      };

      updatedEvent = logAudit(updatedEvent, 'REIMBURSEMENT_PAID', `Marked reimbursement ID ${reimbursementId} as paid`);

      setEvents((prev) => prev.map((e) => (e.id === activeEvent.id ? updatedEvent : e)));
      await syncEventToBackend(updatedEvent);
      await broadcastChange('SYNC_EVENT', updatedEvent);
    },
    [activeEvent, syncEventToBackend, broadcastChange, logAudit]
  );

  // Vendors
  const addVendor = useCallback(
    async (vendorData: Omit<Vendor, 'id' | 'createdAt' | 'paidAmount' | 'pendingAmount' | 'status'>) => {
      if (!activeEvent) return;

      const newVendor: Vendor = {
        ...vendorData,
        id: `vnd-${Date.now()}`,
        paidAmount: 0,
        pendingAmount: vendorData.totalContract,
        status: 'unpaid',
        createdAt: new Date().toISOString(),
      };

      let updatedEvent: EventModel = {
        ...activeEvent,
        vendors: [newVendor, ...(activeEvent.vendors || [])],
      };

      updatedEvent = logAudit(
        updatedEvent,
        'VENDOR_ADDED',
        `Added vendor contract "${newVendor.name}" for ₹${newVendor.totalContract.toLocaleString('en-IN')}`
      );

      setEvents((prev) => prev.map((e) => (e.id === activeEvent.id ? updatedEvent : e)));
      await syncEventToBackend(updatedEvent);
      await broadcastChange('SYNC_EVENT', updatedEvent);
    },
    [activeEvent, syncEventToBackend, broadcastChange, logAudit]
  );

  const recordVendorPayment = useCallback(
    async (vendorId: string, paymentAmount: number) => {
      if (!activeEvent) return;

      const updatedVendors = (activeEvent.vendors || []).map((v) => {
        if (v.id === vendorId) {
          const newPaid = v.paidAmount + paymentAmount;
          const newPending = Math.max(0, v.totalContract - newPaid);
          const newStatus = newPending === 0 ? 'paid' : 'partial';
          return {
            ...v,
            paidAmount: newPaid,
            pendingAmount: newPending,
            status: newStatus as any,
          };
        }
        return v;
      });

      const target = (activeEvent.vendors || []).find((v) => v.id === vendorId);

      let updatedEvent: EventModel = {
        ...activeEvent,
        vendors: updatedVendors,
      };

      updatedEvent = logAudit(
        updatedEvent,
        'VENDOR_PAYMENT',
        `Paid ₹${paymentAmount.toLocaleString('en-IN')} to vendor "${target?.name}"`
      );

      setEvents((prev) => prev.map((e) => (e.id === activeEvent.id ? updatedEvent : e)));
      await syncEventToBackend(updatedEvent);
      await broadcastChange('SYNC_EVENT', updatedEvent);
    },
    [activeEvent, syncEventToBackend, broadcastChange, logAudit]
  );

  // Record Settlement
  const recordSettlement = useCallback(
    async (settlementData: Omit<Settlement, 'id' | 'createdAt' | 'time'>) => {
      if (!activeEvent) return;

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newSettlement: Settlement = {
        ...settlementData,
        id: `stl-${Date.now()}`,
        time: timeStr,
        createdAt: now.toISOString(),
      };

      let updatedEvent: EventModel = {
        ...activeEvent,
        settlements: [newSettlement, ...(activeEvent.settlements || [])],
      };

      updatedEvent = logAudit(
        updatedEvent,
        'SETTLEMENT_RECORDED',
        `${newSettlement.fromMemberName} paid ₹${newSettlement.amount.toLocaleString('en-IN')} to ${newSettlement.toMemberName}`
      );

      setEvents((prev) => prev.map((e) => (e.id === activeEvent.id ? updatedEvent : e)));
      await syncEventToBackend(updatedEvent);
      await broadcastChange('SYNC_EVENT', updatedEvent);
    },
    [activeEvent, syncEventToBackend, broadcastChange, logAudit]
  );

  // Add Member
  const addMember = useCallback(
    async (name: string, email?: string, role: UserRole = 'member', teamId?: string) => {
      if (!activeEvent) throw new Error('No active event');

      const team = teamId ? activeEvent.teams.find((t) => t.id === teamId) : undefined;

      const newMember = {
        id: `mem-${Date.now()}`,
        eventId: activeEvent.id,
        name: name.trim(),
        email: email?.trim(),
        color: getMemberColor(activeEvent.members.length),
        role,
        teamId,
        teamName: team?.name,
        joinedAt: new Date().toISOString().split('T')[0],
      };

      let updatedEvent: EventModel = {
        ...activeEvent,
        members: [...activeEvent.members, newMember],
      };

      updatedEvent = logAudit(
        updatedEvent,
        'MEMBER_ADDED',
        `Added member "${name}" (${role}${team ? ` - ${team.name}` : ''})`
      );

      setEvents((prev) => prev.map((e) => (e.id === activeEvent.id ? updatedEvent : e)));
      await syncEventToBackend(updatedEvent);
      await broadcastChange('SYNC_EVENT', updatedEvent);
      return newMember;
    },
    [activeEvent, syncEventToBackend, broadcastChange, logAudit]
  );

  // Update Member
  const updateMember = useCallback(
    async (memberId: string, newName: string, role?: UserRole, teamId?: string) => {
      if (!activeEvent) return;

      const team = teamId ? activeEvent.teams.find((t) => t.id === teamId) : undefined;

      const updatedMembers = activeEvent.members.map((m) =>
        m.id === memberId
          ? {
              ...m,
              name: newName.trim(),
              role: role || m.role,
              teamId: teamId || m.teamId,
              teamName: team ? team.name : m.teamName,
            }
          : m
      );

      let updatedEvent: EventModel = {
        ...activeEvent,
        members: updatedMembers,
      };

      updatedEvent = logAudit(updatedEvent, 'MEMBER_UPDATED', `Updated member profile for "${newName}"`);

      setEvents((prev) => prev.map((e) => (e.id === activeEvent.id ? updatedEvent : e)));
      await syncEventToBackend(updatedEvent);
      await broadcastChange('SYNC_EVENT', updatedEvent);
    },
    [activeEvent, syncEventToBackend, broadcastChange, logAudit]
  );

  // Remove Member
  const removeMember = useCallback(
    async (memberId: string): Promise<{ success: boolean; error?: string }> => {
      if (!activeEvent) return { success: false, error: 'No active event' };

      const hasPaid = activeEvent.expenses.some((e) => e.paidByMemberId === memberId);
      const hasSplit = activeEvent.expenses.some((e) => e.splits.some((s) => s.memberId === memberId));

      if (hasPaid || hasSplit) {
        return {
          success: false,
          error: 'This member has recorded expenses or shares. Please reassign or remove their expenses first.',
        };
      }

      let updatedEvent: EventModel = {
        ...activeEvent,
        members: activeEvent.members.filter((m) => m.id !== memberId),
      };

      updatedEvent = logAudit(updatedEvent, 'MEMBER_REMOVED', `Removed member ID ${memberId}`);

      setEvents((prev) => prev.map((e) => (e.id === activeEvent.id ? updatedEvent : e)));
      await syncEventToBackend(updatedEvent);
      await broadcastChange('SYNC_EVENT', updatedEvent);
      return { success: true };
    },
    [activeEvent, syncEventToBackend, broadcastChange, logAudit]
  );

  // Event Financial Closure & Archive
  const closeEvent = useCallback(async () => {
    if (!activeEvent) return;

    let updatedEvent: EventModel = {
      ...activeEvent,
      status: 'completed',
    };

    updatedEvent = logAudit(updatedEvent, 'EVENT_CLOSED', `Event "${activeEvent.name}" officially closed & archived.`);

    setEvents((prev) => prev.map((e) => (e.id === activeEvent.id ? updatedEvent : e)));
    await syncEventToBackend(updatedEvent);
    await broadcastChange('SYNC_EVENT', updatedEvent);
  }, [activeEvent, syncEventToBackend, broadcastChange, logAudit]);

  // Delete Event
  const deleteEvent = useCallback(
    async (eventId: string) => {
      const target = events.find((e) => e.id === eventId);
      const remaining = events.filter((e) => e.id !== eventId);
      setEvents(remaining);
      try {
        localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(remaining));
      } catch (e) {
        console.error(e);
      }
      if (remaining.length > 0) {
        setActiveEventId(remaining[0].id);
      } else {
        setActiveEventId(null);
        try {
          localStorage.removeItem(STORAGE_KEY_ACTIVE_EVENT);
        } catch (e) {
          console.error(e);
        }
      }
      try {
        await fetch(`/api/trips/${eventId}`, { method: 'DELETE' });
      } catch (e) {
        console.error(e);
      }
      if (target) {
        try {
          await deleteEventFromFirestore(target.id, target.code);
        } catch (e) {
          console.warn('Firestore deletion failed:', e);
        }
      }
    },
    [events]
  );

  // Clear all data (remove dummy/sample events)
  const clearAllData = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY_EVENTS);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_EVENT);
    setEvents([]);
    setActiveEventId(null);
    try {
      await fetch('/api/trips', { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Reset demo events
  const resetToDemoEvents = useCallback(() => {
    const technova = createTechnovaDemoEvent();
    const pondy = createPondicherryDemoTrip();
    setEvents([technova, pondy]);
    setActiveEventId(technova.id);
    setCurrentUser(DEMO_USER);
    setCurrentRole('finance_manager');
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        currentRole,
        setCurrentRole,
        events,
        activeEventId,
        activeEvent,
        setActiveEventId,
        createEvent,
        joinEvent,
        addIncomeRecord,
        updateCategoryBudget,
        addTeam,
        addExpense,
        updateExpense,
        deleteExpense,
        approveExpense,
        rejectExpense,
        markExpensePaid,
        addAdvance,
        settleAdvance,
        approveReimbursement,
        markReimbursementPaid,
        addVendor,
        recordVendorPayment,
        recordSettlement,
        addMember,
        updateMember,
        removeMember,
        closeEvent,
        deleteEvent,
        resetToDemoEvents,
        clearAllData,
        isOnline,
        isSyncing,
        activeTab,
        setActiveTab,
        moreSubTab,
        setMoreSubTab,
        isAddExpenseOpen,
        setIsAddExpenseOpen,
        selectedExpense,
        setSelectedExpense,
        broadcastChange,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
