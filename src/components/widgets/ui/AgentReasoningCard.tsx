'use client';

import { useState, useEffect, useRef } from 'react';
import type { WidgetProps, AgentReasoningCardData, AgentReasoningCardConfig, DAGNode, DAGBranch } from '@/lib/types';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

// ─── DAG sub-components ───────────────────────────────────────────────────────

function NodeBox({
  node,
  colorScheme,
  delayIndex,
}: {
  node: DAGNode;
  colorScheme: 'indigo' | 'blue' | 'amber';
  delayIndex: number;
}) {
  const scheme = {
    indigo: { bg: 'var(--surface2)', border: 'var(--border)', text: 'var(--text2)', mono: 'var(--text-primary)' },
    blue:   { bg: 'var(--badge-info-bg)', border: 'rgba(107,166,254,0.15)', text: 'var(--text3)', mono: 'var(--text2)' },
    amber:  { bg: 'var(--badge-warning-bg)', border: 'rgba(240,175,48,0.15)', text: 'var(--text3)', mono: 'var(--text2)' },
  }[colorScheme];

  const isCompleted = node.status === 'completed';

  return (
    <div
      style={{
        background: scheme.bg,
        border: `1px solid ${scheme.border}`,
        borderRadius: 'var(--radius-inner)',
        padding: '8px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        animation: `kai-node-in 300ms ease both`,
        animationDelay: `${delayIndex * 100}ms`,
        opacity: 0,
      }}
    >
      <style>{`
        @keyframes kai-node-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Status icon */}
      <span style={{ flexShrink: 0 }}>
        {isCompleted ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--primary-70)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        )}
      </span>

      {/* Action name */}
      <span style={{ fontFamily: 'var(--mono)', fontSize: '11.5px', fontWeight: 600, color: scheme.mono, flex: 1 }}>
        {node.action}
        {node.input && <span style={{ fontWeight: 400, color: scheme.text, fontFamily: 'var(--sans)' }}>({node.input})</span>}
      </span>

      {/* Result pill or latency */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {node.result && (
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            fontFamily: 'var(--mono)',
            color: 'var(--primary-80)',
            background: 'var(--primary-10)',
            border: '1px solid var(--primary-20)',
            borderRadius: 4,
            padding: '1px 6px',
          }}>
            {node.result}
          </span>
        )}
        <span style={{
          fontSize: 10,
          fontFamily: 'var(--mono)',
          color: 'var(--text3)',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          borderRadius: 4,
          padding: '1px 5px',
        }}>
          {node.ms}ms
        </span>
      </div>
    </div>
  );
}

function Connector({ color = 'var(--border)', height = 20 }: { color?: string; height?: number }) {
  return (
    <div style={{
      width: 1.5,
      height,
      background: color,
      margin: '0 auto',
      flexShrink: 0,
    }} />
  );
}

function BranchColumn({
  branch,
  colorScheme,
  startDelay,
}: {
  branch: DAGBranch;
  colorScheme: 'blue' | 'amber';
  startDelay: number;
}) {
  const labelStyle = colorScheme === 'blue'
    ? { bg: 'var(--badge-info-bg)', border: 'var(--badge-info-border)', text: 'var(--info-80)' }
    : { bg: 'var(--badge-warning-bg)', border: 'var(--badge-warning-border)', text: 'var(--warning-80)' };
  const connectorColor = colorScheme === 'blue' ? 'var(--info-40)' : 'var(--warning-40)';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
      {/* Branch label */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: labelStyle.text,
          background: labelStyle.bg,
          border: `1px solid ${labelStyle.border}`,
          borderRadius: 'var(--radius-inner)',
          padding: '2px 8px',
          fontFamily: 'var(--sans)',
        }}>
          Branch {branch.branchId}: {branch.intent}
        </span>
      </div>

      {/* Nodes */}
      {branch.nodes.map((node, i) => (
        <div key={node.nodeId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
          <NodeBox node={node} colorScheme={colorScheme} delayIndex={startDelay + i} />
          {i < branch.nodes.length - 1 && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Connector color={connectorColor} height={14} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DAGView({ data }: { data: AgentReasoningCardData }) {
  const plan = data.dagPlan!;
  const [branchA, branchB] = plan.branches;
  const sharedNode = plan.sharedNodes[0];

  return (
    <div style={{ padding: '4px 0 12px' }}>

      {/* Shared node(s) */}
      {sharedNode && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', marginBottom: 0 }}>
          <NodeBox node={sharedNode} colorScheme="indigo" delayIndex={0} />
          {/* Fork: vertical line then horizontal split */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Connector color="var(--border2)" height={16} />
          </div>
        </div>
      )}

      {/* Horizontal splitter bar */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 0,
        position: 'relative',
        marginBottom: 0,
      }}>
        {/* Left arm */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '50%', height: 1.5, background: 'var(--border2)', alignSelf: 'flex-end' }} />
          <Connector color="var(--border2)" height={14} />
        </div>
        {/* Center marker */}
        <div style={{ width: 1.5, height: 16, background: 'var(--border2)', flexShrink: 0 }} />
        {/* Right arm */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '50%', height: 1.5, background: 'var(--border2)', alignSelf: 'flex-start' }} />
          <Connector color="var(--border2)" height={14} />
        </div>
      </div>

      {/* Branch columns */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {branchA && (
          <BranchColumn
            branch={branchA}
            colorScheme="blue"
            startDelay={1}
          />
        )}
        {branchB && (
          <BranchColumn
            branch={branchB}
            colorScheme="amber"
            startDelay={branchA ? 1 + branchA.nodes.length : 1}
          />
        )}
      </div>

      {/* Bottom summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
        <span style={{
          fontSize: 10,
          fontFamily: 'var(--mono)',
          fontWeight: 500,
          color: 'var(--ai-accent-text)',
          background: 'var(--ai-accent-bg)',
          border: '1px solid var(--ai-accent-border)',
          borderRadius: 'var(--radius-badge)',
          padding: '2px 8px',
        }}>
          {data.totalMs}ms total
        </span>
        {(data.mcpsAccessed?.length ?? 0) > 0 && <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, fontFamily: 'var(--sans)' }}>MCPs</span>}
        {(data.mcpsAccessed ?? []).map((mcp) => (
          <span key={mcp} style={{
            fontSize: 10,
            fontWeight: 500,
            color: 'var(--badge-info-text)',
            background: 'var(--badge-info-bg)',
            border: '1px solid var(--badge-info-border)',
            borderRadius: 'var(--radius-badge)',
            padding: '2px 8px',
            fontFamily: 'var(--mono)',
          }}>
            {mcp}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Step timeline (UC-1 / UC-2) ─────────────────────────────────────────────

interface StepWithConfidence {
  step: number;
  action: string;
  result: string;
  ms: number;
  confidence?: number;
  confidenceLabel?: string;
}

function ConfidenceBar({ confidence, label }: { confidence: number; label: string }) {
  const pct = Math.round(confidence * 100);
  const color = confidence > 0.9 ? 'var(--primary-80)' : confidence >= 0.7 ? 'var(--warning-80)' : 'var(--error-80)';
  const bg   = confidence > 0.9 ? 'var(--primary-10)' : confidence >= 0.7 ? 'var(--warning-bg)' : 'var(--error-bg)';
  const border = confidence > 0.9 ? 'var(--primary-20)' : confidence >= 0.7 ? 'var(--warning-40)' : 'var(--error-40)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 10, fontWeight: 600, color,
          background: bg, border: `1px solid ${border}`,
          borderRadius: 4, padding: '1px 6px',
          fontFamily: 'var(--sans)',
        }}>
          {label}
        </span>
        <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)' }}>{pct}%</span>
      </div>
      <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, background: color,
          borderRadius: 2, transition: 'width 600ms ease',
        }} />
      </div>
    </div>
  );
}

function StepTimeline({ data }: { data: AgentReasoningCardData }) {
  const { showConfidence } = useUserPreferences();
  return (
    <div style={{ padding: '0 0 12px' }}>
      <div style={{ position: 'relative', paddingLeft: 28, marginBottom: 12 }}>
        <div style={{
          position: 'absolute', left: 11, top: 8, bottom: 8, width: 1.5, background: 'var(--ai-accent-border)',
        }} />
        {(data.steps! as StepWithConfidence[]).map((step) => (
          <div key={step.step} style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, position: 'relative',
          }}>
            <div style={{
              position: 'absolute', left: -28, width: 20, height: 20, borderRadius: '50%',
              background: 'var(--ai-accent-step-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 600, color: 'var(--ai-accent-text)', flexShrink: 0,
            }}>
              {step.step}
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: '11.5px', color: 'var(--text2)', fontWeight: 500 }}>
              {step.action}
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
            {step.action === 'intent_classification' && step.confidence !== undefined && step.confidenceLabel && showConfidence ? (
              <ConfidenceBar confidence={step.confidence} label={step.confidenceLabel} />
            ) : (
              <span style={{ fontSize: 12, color: 'var(--text3)', flex: 1, fontFamily: 'var(--sans)' }}>{step.result}</span>
            )}
            <span style={{
              flexShrink: 0, fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)',
            }}>
              {step.ms}ms
            </span>
          </div>
        ))}
      </div>
      {(data.mcpsAccessed?.length ?? 0) > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, fontFamily: 'var(--sans)' }}>MCPs</span>
          {data.mcpsAccessed.map((mcp) => (
            <span key={mcp} style={{
              fontSize: 10, fontWeight: 500, color: 'var(--badge-info-text)',
              background: 'var(--badge-info-bg)', border: '1px solid var(--badge-info-border)', 
              borderRadius: 'var(--radius-badge)', padding: '2px 8px',
              fontFamily: 'var(--mono)',
            }}>
              {mcp}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Live node list (planner streaming) ──────────────────────────────────────

interface LiveNode {
  nodeId: string;
  action: string;
  status: string;
  ms?: number;
  result?: string;
  input?: string;
}

function LiveNodeList({ nodes }: { nodes: LiveNode[] }) {
  return (
    <div style={{ padding: '4px 0 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <style>{`
        @keyframes kai-live-pulse {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 1; }
        }
      `}</style>
      {nodes.map((node) => {
        const running = node.status === 'running';
        const failed = node.status === 'failed';
        const completed = node.status === 'completed';
        return (
          <div key={node.nodeId} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 10px',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-inner)',
            animation: 'kai-node-in 250ms ease both',
          }}>
            <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              {completed ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--primary-70)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : failed ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--error-80)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <span style={{
                  width: 9, height: 9, borderRadius: '50%',
                  background: 'var(--ai-accent)',
                  animation: running ? 'kai-live-pulse 1.2s ease-in-out infinite' : 'none',
                  display: 'inline-block',
                }} />
              )}
            </span>
            <span style={{
              fontFamily: 'var(--mono)', fontSize: '11.5px', fontWeight: 600,
              color: 'var(--text-primary)', flex: 1,
            }}>
              {node.action}
              {node.input && (
                <span style={{ fontWeight: 400, color: 'var(--text3)', fontFamily: 'var(--sans)' }}>
                  {' '}({node.input})
                </span>
              )}
            </span>
            {node.result && (
              <span style={{
                fontSize: 10, fontWeight: 700, fontFamily: 'var(--mono)',
                color: 'var(--primary-80)', background: 'var(--primary-10)',
                border: '1px solid var(--primary-20)', borderRadius: 4, padding: '1px 6px',
              }}>
                {node.result}
              </span>
            )}
            {node.ms !== undefined && (
              <span style={{
                fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 4, padding: '1px 5px',
              }}>
                {node.ms}ms
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AgentReasoningCard({ data: rawData, config: rawConfig }: WidgetProps) {
  const data = rawData as unknown as AgentReasoningCardData & { isLive?: boolean; liveNodes?: Array<{ nodeId: string; action: string; status: string; ms?: number; result?: string; input?: string }> };
  const config = rawConfig as (AgentReasoningCardConfig & { isLive?: boolean }) | undefined;
  const { autoExpandReasoning } = useUserPreferences();
  const showDag = config?.showDag === true && !!data.dagPlan;
  const isLive = config?.isLive === true || data.isLive === true;

  // While live, force expanded. When live completes (isLive flips false), collapse.
  const prefCollapsed = autoExpandReasoning ? false : (config?.collapsed !== false);
  const [collapsed, setCollapsed] = useState(isLive ? false : prefCollapsed);
  const wasLiveRef = useRef(isLive);

  useEffect(() => {
    if (isLive) {
      setCollapsed(false);
      wasLiveRef.current = true;
    } else if (wasLiveRef.current) {
      // Live → done transition: collapse to "Thought for Ns" summary
      setCollapsed(true);
      wasLiveRef.current = false;
    } else {
      setCollapsed(autoExpandReasoning ? false : (config?.collapsed !== false));
    }
  }, [autoExpandReasoning, config?.collapsed, isLive]);

  const hasSteps = data.steps && data.steps.length > 0;
  const hasLiveNodes = Array.isArray(data.liveNodes) && data.liveNodes.length > 0;

  return (
    <div style={{
      background: 'var(--ai-accent-bg)',
      border: '1px solid var(--ai-accent-border)',
      borderRadius: 'var(--radius-card)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ai-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.5 2a2.5 2.5 0 0 1 5 0v.5A2.5 2.5 0 0 1 17 5v.5a2.5 2.5 0 0 1 0 5V11a2.5 2.5 0 0 1-2.5 2.5h-5A2.5 2.5 0 0 1 7 11v-.5a2.5 2.5 0 0 1 0-5V5a2.5 2.5 0 0 1 2.5-2.5Z" />
            <path d="M9 13v8" /><path d="M15 13v8" /><path d="M9 17h6" />
          </svg>
        </span>

        <span style={{ flex: 1, fontSize: 13, color: 'var(--text2)', lineHeight: 1.4, fontFamily: 'var(--sans)', fontWeight: 400 }}>
          {data.summary}
        </span>

        {showDag && (
          <span style={{
            flexShrink: 0, fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: 'var(--ai-accent-text)', background: 'var(--ai-accent-bg)',
            border: '1px solid var(--ai-accent-border)', borderRadius: 'var(--radius-badge)', padding: '2px 7px', marginRight: 4,
            fontFamily: 'var(--sans)',
          }}>
            DAG
          </span>
        )}

        <span style={{
          flexShrink: 0, fontSize: 10.5, fontFamily: 'var(--mono)', fontWeight: 500,
          color: 'var(--ai-accent-text)', background: 'var(--ai-accent-bg)', border: '1px solid var(--ai-accent-border)',
          borderRadius: 'var(--radius-badge)', padding: '2px 8px', marginRight: 6,
        }}>
          {data.totalMs}ms
        </span>

        <span style={{
          flexShrink: 0, display: 'flex', alignItems: 'center',
          transition: 'transform 200ms ease',
          transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {/* Body */}
      <div style={{
        maxHeight: collapsed ? 0 : 1200,
        overflow: 'hidden',
        transition: 'max-height 300ms ease',
      }}>
        <div style={{ padding: '0 16px' }}>
          {hasLiveNodes
            ? <LiveNodeList nodes={data.liveNodes!} />
            : showDag
              ? <DAGView data={data} />
              : hasSteps
                ? <StepTimeline data={data} />
                : null
          }
        </div>
      </div>
    </div>
  );
}
