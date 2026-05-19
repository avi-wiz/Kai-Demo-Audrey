'use client';

import React, { useState } from 'react';
import type { WidgetProps, Customer360Data, WidgetHighlight } from '@/lib/types';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

// -- Highlight helpers --

const HL_COLORS: Record<WidgetHighlight['type'], { border: string; bg: string; chip: string }> = {
  urgent:   { border: 'var(--error-80)',   bg: 'rgba(220,38,38,0.04)',   chip: 'rgba(220,38,38,0.12)'   },
  warning:  { border: 'var(--warning-80)', bg: 'rgba(245,158,11,0.04)',  chip: 'rgba(245,158,11,0.12)'  },
  positive: { border: 'var(--success-80)', bg: 'rgba(22,136,95,0.04)',   chip: 'rgba(22,136,95,0.12)'   },
  info:     { border: 'var(--info-80)',    bg: 'rgba(91,106,240,0.04)',  chip: 'rgba(91,106,240,0.12)'  },
};

function useHighlight(highlights: WidgetHighlight[] | undefined, fieldPath: string) {
  return highlights?.find((h) => h.fieldPath === fieldPath);
}

function HighlightedField({
  fieldPath,
  highlights,
  onAction,
  children,
  flex,
}: {
  fieldPath: string;
  highlights?: WidgetHighlight[];
  onAction?: (query: string) => void;
  children: React.ReactNode;
  flex?: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const hl = useHighlight(highlights, fieldPath);
  if (!hl) return flex ? <div style={{ flex }}>{children}</div> : <>{children}</>;

  const colors = HL_COLORS[hl.type];
  const isMetric = fieldPath.includes('metrics.cards');

  return (
    <div
      style={{
        position: 'relative',
        background: colors.bg,
        paddingLeft: isMetric ? 0 : 12,
        marginLeft: isMetric ? 0 : -12,
        borderRadius: isMetric ? '10px' : '4px',
        display: isMetric ? 'flex' : 'block',
        flexDirection: isMetric ? 'column' : undefined,
        ...(flex ? { flex } : {}),
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Highlight Accent Bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 3,
        background: colors.border,
        zIndex: 20,
        borderTopLeftRadius: isMetric ? '10px' : '4px',
        borderBottomLeftRadius: isMetric ? '10px' : '4px',
        pointerEvents: 'none',
      }} />

      {children}

      {/* Tooltip */}
      {showTooltip && (
        <div 
          className="highlight-tooltip"
          style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: isMetric ? 12 : 0,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '6px 10px',
          fontSize: 12,
          color: 'var(--text)',
          fontFamily: 'var(--sans)',
          boxShadow: 'var(--shadow-tooltip)',
          whiteSpace: 'nowrap',
          zIndex: 40,
          pointerEvents: 'none',
        }}>
          {hl.message}
        </div>
      )}

      {/* Action chip */}
      {hl.action && onAction && (
        <div style={{ padding: isMetric ? '0 12px 10px' : '5px 0 0', position: 'relative', zIndex: 21 }}>
          <button
            onClick={() => onAction(hl.action!.query)}
            className="highlight-action-chip"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              border: '1px solid var(--border)',
              borderRadius: 99,
              padding: '2px 8px',
              fontSize: 10,
              fontWeight: 600,
              fontFamily: 'var(--sans)',
              cursor: 'pointer',
            }}
          >
            &rarr; {hl.action.label}
          </button>
        </div>
      )}
    </div>
  );
}

// --- Helpers ---

function formatVal(val: number | string, format?: string) {
  if (typeof val === 'string') return val;
  if (format === 'currency') return '$' + val.toLocaleString();
  return val.toLocaleString();
}

// --- Sub-components ---

function StatusBadge({ label, color, size = 'sm' }: { label: string; color: string; size?: 'sm' | 'md' }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      background: color + '20',
      color: color,
      border: `1px solid ${color}40`,
      borderRadius: 'var(--radius-badge)',
      padding: size === 'sm' ? '1px 6px' : '2px 8px',
      fontSize: size === 'sm' ? 10 : 11,
      fontWeight: 600,
      fontFamily: 'var(--sans)',
      textTransform: 'capitalize',
    }}>
      {label}
    </span>
  );
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 12px' }}>
      <span style={{
        fontSize: 10.5,
        fontWeight: 700,
        color: 'var(--text3)',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        whiteSpace: 'nowrap',
        fontFamily: 'var(--mono)'
      }}>
        {title}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

function SparklineInline({ data, color, height }: { data: number[]; color: string; height: number }) {
  if (!data || data.length < 2) return <div style={{ height, width: 120, background: 'var(--surface2)', borderRadius: 4 }} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 120;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="3"
        fill={color}
      />
    </svg>
  );
}

// --- Main Component ---

export default function Customer360Card({ data: rawData, highlights, onAction }: WidgetProps & { highlights?: WidgetHighlight[]; onAction?: (query: string) => void }) {
  const d = rawData as Customer360Data;

  const data = ('profile' in d) ? d : {
    profile: {
      name: d.displayName || 'Unknown Customer',
      customerId: d.entityId || 'N/A',
      type: (d.tags && d.tags[0]) || 'General',
      salesRep: d.assignedRep || 'Unassigned',
      priceList: 'Standard Tier',
      territory: (d.tags && d.tags[2]) || 'National'
    },
    metrics: {
      cards: [
        { label: 'Lifetime Revenue', value: d.lifetimeRevenue || 0, format: 'currency' },
        { label: 'Current Balance', value: d.currentBalance || 0, format: 'currency' },
        { label: 'Credit Limit', value: d.creditLimit || 0, format: 'currency' }
      ]
    },
    salesTrend: [30, 45, 35, 50, 48, 60],
    recentOrders: [
      {
        id: 'ORD-LATEST',
        date: d.lastOrderDate || 'Recent',
        status: {
          label: d.paymentStatus || 'Pending',
          color: d.paymentStatus === 'Current' ? 'var(--primary-80)' : 'var(--warning-80)'
        },
        value: d.lastOrderAmount || 0
      }
    ],
    openTasks: [
      { title: 'Follow up on open balance', due: 'Apr 30, 2026' }
    ],
    riskIndicator: {
      level: (d.paymentStatus === 'Current' ? 'healthy' : 'watch') as 'healthy' | 'watch',
      reason: d.paymentStatus === 'Current' ? 'Payment history is solid' : 'Pending payment detected'
    }
  };

  const { includeFinancial, showContactInfo } = useUserPreferences();
  const { profile, metrics, salesTrend, recentOrders, openTasks, riskIndicator } = data;

  const FINANCIAL_LABELS = new Set(['lifetime revenue', 'current balance', 'credit limit']);
  const visibleMetricCards = includeFinancial
    ? (metrics?.cards ?? [])
    : (metrics?.cards ?? []).filter((c) => !FINANCIAL_LABELS.has(c.label.toLowerCase()));
  const riskColors = {
    healthy: 'var(--primary-80)',
    watch: '#f59e0b',
    at_risk: 'var(--error-80)',
    churned: 'var(--text2)'
  };
  const rc = riskIndicator ? (riskColors[riskIndicator.level as keyof typeof riskColors] || 'var(--text2)') : 'var(--text2)';

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-card-lg)',
      padding: '20px 24px',
      color: 'var(--text)',
      fontFamily: 'var(--sans)',
    }}>
      {/* Risk Indicator */}
      {riskIndicator && (
        <HighlightedField fieldPath="riskIndicator" highlights={highlights} onAction={onAction}>
          <div style={{
            background: rc + '15',
            border: `1px solid ${rc}40`,
            borderRadius: 8,
            padding: '9px 14px',
            marginBottom: 16,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start'
          }}>
            <span style={{ fontSize: 16, marginTop: -2 }}>
              {riskIndicator.level === 'healthy' ? '✅' : riskIndicator.level === 'watch' ? '⚠️' : '❌'}
            </span>
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: rc,
                textTransform: 'capitalize'
              }}>
                {riskIndicator.level.replace('_', ' ')} Customer
              </div>
              <div style={{
                fontSize: 11.5,
                color: 'var(--text2)',
                marginTop: 2
              }}>
                {riskIndicator.reason}
              </div>
            </div>
          </div>
        </HighlightedField>
      )}

      {/* Profile and Trend */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        marginBottom: 20
      }}>
        <div>
          <div style={{
            fontFamily: 'var(--display)',
            fontSize: 18,
            fontWeight: 800,
            marginBottom: 4,
            color: 'var(--text)'
          }}>
            {profile?.name}
          </div>
          <div style={{
            fontSize: 11,
            fontFamily: 'var(--mono)',
            color: 'var(--text3)',
            marginBottom: 12
          }}>
            {profile?.customerId} · {profile?.type}
          </div>

          {([
            ['Sales Rep', profile?.salesRep, 'profile.salesRep'],
            ['Price List', profile?.priceList, 'profile.priceList'],
            ['Territory', profile?.territory, 'profile.territory'],
          ] as [string, string | undefined, string][]).map(([k, v, path]) => (
            <HighlightedField key={k} fieldPath={path} highlights={highlights} onAction={onAction}>
              <div style={{
                display: 'flex',
                gap: 10,
                fontSize: 12,
                marginBottom: 6,
                paddingTop: 2,
                paddingBottom: 2,
              }}>
                <span style={{ color: 'var(--text3)', minWidth: 80, fontWeight: 500 }}>{k}</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{v}</span>
              </div>
            </HighlightedField>
          ))}
          {showContactInfo && (() => {
            const p = profile as unknown as { contactPerson?: string; email?: string; phone?: string } | undefined;
            const rows: [string, string | undefined][] = [
              ['Contact', p?.contactPerson],
              ['Email', p?.email],
              ['Phone', p?.phone],
            ];
            const visible = rows.filter(([, v]) => !!v);
            if (visible.length === 0) return null;
            return (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
                {visible.map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', gap: 10, fontSize: 12, marginBottom: 6, paddingTop: 2, paddingBottom: 2 }}>
                    <span style={{ color: 'var(--text3)', minWidth: 80, fontWeight: 500 }}>{k}</span>
                    <span style={{ color: 'var(--text)', fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{
            fontSize: 10.5,
            color: 'var(--text3)',
            fontFamily: 'var(--mono)',
            marginBottom: 10,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            textAlign: 'right'
          }}>
            Revenue Trend
          </div>
          <SparklineInline
            data={salesTrend || []}
            color="var(--primary-80)"
            height={45}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        marginBottom: 4
      }}>
        {visibleMetricCards.map((c, i) => (
          <HighlightedField key={i} fieldPath={`metrics.cards[${i}].value`} highlights={highlights} onAction={onAction} flex="1 1 140px">
            <div style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '12px 16px',
              width: '100%',
            }}>
              <div style={{
                fontSize: 10,
                color: 'var(--text3)',
                fontFamily: 'var(--mono)',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: 0.4
              }}>
                {c.label}
              </div>
              <div style={{
                fontFamily: 'var(--display)',
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--text)'
              }}>
                {formatVal(c.value, c.format)}
              </div>
            </div>
          </HighlightedField>
        ))}
      </div>

      {/* Recent Orders */}
      <SectionDivider title="Recent Orders" />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {(recentOrders || []).map((o, i) => (
          <HighlightedField key={i} fieldPath={`recentOrders[${i}].status`} highlights={highlights} onAction={onAction}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '10px 0',
              borderBottom: i === recentOrders.length - 1 ? 'none' : '1px solid var(--border)'
            }}>
              <span style={{
                fontSize: 11,
                fontFamily: 'var(--mono)',
                color: 'var(--ai-accent-text)',
                fontWeight: 600,
                minWidth: 60
              }}>
                {o.id}
              </span>
              <span style={{
                fontSize: 11.5,
                color: 'var(--text3)',
                flex: 1,
                fontFamily: 'var(--sans)'
              }}>
                {o.date}
              </span>
              <StatusBadge {...o.status} size="sm" />
              <span style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text)',
                fontFamily: 'var(--mono)',
                minWidth: 80,
                textAlign: 'right'
              }}>
                ${o.value?.toLocaleString()}
              </span>
            </div>
          </HighlightedField>
        ))}
      </div>

      {/* Open Tasks */}
      <SectionDivider title="Open Tasks" />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {(openTasks || []).map((t, i) => (
          <HighlightedField key={i} fieldPath={`openTasks[${i}].title`} highlights={highlights} onAction={onAction}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 0',
              borderBottom: i === openTasks.length - 1 ? 'none' : '1px solid var(--border)',
              fontSize: 12.5
            }}>
              <span style={{ color: 'var(--text)', fontWeight: 500, fontFamily: 'var(--sans)' }}>{t.title}</span>
              <span style={{
                color: 'var(--text3)',
                marginLeft: 'auto',
                fontFamily: 'var(--mono)',
                fontSize: 10.5
              }}>
                Due {t.due}
              </span>
            </div>
          </HighlightedField>
        ))}
      </div>
    </div>
  );
}
