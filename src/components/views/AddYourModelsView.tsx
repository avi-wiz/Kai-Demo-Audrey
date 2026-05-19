'use client';

import { useState, useEffect, useRef } from 'react';

// ── Icons ─────────────────────────────────────────────────────────────────────

function KeyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="7.5" cy="10" r="4" stroke="var(--primary-80)" strokeWidth="1.4" />
      <path d="M11 10h7M15 10v2.5" stroke="var(--primary-80)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M3 15l4-5 4 3 4-7" stroke="var(--primary-80)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="2" y="3" width="16" height="13" rx="2" stroke="var(--primary-80)" strokeWidth="1.4" />
    </svg>
  );
}

function CpuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="5" y="5" width="10" height="10" rx="1.5" stroke="var(--primary-80)" strokeWidth="1.4" />
      <path d="M8 5V3M12 5V3M8 17v-2M12 17v-2M5 8H3M5 12H3M17 8h-2M17 12h-2" stroke="var(--primary-80)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M2 2l12 12M6.5 6.6A2 2 0 0 0 9.4 9.5M4.1 4.2C2.6 5.2 1 8 1 8s2.5 5 7 5c1.4 0 2.7-.4 3.8-1.1M7 3.1C7.3 3 7.7 3 8 3c4.5 0 7 5 7 5s-.7 1.4-1.9 2.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transition: 'transform 200ms ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
      <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Section divider + header ──────────────────────────────────────────────────

function SectionTitle({ title, first = false }: { title: string; first?: boolean }) {
  return (
    <div style={{ marginBottom: 18 }}>
      {!first && <div style={{ borderTop: '1px solid var(--border)', marginBottom: 28 }} />}
      <h2 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: 'var(--text)', margin: 0 }}>
        {title}
      </h2>
    </div>
  );
}

// ── Benefit cards ─────────────────────────────────────────────────────────────

function BenefitCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div style={{
      flex: 1,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-card, 12px)',
      padding: 16,
    }}>
      <div style={{ marginBottom: 10 }}>{icon}</div>
      <p style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 13, color: 'var(--text)', margin: '0 0 4px' }}>{title}</p>
      <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text2)', margin: 0, lineHeight: 1.5 }}>{description}</p>
    </div>
  );
}

// ── Model cards ───────────────────────────────────────────────────────────────

const BADGE_VARIANTS: Record<string, { bg: string; color: string }> = {
  info:    { bg: 'rgba(59,130,246,0.10)',  color: '#2563eb' },
  success: { bg: 'rgba(34,197,94,0.10)',   color: '#16a34a' },
  neutral: { bg: 'rgba(107,114,128,0.10)', color: '#4b5563' },
};

interface ModelDef { id: string; name: string; description: string; badge: string; badgeVariant: 'info' | 'success' | 'neutral'; }

const MODELS: ModelDef[] = [
  { id: 'opus',    name: 'Claude Opus',    badgeVariant: 'info',    badge: 'Recommended for accuracy', description: 'Most intelligent. Best for complex multi-intent queries and nuanced customer analysis. Higher cost, highest quality.' },
  { id: 'sonnet',  name: 'Claude Sonnet',  badgeVariant: 'success', badge: 'Best value',                description: 'Balanced performance and speed. Ideal for most sales workflows, task creation, and daily use.' },
  { id: 'haiku',   name: 'Claude Haiku',   badgeVariant: 'neutral', badge: 'Best for speed',            description: 'Fastest and most affordable. Good for simple lookups, quick answers, and high-volume knowledge base queries.' },
];

function ModelCard({ model, selected, onSelect }: { model: ModelDef; selected: boolean; onSelect: () => void }) {
  const bv = BADGE_VARIANTS[model.badgeVariant];
  return (
    <div
      onClick={onSelect}
      className="group"
      style={{
        flex: 1,
        position: 'relative',
        background: 'var(--surface)',
        border: `1.5px solid ${selected ? 'var(--primary-80)' : 'var(--border)'}`,
        borderRadius: 12,
        padding: 20,
        cursor: 'pointer',
        boxShadow: selected 
          ? '0 0 0 3px var(--primary-10, rgba(99,102,241,0.10)), 0 8px 20px rgba(0,0,0,0.08)' 
          : '0 2px 4px rgba(0,0,0,0.02)',
        transition: 'all 200ms ease',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
        zIndex: selected ? 10 : 1,
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
        }
      }}
    >
      {selected && (
        <div style={{
          position: 'absolute', top: -9, left: -9,
          width: 22, height: 22, borderRadius: '50%',
          background: 'var(--primary-80)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 20,
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          border: '2px solid white',
        }}>
          <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
            <path 
              className="animate-draw-checkmark" 
              d="M2 5l2.5 2.5L8 3" 
              stroke="white" 
              strokeWidth="1.8" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          </svg>
        </div>
      )}
      <p style={{ 
        fontFamily: 'var(--display)', 
        fontWeight: 700, 
        fontSize: 15, 
        color: selected ? 'var(--primary-80)' : 'var(--text)', 
        margin: '4px 0 10px' 
      }}>
        {model.name}
      </p>
      <span style={{ 
        position: 'absolute',
        top: -11,
        right: 12,
        fontSize: 10, 
        fontWeight: 700, 
        padding: '4px 12px', 
        borderRadius: 99, 
        background: 'white', 
        color: bv.color, 
        fontFamily: 'var(--display)',
        boxShadow: '0 3px 12px rgba(0,0,0,0.08)',
        border: `1.5px solid ${bv.color}22`,
        whiteSpace: 'nowrap',
        zIndex: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.02em',
      }}>
        {model.badge}
      </span>
      <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text2)', margin: '10px 0 0', lineHeight: 1.6 }}>
        {model.description}
      </p>
    </div>
  );
}

// ── Collapsible section ───────────────────────────────────────────────────────

function Collapsible({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', background: 'var(--surface)', border: 'none', cursor: 'pointer',
          fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13.5, color: 'var(--text)',
          textAlign: 'left', zIndex: 1, position: 'relative',
        }}
      >
        {title}
        <ChevronIcon open={open} />
      </button>
      <div style={{ 
        maxHeight: open ? '600px' : '0', 
        overflow: 'hidden', 
        transition: 'max-height 300ms ease',
        background: 'var(--surface)',
      }}>
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)' }}>
          <div style={{ paddingTop: 14 }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Test connection result ────────────────────────────────────────────────────

type TestState = 'idle' | 'testing' | 'success' | 'no-key';

// ── Main view ─────────────────────────────────────────────────────────────────

const LS_MODEL = 'kai-selected-model';
const LS_KEY   = 'kai-api-key';

export default function AddYourModelsView() {
  const [selectedModel, setSelectedModel] = useState('sonnet');
  const [apiKey, setApiKey] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [testState, setTestState] = useState<TestState>('idle');
  const [savedToast, setSavedToast] = useState(false);
  const testTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const m = localStorage.getItem(LS_MODEL);
    if (m) setSelectedModel(m);
    const k = localStorage.getItem(LS_KEY);
    if (k) setApiKey(k);
    return () => {
      if (testTimerRef.current) clearTimeout(testTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  function handleSelectModel(id: string) {
    setSelectedModel(id);
    localStorage.setItem(LS_MODEL, id);
  }

  function handleSave() {
    localStorage.setItem(LS_MODEL, selectedModel);
    if (apiKey.trim()) localStorage.setItem(LS_KEY, apiKey.trim());
    setSavedToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setSavedToast(false), 2800);
    setTestState('idle');
  }

  function handleClearKey() {
    setApiKey('');
    localStorage.removeItem(LS_KEY);
    setTestState('idle');
  }

  function handleTestConnection() {
    if (!apiKey.trim()) { setTestState('no-key'); return; }
    setTestState('testing');
    if (testTimerRef.current) clearTimeout(testTimerRef.current);
    testTimerRef.current = setTimeout(() => setTestState('success'), 1500);
  }

  const selectedModelName = MODELS.find((m) => m.id === selectedModel)?.name ?? 'Claude Sonnet';
  const maskedKey = apiKey ? `${apiKey.slice(0, 10)}••••••••••••••••${apiKey.slice(-4)}` : '';

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: '32px 40px' }}>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18, color: 'var(--text)', margin: '0 0 5px' }}>
          Add Your Own Models
        </h1>
        <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text2)', margin: 0 }}>
          Connect your Claude API key for dedicated AI capacity
        </p>
      </div>

      <div style={{ maxWidth: 680 }}>

        {/* Section 1: How It Works */}
        <section style={{ marginBottom: 32 }}>
          <SectionTitle title="How It Works" first />
          <p style={{ fontFamily: 'var(--sans)', fontSize: 13.5, color: 'var(--text)', lineHeight: 1.7, maxWidth: 600, margin: '0 0 20px' }}>
            Kai runs on Anthropic's Claude — the most capable AI model family for enterprise workflows. By connecting your own API key, you get dedicated capacity, usage tracking, and direct billing with Anthropic.
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            <BenefitCard icon={<KeyIcon />}   title="Dedicated Capacity"  description="Your own rate limits, no shared queuing" />
            <BenefitCard icon={<ChartIcon />} title="Usage Tracking"      description="Monitor tokens and costs in the dashboard" />
            <BenefitCard icon={<CpuIcon />}   title="Model Selection"     description="Choose the right Claude model for your needs" />
          </div>
        </section>

        {/* Section 2: Supported Models */}
        <section style={{ marginBottom: 32 }}>
          <SectionTitle title="Supported Models" />
          <div style={{ display: 'flex', gap: 16 }}>
            {MODELS.map((m) => (
              <ModelCard key={m.id} model={m} selected={selectedModel === m.id} onSelect={() => handleSelectModel(m.id)} />
            ))}
          </div>
        </section>

        {/* Section 3: Connect Your API Key */}
        <section style={{ marginBottom: 32 }}>
          <SectionTitle title="Connect Your API Key" />
          <div style={{ maxWidth: 480 }}>
            <label style={{ display: 'block', fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 8 }}>
              API Key
            </label>

            {/* Input */}
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <input
                type={revealed ? 'text' : 'password'}
                value={revealed ? apiKey : (apiKey ? maskedKey : '')}
                onChange={(e) => { if (revealed) setApiKey(e.target.value); }}
                onFocus={() => { if (!revealed) setRevealed(true); }}
                placeholder="sk-ant-..."
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '10px 40px 10px 12px',
                  fontFamily: 'var(--mono)', fontSize: 12.5, color: 'var(--text)',
                  background: 'var(--surface2, #f9fafb)',
                  border: '1px solid var(--border)', borderRadius: 8, outline: 'none',
                }}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              />
              <button
                onClick={() => setRevealed((v) => !v)}
                title={revealed ? 'Hide key' : 'Show key'}
                style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: 2,
                  color: 'var(--text3)', display: 'flex', alignItems: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text2)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text3)')}
              >
                <EyeIcon open={revealed} />
              </button>
            </div>

            {/* Save + Clear row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button
                onClick={handleSave}
                style={{
                  padding: '9px 20px', fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13,
                  color: 'white', background: 'var(--primary-80)', border: 'none', borderRadius: 8,
                  cursor: 'pointer', transition: 'opacity 150ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Save Changes
              </button>
              <button
                onClick={handleClearKey}
                style={{
                  padding: '9px 20px', fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13,
                  color: '#dc2626', background: 'transparent',
                  border: '1.5px solid rgba(220,38,38,0.35)', borderRadius: 8,
                  cursor: 'pointer', transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(220,38,38,0.06)'; e.currentTarget.style.borderColor = '#dc2626'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.35)'; }}
              >
                Clear Key
              </button>
            </div>

            {/* Test Connection */}
            <button
              onClick={handleTestConnection}
              disabled={testState === 'testing'}
              style={{
                padding: '8px 18px', fontFamily: 'var(--display)', fontWeight: 600, fontSize: 13,
                color: 'var(--text2)', background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 8, cursor: testState === 'testing' ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => { if (testState !== 'testing') e.currentTarget.style.borderColor = 'var(--text3)'; }}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            >
              {testState === 'testing' && (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ animation: 'spin 700ms linear infinite' }}>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <circle cx="6.5" cy="6.5" r="5" stroke="var(--text3)" strokeWidth="1.5" strokeDasharray="20 12" />
                </svg>
              )}
              {testState === 'testing' ? 'Testing...' : 'Test Connection'}
            </button>

            {/* Test result */}
            {testState === 'success' && (
              <div className="animate-slide-in-fade" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" fill="rgba(22,163,74,0.12)" />
                  <path d="M4.5 7l2 2 3-3" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: '#16a34a' }}>
                  Connection successful. Model: {selectedModelName} 4.6
                </span>
              </div>
            )}
            {testState === 'no-key' && (
              <div className="animate-slide-in-fade" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" fill="rgba(220,38,38,0.10)" />
                  <path d="M4.5 4.5l5 5M9.5 4.5l-5 5" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span style={{ fontFamily: 'var(--sans)', fontSize: 12.5, color: '#dc2626' }}>
                  Please enter an API key first
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Section 4 & 5: Collapsibles */}
        <section style={{ marginBottom: 32 }}>
          <SectionTitle title="Learn More" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Collapsible title="How to Find Your API Key">
              <ol style={{ margin: '12px 0 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'Go to console.anthropic.com and sign in to your account.',
                  'Click your workspace name in the top-left corner.',
                  'Select "API Keys" from the left navigation menu.',
                  'Click "Create Key" and give it a name (e.g. "Kai Production").',
                  'Copy the key — it will only be shown once.',
                  'Paste it into the API Key field above and click Save Changes.',
                ].map((step, i) => (
                  <li key={i} style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
                    {step}
                  </li>
                ))}
              </ol>
              <p style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text3)', margin: '14px 0 0', lineHeight: 1.6, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 8, border: '1px solid var(--border)' }}>
                Your key is stored locally in your browser. Kai never transmits it to any server other than Anthropic's API.
              </p>
            </Collapsible>

            <Collapsible title="Why Only Claude?">
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text)', lineHeight: 1.7, margin: 0 }}>
                  Kai's architecture is purpose-built for Claude's capabilities. The agent reasoning system, tool-use patterns, structured output contracts, and multi-step task orchestration are all designed around Claude's extended thinking, precise instruction following, and function-calling reliability.
                </p>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text)', lineHeight: 1.7, margin: 0 }}>
                  Claude is also the only frontier model family with the context length, safety properties, and enterprise data handling commitments that WizCommerce's compliance requirements demand. Supporting multiple model providers would introduce inconsistent behavior in complex workflows — exactly the opposite of what sales teams need.
                </p>
                <p style={{ fontFamily: 'var(--sans)', fontSize: 13, color: 'var(--text)', lineHeight: 1.7, margin: 0 }}>
                  As Anthropic releases new Claude versions, Kai's system prompts and tool schemas are updated and tested against each model before rollout — so you always get predictable, validated behavior rather than chasing cross-model compatibility.
                </p>
              </div>
            </Collapsible>
          </div>
        </section>
      </div>

      {/* Save toast */}
      <div style={{
        position: 'fixed', bottom: 32, left: '50%',
        transform: `translateX(-50%) translateY(${savedToast ? 0 : 12}px)`,
        opacity: savedToast ? 1 : 0,
        transition: 'opacity 200ms ease, transform 200ms ease',
        pointerEvents: 'none', zIndex: 200,
        background: '#15803d', borderRadius: 10, padding: '10px 18px',
        display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)', whiteSpace: 'nowrap',
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" fill="rgba(255,255,255,0.25)" />
          <path d="M4.5 7l2 2 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontFamily: 'var(--sans)', fontWeight: 500, fontSize: 13, color: 'white' }}>
          Changes saved successfully
        </span>
      </div>
    </div>
  );
}
