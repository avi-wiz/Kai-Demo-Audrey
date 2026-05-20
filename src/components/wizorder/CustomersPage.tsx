'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePageContext } from '@/contexts/PageContext';
import { useSharedCustomers } from '@/contexts/shared/SharedCustomersContext';
import { useSharedCRM } from '@/contexts/shared/SharedCRMContext';
import WizOrderPage from './WizOrderPage';
import { LEADS } from '@/data/audreys';
import type { WizOrderCustomer } from '@/lib/types';
import type { AudreyLead } from '@/data/audreys/synthetic/leads';

const TODAY = new Date('2026-05-20T00:00:00');

function daysSince(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00');
  return Math.floor((TODAY.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Status / Risk badge ────────────────────────────────────────────────────────

type RiskLevel = 'Active' | 'Warning' | 'Dormant';

function riskLevel(customer: WizOrderCustomer): RiskLevel {
  const s = customer.status;
  if (s === 'Dormant') return 'Dormant';
  if (s === 'Warning') return 'Warning';
  return 'Active';
}

const RISK_BADGE: Record<RiskLevel, { bg: string; text: string; border: string }> = {
  Active:  { bg: 'var(--badge-success-bg)', text: 'var(--badge-success-text)', border: 'var(--badge-success-border)' },
  Warning: { bg: 'var(--badge-warning-bg)', text: 'var(--badge-warning-text)', border: 'var(--badge-warning-border)' },
  Dormant: { bg: 'var(--badge-danger-bg)',  text: 'var(--badge-danger-text)',  border: 'var(--badge-danger-border)' },
};

function StatusBadge({ level }: { level: RiskLevel }) {
  const s = RISK_BADGE[level];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 8px', borderRadius: 20,
      fontSize: 11, fontWeight: 600, fontFamily: 'var(--display)',
      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      {level}
    </span>
  );
}

// ── Lead stage badge ──────────────────────────────────────────────────────────

const STAGE_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  New:       { bg: 'var(--badge-neutral-bg)', text: 'var(--badge-neutral-text)', border: 'var(--badge-neutral-border)' },
  Contacted: { bg: 'var(--badge-info-bg)',    text: 'var(--badge-info-text)',    border: 'var(--badge-info-border)' },
  Qualified: { bg: 'var(--badge-warning-bg)', text: 'var(--badge-warning-text)', border: 'var(--badge-warning-border)' },
  Proposal:  { bg: 'var(--badge-info-bg)',    text: 'var(--badge-info-text)',    border: 'var(--badge-info-border)' },
  Won:       { bg: 'var(--badge-success-bg)', text: 'var(--badge-success-text)', border: 'var(--badge-success-border)' },
};

function StageBadge({ stage }: { stage: string }) {
  const s = STAGE_BADGE[stage] ?? STAGE_BADGE.New;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 8px', borderRadius: 20,
      fontSize: 11, fontWeight: 600, fontFamily: 'var(--display)',
      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      {stage}
    </span>
  );
}

// ── Tag/collection pill ────────────────────────────────────────────────────────

const COLLECTION_COLORS: Record<string, { bg: string; color: string }> = {
  'A Blooming Porch':  { bg: 'rgba(249,115,22,0.10)', color: '#C2410C' },
  'Gardeners Grove':   { bg: 'rgba(22,163,74,0.10)',  color: '#15803D' },
  'The Herb Garden':   { bg: 'rgba(20,184,166,0.10)', color: '#0F766E' },
  'Bunnies':           { bg: 'rgba(236,72,153,0.10)', color: '#BE185D' },
  'Garden Evergreen':  { bg: 'rgba(59,130,246,0.10)', color: '#1D4ED8' },
  'Spring & Summer':   { bg: 'rgba(234,179,8,0.10)',  color: '#B45309' },
};

function CollectionPill({ name }: { name: string }) {
  const s = COLLECTION_COLORS[name] ?? { bg: 'rgba(139,148,158,0.12)', color: '#586476' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 20,
      fontSize: 10, fontWeight: 600, fontFamily: 'var(--display)',
      letterSpacing: '0.2px',
      background: s.bg, color: s.color,
      whiteSpace: 'nowrap',
    }}>
      {name}
    </span>
  );
}

// ── Kai badge ─────────────────────────────────────────────────────────────────

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
        padding: '2px 6px', borderRadius: 10,
        fontSize: 10, fontWeight: 700, fontFamily: 'var(--display)',
        background: 'var(--ai-accent-bg)', color: 'var(--ai-accent-text)',
        letterSpacing: '0.1px',
        animation: 'kaiBadgePulse 600ms ease-out forwards',
        animationIterationCount: 1,
      }}>
        ✦ Kai
      </span>
    </>
  );
}

// ── Customer card ─────────────────────────────────────────────────────────────

function CustomerCard({ customer }: { customer: WizOrderCustomer }) {
  const [hovered, setHovered] = useState(false);
  const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });
  const risk = riskLevel(customer);

  const lastOrderStr = customer.lastOrder
    ? new Date(customer.lastOrder + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  const days = customer.lastOrder ? daysSince(customer.lastOrder) : null;

  // AudreyCustomer carries preferredCollections — access defensively
  const collections: string[] = ((customer as unknown as Record<string, unknown>)['preferredCollections'] as string[] | undefined) ?? [];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${risk === 'Active' ? 'var(--border)' : risk === 'Warning' ? 'var(--badge-warning-border)' : 'var(--badge-danger-border)'}`,
        borderRadius: 10,
        padding: 16,
        display: 'flex', flexDirection: 'column', gap: 12,
        transition: 'box-shadow 150ms ease',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
        cursor: 'default',
      }}
    >
      {/* Name row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.2px' }}>
              {customer.name}
            </span>
            {customer.createdByKai && <KaiBadge />}
          </div>
          <span style={{ fontFamily: 'var(--display)', fontSize: 12, color: 'var(--text3)' }}>
            {customer.contact}
          </span>
        </div>
        <StatusBadge level={risk} />
      </div>

      {/* Collection pills */}
      {collections.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {collections.slice(0, 3).map(c => <CollectionPill key={c} name={c} />)}
        </div>
      )}

      {/* Metrics */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        paddingTop: 8, borderTop: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Lifetime Revenue
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            {fmt.format(customer.lifetimeRevenue)}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Last Order
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 500, color: risk !== 'Active' ? 'var(--badge-warning-text)' : 'var(--text2)' }}>
            {lastOrderStr}
            {days !== null && risk !== 'Active' && (
              <span style={{ marginLeft: 4, color: risk === 'Dormant' ? 'var(--badge-danger-text)' : 'var(--badge-warning-text)' }}>
                ({days}d ago)
              </span>
            )}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Orders YTD
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
            {customer.ordersYTD}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Rep
          </span>
          <span style={{ fontFamily: 'var(--display)', fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>
            {customer.rep}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Lead card ─────────────────────────────────────────────────────────────────

function LeadCard({ lead }: { lead: AudreyLead }) {
  const [hovered, setHovered] = useState(false);
  const collections: string[] = lead.preferredCollections ?? [];
  const lastContactStr = lead.lastContact
    ? new Date(lead.lastContact + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';
  const days = lead.lastContact ? daysSince(lead.lastContact) : null;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 16,
        display: 'flex', flexDirection: 'column', gap: 12,
        transition: 'box-shadow 150ms ease',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
        cursor: 'default',
      }}
    >
      {/* Name row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.2px' }}>
            {lead.name}
          </span>
          <span style={{ fontFamily: 'var(--display)', fontSize: 12, color: 'var(--text3)' }}>
            {lead.contact} · {lead.region}
          </span>
        </div>
        <StageBadge stage={lead.status} />
      </div>

      {/* Collection pills */}
      {collections.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {collections.slice(0, 3).map(c => <CollectionPill key={c} name={c} />)}
        </div>
      )}

      {/* Meta row */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
        paddingTop: 8, borderTop: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Source
          </span>
          <span style={{ fontFamily: 'var(--display)', fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>
            {lead.source}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Last Contact
          </span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>
            {lastContactStr}
            {days !== null && days > 14 && (
              <span style={{ marginLeft: 4, color: 'var(--text3)' }}>({days}d ago)</span>
            )}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, gridColumn: '1 / -1' }}>
          <span style={{ fontFamily: 'var(--display)', fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Rep
          </span>
          <span style={{ fontFamily: 'var(--display)', fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>
            {lead.assignedTo}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = 'customers' | 'leads';

export default function CustomersPage() {
  const { setPage } = usePageContext();
  const { allCustomers } = useSharedCustomers();
  const { allLeads } = useSharedCRM();
  const [activeTab, setActiveTab] = useState<Tab>('customers');

  // Filter out archived leads (e.g. Cap 4 merge archives the source lead).
  // Static LEADS module carries the extended AudreyLead shape (region,
  // preferredCollections, etc.) that LeadCard reads. Merge by id so Kai-created
  // leads (Cap 2) appear with the richer presentation when available.
  const visibleLeads = useMemo(() => {
    const archivedIds = new Set(allLeads.filter(l => l.archived).map(l => l.id));
    const audreyById = new Map(LEADS.map(l => [l.id, l]));
    const out: AudreyLead[] = [];
    for (const l of allLeads) {
      if (archivedIds.has(l.id)) continue;
      const enriched = audreyById.get(l.id);
      if (enriched) {
        out.push(enriched);
      } else {
        // Kai-created lead — synthesize the minimum AudreyLead shape so LeadCard
        // renders. Missing fields (region, preferredCollections) are optional.
        out.push({
          id: l.id,
          name: l.name,
          contact: l.contact,
          source: l.source,
          status: l.status,
          assignedTo: l.assignedTo,
          createdDate: l.createdDate,
          lastContact: l.lastContact,
        } as AudreyLead);
      }
    }
    return out;
  }, [allLeads]);

  useEffect(() => {
    setPage('customers', { customers: allCustomers, leads: visibleLeads });
  }, [setPage, allCustomers, visibleLeads]);

  return (
    <WizOrderPage
      title="Customers"
      icon="👥"
      subtitle="View and manage your customer accounts and pipeline leads."
    >
      {/* Tab row */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {(['customers', 'leads'] as Tab[]).map(tab => {
          const count = tab === 'customers' ? allCustomers.length : visibleLeads.length;
          const isActive = tab === activeTab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--primary-80)' : '2px solid transparent',
                marginBottom: -1,
                cursor: 'pointer',
                fontFamily: 'var(--display)',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? 'var(--primary-80)' : 'var(--text3)',
                transition: 'color 150ms ease',
                textTransform: 'capitalize',
              }}
            >
              {tab === 'customers' ? 'Customers' : 'Leads'} ({count})
            </button>
          );
        })}
      </div>

      <style>{`
        .customers-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(1, 1fr);
        }
        @media (min-width: 768px) {
          .customers-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1200px) {
          .customers-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      {activeTab === 'customers' ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>
              {allCustomers.length} customer{allCustomers.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="customers-grid">
            {allCustomers.map(c => <CustomerCard key={c.id} customer={c} />)}
          </div>
        </>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontFamily: 'var(--display)', fontSize: 13, fontWeight: 500, color: 'var(--text2)' }}>
              {visibleLeads.length} lead{visibleLeads.length !== 1 ? 's' : ''} in pipeline
            </span>
          </div>
          <div className="customers-grid">
            {visibleLeads.map(l => <LeadCard key={l.id} lead={l} />)}
          </div>
        </>
      )}
    </WizOrderPage>
  );
}
