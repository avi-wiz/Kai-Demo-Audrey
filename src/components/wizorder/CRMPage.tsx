'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePageContext } from '@/contexts/PageContext';
import { useSharedCRM } from '@/contexts/shared/SharedCRMContext';
import WizOrderPage from './WizOrderPage';
import type { WizOrderTask, WizOrderLead, WizOrderDeal } from '@/lib/types';

type CRMTab = 'tasks' | 'leads' | 'deals';

// ── Badge helpers ─────────────────────────────────────────────────────────────

function badge(bg: string, color: string, label: string, border?: string) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 8px', borderRadius: 20,
      fontSize: 11, fontWeight: 600, fontFamily: 'var(--display)',
      letterSpacing: '0.2px', background: bg, color, whiteSpace: 'nowrap',
      border: border ? `1px solid ${border}` : 'none',
    }}>
      {label}
    </span>
  );
}

const PRIORITY_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  High:   { bg: 'var(--badge-danger-bg)',  text: 'var(--badge-danger-text)',  border: 'var(--badge-danger-border)' },
  Medium: { bg: 'var(--badge-warning-bg)', text: 'var(--badge-warning-text)', border: 'var(--badge-warning-border)' },
  Low:    { bg: 'var(--badge-neutral-bg)', text: 'var(--badge-neutral-text)', border: 'var(--badge-neutral-border)' },
};

const TASK_STATUS_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  Open:        { bg: 'var(--badge-info-bg)',    text: 'var(--badge-info-text)',    border: 'var(--badge-info-border)' },
  'In Progress':{ bg: 'var(--badge-warning-bg)', text: 'var(--badge-warning-text)', border: 'var(--badge-warning-border)' },
  Overdue:     { bg: 'var(--badge-danger-bg)',  text: 'var(--badge-danger-text)',  border: 'var(--badge-danger-border)' },
  Completed:   { bg: 'var(--badge-success-bg)', text: 'var(--badge-success-text)', border: 'var(--badge-success-border)' },
};

const LEAD_STATUS_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  New:       { bg: 'var(--badge-info-bg)',    text: 'var(--badge-info-text)',    border: 'var(--badge-info-border)' },
  Contacted: { bg: 'var(--badge-warning-bg)', text: 'var(--badge-warning-text)', border: 'var(--badge-warning-border)' },
  Qualified: { bg: 'var(--badge-success-bg)', text: 'var(--badge-success-text)', border: 'var(--badge-success-border)' },
};

const DEAL_STAGE_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  Qualified:       { bg: 'var(--badge-info-bg)',    text: 'var(--badge-info-text)',    border: 'var(--badge-info-border)' },
  'Proposal Sent': { bg: 'var(--badge-warning-bg)', text: 'var(--badge-warning-text)', border: 'var(--badge-warning-border)' },
  Negotiation:     { bg: 'var(--badge-warning-bg)', text: 'var(--badge-warning-text)', border: 'var(--badge-warning-border)' },
  'Closed Won':    { bg: 'var(--badge-success-bg)', text: 'var(--badge-success-text)', border: 'var(--badge-success-border)' },
};

function PriorityBadge({ priority }: { priority: string }) {
  const { bg, text, border } = PRIORITY_BADGE[priority] ?? { bg: 'var(--badge-neutral-bg)', text: 'var(--badge-neutral-text)', border: 'var(--badge-neutral-border)' };
  return badge(bg, text, priority, border);
}

function TaskStatusBadge({ status }: { status: string }) {
  const { bg, text, border } = TASK_STATUS_BADGE[status] ?? { bg: 'var(--badge-neutral-bg)', text: 'var(--badge-neutral-text)', border: 'var(--badge-neutral-border)' };
  return badge(bg, text, status, border);
}

function LeadStatusBadge({ status }: { status: string }) {
  const { bg, text, border } = LEAD_STATUS_BADGE[status] ?? { bg: 'var(--badge-neutral-bg)', text: 'var(--badge-neutral-text)', border: 'var(--badge-neutral-border)' };
  return badge(bg, text, status, border);
}

function DealStageBadge({ stage }: { stage: string }) {
  const { bg, text, border } = DEAL_STAGE_BADGE[stage] ?? { bg: 'var(--badge-neutral-bg)', text: 'var(--badge-neutral-text)', border: 'var(--badge-neutral-border)' };
  return badge(bg, text, stage, border);
}

function KaiBadge() {
  return (
    <>
      <style>{`
        @keyframes kaiBadgePulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); box-shadow: 0 0 10px var(--ai-accent-border); }
          100% { transform: scale(1); }
        }
      `}</style>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        padding: '2px 7px', borderRadius: 10,
        fontSize: 10, fontWeight: 700, fontFamily: 'var(--display)',
        background: 'rgba(91, 106, 240, 0.14)',
        color: 'rgba(91, 106, 240, 1)',
        border: '1px solid rgba(91, 106, 240, 0.28)',
        marginLeft: 8, letterSpacing: '0.2px',
        animation: 'kaiBadgePulse 600ms ease-out forwards',
        animationIterationCount: 1,
      }}>
        ✦ Kai
      </span>
    </>
  );
}

// ── Table shell ───────────────────────────────────────────────────────────────

function TableShell({ headers, alignRight, children, empty }: {
  headers: string[];
  alignRight?: number[];
  children: React.ReactNode;
  empty: boolean;
}) {
  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 12,
      border: '1px solid var(--border)', overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--surface2)' }}>
            {headers.map((h, i) => (
              <th key={h} style={{
                padding: '10px 16px',
                textAlign: alignRight?.includes(i) ? 'right' : 'left',
                fontFamily: 'var(--display)', fontSize: 10.5, fontWeight: 600,
                color: 'var(--text3)', letterSpacing: '0.05em',
                textTransform: 'uppercase', borderBottom: '1px solid var(--border)',
                whiteSpace: 'nowrap',
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {empty ? (
            <tr>
              <td colSpan={headers.length} style={{
                padding: '40px 16px', textAlign: 'center',
                fontFamily: 'var(--display)', fontSize: 13, color: 'var(--text3)',
              }}>
                No records found
              </td>
            </tr>
          ) : children}
        </tbody>
      </table>
    </div>
  );
}

function Td({ children, right, mono, style: extraStyle }: {
  children: React.ReactNode;
  right?: boolean;
  mono?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <td style={{
      padding: '12px 16px',
      textAlign: right ? 'right' : 'left',
      fontFamily: mono ? 'var(--mono)' : 'var(--display)',
      fontSize: mono ? 12 : 13,
      fontWeight: mono ? 500 : 400,
      color: 'var(--text2)',
      whiteSpace: 'nowrap',
      ...extraStyle,
    }}>
      {children}
    </td>
  );
}

// ── Tasks table ───────────────────────────────────────────────────────────────

function TasksTable({ tasks }: { tasks: WizOrderTask[] }) {
  return (
    <TableShell
      headers={['Title', 'Due Date', 'Priority', 'Status', 'Customer', 'Assigned To']}
      empty={tasks.length === 0}
    >
      {tasks.map((task, idx) => {
        const isLast = idx === tasks.length - 1;
        const dateStr = task.dueDate
          ? new Date(task.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : '—';
        return (
          <tr key={task.id} style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
            <td style={{ padding: '12px 16px' }}>
              <span style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                {task.title}
              </span>
              {task.createdByKai && <KaiBadge />}
            </td>
            <Td mono>{dateStr}</Td>
            <Td><PriorityBadge priority={task.priority} /></Td>
            <Td><TaskStatusBadge status={task.status} /></Td>
            <Td>{task.customer ?? '—'}</Td>
            <Td>{task.assignedTo}</Td>
          </tr>
        );
      })}
    </TableShell>
  );
}

// ── Leads table ───────────────────────────────────────────────────────────────

function LeadsTable({ leads }: { leads: WizOrderLead[] }) {
  return (
    <TableShell
      headers={['Company', 'Contact', 'Source', 'Status', 'Assigned To', 'Last Contact']}
      empty={leads.length === 0}
    >
      {leads.map((lead, idx) => {
        const isLast = idx === leads.length - 1;
        const lastContactStr = lead.lastContact
          ? new Date(lead.lastContact + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : '—';
        return (
          <tr key={lead.id} style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
            <td style={{ padding: '12px 16px' }}>
              <span style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                {lead.name}
              </span>
              {lead.createdByKai && <KaiBadge />}
            </td>
            <Td>{lead.contact}</Td>
            <Td>{lead.source}</Td>
            <Td><LeadStatusBadge status={lead.status} /></Td>
            <Td>{lead.assignedTo}</Td>
            <Td mono>{lastContactStr}</Td>
          </tr>
        );
      })}
    </TableShell>
  );
}

// ── Deals table ───────────────────────────────────────────────────────────────

function DealsTable({ deals }: { deals: WizOrderDeal[] }) {
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
  return (
    <TableShell
      headers={['Deal', 'Value', 'Stage', 'Customer', 'Rep', 'Close Date']}
      alignRight={[1]}
      empty={deals.length === 0}
    >
      {deals.map((deal, idx) => {
        const isLast = idx === deals.length - 1;
        const closeDateStr = deal.closeDate
          ? new Date(deal.closeDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : '—';
        return (
          <tr key={deal.id} style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
            <td style={{ padding: '12px 16px' }}>
              <span style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                {deal.name}
              </span>
            </td>
            <Td right mono style={{ color: 'var(--text)', fontWeight: 600, fontSize: 13 }}>
              {fmt.format(deal.value)}
            </Td>
            <Td><DealStageBadge stage={deal.stage} /></Td>
            <Td>{deal.customer}</Td>
            <Td>{deal.rep}</Td>
            <Td mono>{closeDateStr}</Td>
          </tr>
        );
      })}
    </TableShell>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CRMPage() {
  const { setPage } = usePageContext();
  const { allTasks, allLeads, allDeals } = useSharedCRM();
  const [activeTab, setActiveTab] = useState<CRMTab>('tasks');

  // Hide archived leads (e.g. Cap 4 merge archives the source lead).
  // Memoize so the array identity is stable across renders — otherwise setPage's
  // useEffect dependency triggers an infinite update loop.
  const visibleLeads = useMemo(() => allLeads.filter(l => !l.archived), [allLeads]);

  useEffect(() => {
    setPage('crm', { tasks: allTasks, leads: visibleLeads, deals: allDeals });
  }, [setPage, allTasks, visibleLeads, allDeals]);

  const TABS: { id: CRMTab; label: string; count: number }[] = [
    { id: 'tasks',  label: 'Tasks',  count: allTasks.length },
    { id: 'leads',  label: 'Leads',  count: visibleLeads.length },
    { id: 'deals',  label: 'Deals',  count: allDeals.length },
  ];

  return (
    <WizOrderPage
      title="CRM"
      icon="✅"
      subtitle="Track tasks, leads, and deals across your team."
    >
      {/* Tab nav */}
      <div style={{
        display: 'flex',
        gap: 0,
        borderBottom: '1px solid var(--border)',
        marginBottom: 16,
        marginTop: -4,
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              fontFamily: 'var(--display)',
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 600 : 500,
              color: activeTab === tab.id ? 'var(--primary-80)' : 'var(--text2)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary-80)' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: -1,
              transition: 'all 200ms ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {tab.label}
            <span style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              fontWeight: 500,
              padding: '1px 5px',
              borderRadius: 8,
              background: activeTab === tab.id ? 'rgba(22,136,95,0.1)' : 'var(--surface2)',
              color: activeTab === tab.id ? 'var(--primary-80)' : 'var(--text3)',
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {activeTab === 'tasks' && <TasksTable tasks={allTasks} />}
      {activeTab === 'leads' && <LeadsTable leads={visibleLeads} />}
      {activeTab === 'deals' && <DealsTable deals={allDeals} />}
    </WizOrderPage>
  );
}
