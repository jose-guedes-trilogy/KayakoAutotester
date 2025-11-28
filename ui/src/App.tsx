import { useEffect, useRef, useState, useMemo } from 'react';
import { api, stream } from './api';
import './App.css';

type Run = {
  id: string;
  status: string;
  startedAt?: string;
  endedAt?: string;
  summary?: { total: number; passed: number; failed: number; skipped: number };
};

type PipelineStage = {
  name: string;
  status: string;
  startedAt?: string;
  endedAt?: string;
  logs: string[];
  details?: Record<string, unknown>;
};

type PipelineRecord = {
  id: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  crawlId: string;
  captureId: string;
  stages: PipelineStage[];
};

type SpecGroup = {
  id: string;
  label: string;
  specs: string[];
};

type ReportingData = {
  crawls: Array<{ crawlId: string; totalNodes: number; successNodes: number; updatedAt?: string }>;
  structures: Array<{ crawlId: string; dir: string; fileCount: number; mtimeMs: number }>;
  selectorSuggestions?: { pendingCount: number; file?: string };
  runsSummary: { total: number; running: number; passed: number; failed: number };
  specsCount: number;
  compositeSpecsCount?: number;
  pipeline?: { pipelines: PipelineRecord[]; active?: PipelineRecord };
};

type TestDef = {
  id: string;
  name: string;
  description?: string;
  steps: any[];
};

type FlowCategory = 'individual' | 'composite' | 'test';

const PRIMITIVE_ACTIONS: Array<{ id: string; label: string; description: string }> = [
  {
    id: 'goto',
    label: 'Navigate to URL',
    description: 'Open a Kayako page by absolute URL or env.* token (e.g., env.KAYAKO_AGENT_URL/users).',
  },
  {
    id: 'access-conversation',
    label: 'Access ticket',
    description: 'Open the current ticket by env.KAYAKO_CONVERSATION_ID or the first ticket in the inbox.',
  },
  {
    id: 'insert-reply-text',
    label: 'Insert text into reply box',
    description: 'Type the given text into the composer reply area.',
  },
  {
    id: 'composer-toggle-bold',
    label: 'Toggle bold formatting',
    description: 'Click the Bold button in the reply toolbar (selectorKey composer.toolbarBoldButton).',
  },
  {
    id: 'composer-toggle-italic',
    label: 'Toggle italic formatting',
    description: 'Click the Italic button in the reply toolbar (selectorKey composer.toolbarItalicButton).',
  },
  {
    id: 'composer-toggle-bulleted-list',
    label: 'Toggle bulleted list',
    description: 'Click the Bulleted List button in the reply toolbar (selectorKey composer.toolbarBulletedList).',
  },
  {
    id: 'composer-toggle-numbered-list',
    label: 'Toggle numbered list',
    description: 'Click the Numbered List button in the reply toolbar (selectorKey composer.toolbarNumberedList).',
  },
  {
    id: 'switch-to-reply',
    label: 'Switch to public reply mode',
    description: 'Toggle the composer into Reply (public) mode.',
  },
  {
    id: 'switch-to-internal-note',
    label: 'Switch to internal note mode',
    description: 'Toggle the composer into Notes (internal) mode.',
  },
  {
    id: 'click-send-button',
    label: 'Press Send',
    description: 'Click the Send button in the composer.',
  },
  {
    id: 'add-tags',
    label: 'Add tags',
    description: 'Open the Tags control, insert one or more tags, and commit them.',
  },
  {
    id: 'set-status',
    label: 'Set ticket status',
    description: 'Open the Status dropdown and select a specific status (e.g., Open, Pending, Closed).',
  },
  {
    id: 'set-custom-field',
    label: 'Set right-side custom field',
    description: 'Fill a Properties panel field by type (text, checkbox, dropdown, cascading, date, etc).',
  },
  {
    id: 'apply-macro-send-to-customer',
    label: 'Apply “Send to Customer” macro',
    description: 'Open the Macro menu and apply the “Send to Customer” macro.',
  },
  {
    id: 'dispatch-click',
    label: 'Click by CSS (dispatch events)',
    description: 'Find an element by selectorKey and fire low-level mouse events (for tricky Ember dropdowns).',
  },
  {
    id: 'dispatch-click-text',
    label: 'Click by exact text',
    description: 'Find a visible element (or dropdown option) by text and click it via dispatch events.',
  },
  {
    id: 'expect-visible',
    label: 'Assert element is visible',
    description: 'Wait until a selectorKey is visible on the page.',
  },
  {
    id: 'wait',
    label: 'Wait (ms)',
    description: 'Pause the flow for a fixed number of milliseconds.',
  },
];

const COMPOSITE_FLOW_NAMES = new Set<string>([
  'add-internal-note',
  'add-tags-and-status',
  'apply-send-to-customer',
  'assign-to-me',
  'switch-assignee-and-save',
  'change-brand-to-env',
  'close-active-tab',
  'open-first-conversation',
  'open-tab-by-subject',
  'search-by-subject',
  'select-user-case-by-subject',
  'users-open-directory',
  'users-results-visible',
  'users-toggle-first-attribute',
]);

const TEST_FLOW_NAMES = new Set<string>([
  'login-and-open-inbox',
  'demo-basic-capabilities',
  'demo-custom-fields',
  'demo-new-fields',
  'settings-create-trigger',
]);

export default function App() {
  const [tests, setTests] = useState('');
  const [grep, setGrep] = useState('');
  const [project, setProject] = useState('chromium');
  const [workers, setWorkers] = useState('1');
  const [headed, setHeaded] = useState(true);
  const [ticketId, setTicketId] = useState('');
  const [openFirstIfEmpty, setOpenFirstIfEmpty] = useState(true);
  const [runId, setRunId] = useState<string | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [lintStatus, setLintStatus] = useState<string>('');
  const [testId, setTestId] = useState<string>('');
  const logRef = useRef<HTMLPreElement>(null);
  const esRef = useRef<EventSource | null>(null);
  const [flows, setFlows] = useState<Array<{ name: string; file: string; description?: string }>>([]);
  const [selectorGroups, setSelectorGroups] = useState<Array<{ group: string; items: Array<{ key: string; candidates: string[] }> }>>([]);
  const [specs, setSpecs] = useState<Array<{ name: string; file: string }>>([]);
  const [specGroups, setSpecGroups] = useState<SpecGroup[]>([]);
  const [savedTests, setSavedTests] = useState<TestDef[]>([]);
  const [editingSel, setEditingSel] = useState<{ group: string; key: string } | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [flowEditing, setFlowEditing] = useState<{ file: string; content: string } | null>(null);
  const [queueEditor, setQueueEditor] = useState<{ open: boolean; text: string }>({ open: false, text: '' });
  const [selectedSpecGroup, setSelectedSpecGroup] = useState<string>('');
  const [builderId, setBuilderId] = useState('');
  const [builderName, setBuilderName] = useState('');
  const [builderDesc, setBuilderDesc] = useState('');
  const [builderSteps, setBuilderSteps] = useState<any[]>([]);
  const [newStepType, setNewStepType] = useState('click');
  const [showVideoLink, setShowVideoLink] = useState<boolean>(() => {
    try {
      const v = localStorage.getItem('ui.showVideoLink');
      return v === null ? true : v === 'true';
    } catch {
      return true;
    }
  });
  const [latestVideoUrl, setLatestVideoUrl] = useState<string | null>(null);
  const [reporting, setReporting] = useState<ReportingData | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [startingPipeline, setStartingPipeline] = useState(false);
  const [flowCategory, setFlowCategory] = useState<FlowCategory>('test');

  // Flows filtered by selected Kayako page (spec group) – only meaningful for test flows
  const visibleFlows = useMemo(() => {
    if (!selectedSpecGroup) return flows;
    const group = specGroups.find((g) => g.id === selectedSpecGroup);
    if (!group || !group.specs || group.specs.length === 0) return flows;
    const names = new Set(group.specs);
    return flows.filter((f) => names.has(f.name));
  }, [flows, specGroups, selectedSpecGroup]);

  const filteredFlows = useMemo(() => {
    if (flowCategory === 'composite') {
      return flows.filter((f) => COMPOSITE_FLOW_NAMES.has(f.name));
    }
    if (flowCategory === 'test') {
      // Prefer flows that already have generated specs, and fall back to known test-like flows.
      const specNames = new Set(specs.map((s) => s.name));
      return flows.filter((f) => (specNames.has(f.name) || TEST_FLOW_NAMES.has(f.name)) && !COMPOSITE_FLOW_NAMES.has(f.name));
    }
    // "individual" does not list YAML flows (it lists primitive actions instead)
    return [];
  }, [flowCategory, flows, specs]);

  const updateTestsField = (value: string | ((prev: string) => string)) => {
    setTests((prev) => {
      const next = typeof value === 'function' ? (value as (prev: string) => string)(prev) : value;
      try {
        localStorage.setItem('ui.tests', next);
      } catch {}
      return next;
    });
  };

  // Buffered logging to avoid UI lockups when many log events arrive at once.
  // We aggregate frequent lines and render them in chunks, keeping only a capped tail.
  const pendingLogsRef = useRef<string[]>([]);
  const flushTimerRef = useRef<number | null>(null);
  // Hard cap the size of the log text we keep rendered in the DOM.
  // Using chars is fast; ~1,000,000 chars is roughly 1MB of text and is plenty to inspect recent logs.
  const MAX_LOG_CHARS = 1_000_000;
  const FLUSH_INTERVAL_MS = 50; // ~20 FPS worst-case during bursts

  useEffect(() => {
    // Restore UI state
    try {
      const t = localStorage.getItem('ui.tests');
      if (t) setTests(t);
      const tk = localStorage.getItem('ui.ticketId');
      if (tk) setTicketId(tk);
      const hd = localStorage.getItem('ui.headed');
      if (hd !== null) setHeaded(hd === 'true');
    } catch {}

    api<{ runs: Run[] }>('/api/runs')
      .then((d) => {
        const list = d.runs || [];
        setRuns(list);
        // Auto-reconnect to the latest running run so Stop Run works after refresh
        const active = [...list].reverse().find((r) => r.status === 'running');
        if (active && !runId) {
          void connectToRun(active.id, true);
        }
      })
      .catch(() => {});
    api<{ flows: Array<{ name: string; file: string; description?: string }> }>('/api/flows')
      .then((d) => setFlows(d.flows || []))
      .catch(() => {});
    api<{ groups: Array<{ group: string; items: Array<{ key: string; candidates: string[] }> }> }>('/api/selectors')
      .then((d) => setSelectorGroups(d.groups || []))
      .catch(() => {});
    api<{ specs: Array<{ name: string; file: string }>; specGroups?: SpecGroup[] }>('/api/specs')
      .then((d) => {
        setSpecs(d.specs || []);
        setSpecGroups(d.specGroups || []);
      })
      .catch(() => {});
    api<{ tests: TestDef[] }>('/api/tests')
      .then((d) => setSavedTests(d.tests || []))
      .catch(() => {});
    void refreshReporting();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshReporting() {
    setReportLoading(true);
    try {
      const data = await api<ReportingData>('/api/reporting');
      setReporting(data);
    } catch {
      setReporting(null);
    } finally {
      setReportLoading(false);
    }
  }

  async function startPipelineRun() {
    setStartingPipeline(true);
    try {
      await api('/api/pipeline/start', { method: 'POST', body: JSON.stringify({}) });
      await refreshReporting();
    } catch (e) {
      appendLog(`[pipeline] Failed to start: ${(e as any)?.message || 'unknown error'}`);
    } finally {
      setStartingPipeline(false);
    }
  }

  function flushLogs() {
    const el = logRef.current;
    const queue = pendingLogsRef.current;
    if (!el || queue.length === 0) {
      flushTimerRef.current = null;
      return;
    }
    // Take current batch
    const batch = queue.join('\n') + '\n';
    pendingLogsRef.current = [];
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
    // Append in a single DOM write
    el.textContent += batch;
    // Trim head if we exceed cap
    if (el.textContent.length > MAX_LOG_CHARS) {
      el.textContent = el.textContent.slice(-MAX_LOG_CHARS);
      // eslint-disable-next-line no-console
      console.log('[ui] log buffer trimmed to cap', MAX_LOG_CHARS);
    }
    if (atBottom) el.scrollTop = el.scrollHeight;
    // Schedule another flush if more arrived while writing
    if (pendingLogsRef.current.length > 0) {
      flushTimerRef.current = window.setTimeout(flushLogs, FLUSH_INTERVAL_MS) as unknown as number;
    } else {
      flushTimerRef.current = null;
    }
  }

  function appendLog(line: string) {
    // Buffer the line and schedule a near-future flush.
    pendingLogsRef.current.push(line);
    if (flushTimerRef.current === null) {
      flushTimerRef.current = window.setTimeout(flushLogs, FLUSH_INTERVAL_MS) as unknown as number;
    }
  }

  async function connectToRun(id: string, keepLogs = false) {
    setRunId(id);
    const es = stream(`/api/runs/${encodeURIComponent(id)}/stream`);
    es.addEventListener('log', (ev: MessageEvent) => {
      try {
        const m = JSON.parse(ev.data);
        if (m?.line) {
          appendLog(m.line);
          // eslint-disable-next-line no-console
          console.log('[run log]', m.line);
        }
      } catch {}
    });
    es.addEventListener('begin', (ev: MessageEvent) => {
      try {
        const m = JSON.parse(ev.data);
        const line = `[run begin] args=${JSON.stringify(m?.args || [])}`;
        appendLog(line);
        // eslint-disable-next-line no-console
        console.log(line);
      } catch {}
    });
    es.addEventListener('end', async () => {
      // Optionally fetch the most recent video for this run before clearing state
      if (showVideoLink) {
        try {
          const d = await api<{ videos: Array<{ url: string }> }>(`/api/runs/${encodeURIComponent(id)}/videos`);
          const first = (d.videos || [])[0];
          setLatestVideoUrl(first ? first.url : null);
        } catch {
          setLatestVideoUrl(null);
        }
      }
      es.close();
      esRef.current = null;
      setRunId(null);
      api<{ runs: Run[] }>('/api/runs')
        .then((dd) => setRuns(dd.runs || []))
        .catch(() => {});
    });
    esRef.current = es;
    if (!keepLogs && logRef.current) {
      // Reset any pending buffered logs and clear the DOM
      pendingLogsRef.current = [];
      if (flushTimerRef.current !== null) {
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      logRef.current.textContent = '';
    }
  }

  async function startRun() {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    setLatestVideoUrl(null);
    const body: any = {
      target: {} as any,
      options: {} as any,
      env: {} as any,
    };
    if (tests.trim()) body.target.tests = tests.split(',').map((s) => s.trim()).filter(Boolean);
    // Keep simple defaults; hide extra fields in UI
    body.options.project = 'chromium';
    body.options.workers = '1';
    // Request Playwright to record videos when the user wants a link surfaced, via env override.
    if (showVideoLink) body.env.KAYAKO_VIDEO = 'on';
    // Default headed true in UI; still pass explicitly so orchestrator knows
    if (headed) {
      body.options.headed = true;
      // When headed, keep the browser open for a long time after tests so the user can inspect the final state.
      // Tests respect this via the KAYAKO_HOLD_OPEN_MS hook in fixtures/auth.fixture.ts.
      body.env.KAYAKO_HOLD_OPEN_MS = String(10 * 60 * 1000); // 10 minutes
    }
    if (ticketId.trim()) {
      body.env.KAYAKO_CONVERSATION_ID = ticketId.trim();
    }
    const d = await api<{ runId: string }>('/api/runs', { method: 'POST', body: JSON.stringify(body) });
    await connectToRun(d.runId);
  }

  async function stopRun() {
    let id = runId;
    if (!id) {
      try {
        const d = await api<{ runs: Run[] }>('/api/runs');
        const active = [...(d.runs || [])].reverse().find((r) => r.status === 'running');
        if (active) id = active.id;
      } catch {}
    }
    if (!id) {
      appendLog('[stop] No active run found');
      return;
    }
    await api(`/api/runs/${encodeURIComponent(id)}/stop`, { method: 'POST' });
  }

  function copyLogs() {
    const el = logRef.current;
    const text = el?.textContent || '';
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
      return;
    }
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch {}
    document.body.removeChild(ta);
  }

  function clearLogs() {
    if (logRef.current) {
      logRef.current.textContent = '';
    }
  }

  async function lintSelectors() {
    setLintStatus('Running...');
    const d = await api<{ ok: boolean; code: number; stdout: string; stderr: string }>('/api/selectors/lint', { method: 'POST' });
    setLintStatus(d.ok ? 'OK' : 'FAILED');
    appendLog(`[selectors lint] exit=${d.code}\n${d.stdout || ''}\n${d.stderr || ''}`);
  }

  async function generateFlow() {
    if (!testId.trim()) {
      appendLog('[flow gen] Provide a Test ID saved in storage/tests.json');
      return;
    }
    const d = await api<{ ok: boolean; stdout: string; stderr: string; flowPath: string }>('/api/flows/generate', {
      method: 'POST',
      body: JSON.stringify({ testId: testId.trim() }),
    });
    appendLog(`[flow gen] ${JSON.stringify(d)}`);
  }

  async function convertFlow(file: string) {
    const d = await api<{ ok: boolean; stdout: string; stderr: string }>(`/api/flows/convert`, {
      method: 'POST',
      body: JSON.stringify({ file }),
    });
    appendLog(`[flow convert] ${file} -> ${JSON.stringify(d)}`);
  }

  async function openFlowEditor(file: string) {
    try {
      const d = await api<{ file: string; content: string }>(`/api/flows/${encodeURIComponent(file)}/content`);
      setFlowEditing({ file: d.file, content: d.content || '' });
    } catch (e) {
      appendLog(`[flow edit] Failed to open ${file}`);
    }
  }

  async function saveFlow() {
    if (!flowEditing) return;
    try {
      const res = await api<{ ok: boolean; file: string }>(`/api/flows/save`, {
        method: 'POST',
        body: JSON.stringify({ file: flowEditing.file, content: flowEditing.content }),
      });
      appendLog(`[flow save] ${JSON.stringify(res)}`);
      const d = await api<{ flows: Array<{ name: string; file: string; description?: string }> }>('/api/flows');
      setFlows(d.flows || []);
      setFlowEditing(null);
    } catch (e) {
      appendLog(`[flow save] Failed: ${(e as any)?.message || ''}`);
    }
  }

  async function validateSelector(group: string, key: string) {
    const d = await api<{ ok: boolean; usedSelector?: string; fallbackIndex?: number; error?: string }>(`/api/selectors/validate`, {
      method: 'POST',
      body: JSON.stringify({ group, key }),
    });
    if (d.ok) {
      appendLog(`[selector validate] ${group}.${key} OK (selector=${d.usedSelector} idx=${d.fallbackIndex})`);
    } else {
      appendLog(`[selector validate] ${group}.${key} FAILED (${d.error || 'unknown error'})`);
    }
  }

  function openEditSelector(group: string, key: string, current: string[]) {
    setEditingSel({ group, key });
    setEditingText((current || []).join('\n'));
  }

  async function saveEditSelector() {
    if (!editingSel) return;
    const lines = editingText.split('\n').map((s) => s.trim()).filter((s) => s.length > 0);
    await api('/api/selectors/update', {
      method: 'POST',
      body: JSON.stringify({ group: editingSel.group, key: editingSel.key, candidates: lines }),
    });
    const d = await api<{ groups: Array<{ group: string; items: Array<{ key: string; candidates: string[] }> }> }>('/api/selectors');
    setSelectorGroups(d.groups || []);
    setEditingSel(null);
    setEditingText('');
  }

  function addBuilderStep() {
    const t = newStepType;
    const base: any = { type: t };
    if (t === 'goto') base.url = '';
    if (t === 'fill') base.selectorKey = '';
    if (t === 'click' || t === 'dispatch-click') base.selectorKey = '';
    if (t === 'dispatch-click-text') base.value = '';
    if (t === 'press') base.key = '';
    if (t === 'add-tags') base.values = [];
    if (t === 'insert-reply-text') base.value = '';
    if (t === 'set-status') base.value = '';
    if (t === 'set-custom-field') { base.fieldType = 'text'; base.label = ''; }
    setBuilderSteps((prev) => [...prev, base]);
  }

  function updateStep(idx: number, patch: any) {
    setBuilderSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function removeStep(idx: number) {
    setBuilderSteps((prev) => prev.filter((_, i) => i !== idx));
  }

  async function saveTest() {
    if (!builderId.trim() || !builderName.trim()) {
      appendLog('[save test] Provide ID and Name');
      return;
    }
    const test: TestDef = {
      id: builderId.trim(),
      name: builderName.trim(),
      description: builderDesc.trim() || undefined,
      steps: builderSteps,
    };
    const res = await api<{ ok: boolean; test: TestDef }>('/api/tests', { method: 'POST', body: JSON.stringify(test) });
    appendLog(`[save test] ${JSON.stringify(res)}`);
    const list = await api<{ tests: TestDef[] }>('/api/tests');
    setSavedTests(list.tests || []);
  }

  function loadTestToBuilder(t: TestDef) {
    setBuilderId(t.id || '');
    setBuilderName(t.name || '');
    setBuilderDesc(t.description || '');
    // Deep clone steps to avoid accidental mutation of state used elsewhere
    const cloned = JSON.parse(JSON.stringify(Array.isArray(t.steps) ? t.steps : []));
    setBuilderSteps(cloned);
  }

  async function deleteTest(id: string) {
    if (!id) return;
    try {
      await api(`/api/tests/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const list = await api<{ tests: TestDef[] }>('/api/tests');
      setSavedTests(list.tests || []);
      appendLog(`[delete test] ${id} removed`);
    } catch (e) {
      appendLog(`[delete test] failed for ${id}`);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Kayako Control Center (UI)</h2>

      <section style={{ border: '1px solid #e3e8ef', padding: 12, borderRadius: 8, marginBottom: 12, textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Automation status</h3>
          <button onClick={refreshReporting} disabled={reportLoading}>
            {reportLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        {reporting ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
              <div style={{ border: '1px solid #e3e8ef', borderRadius: 6, padding: 12 }}>
                <div style={{ fontSize: 12, color: '#666' }}>Runs</div>
                <div style={{ fontSize: 20, fontWeight: 600 }}>{reporting.runsSummary.total}</div>
                <div style={{ fontSize: 12, color: '#666' }}>
                  Running {reporting.runsSummary.running} · Passed {reporting.runsSummary.passed} · Failed {reporting.runsSummary.failed}
                </div>
              </div>
              <div style={{ border: '1px solid #e3e8ef', borderRadius: 6, padding: 12 }}>
                <div style={{ fontSize: 12, color: '#666' }}>Generated specs</div>
                <div style={{ fontSize: 20, fontWeight: 600 }}>{reporting.specsCount}</div>
                <div style={{ fontSize: 12, color: '#666' }}>tests/generated</div>
              </div>
            <div style={{ border: '1px solid #e3e8ef', borderRadius: 6, padding: 12 }}>
              <div style={{ fontSize: 12, color: '#666' }}>Composite specs</div>
              <div style={{ fontSize: 20, fontWeight: 600 }}>{reporting.compositeSpecsCount ?? 0}</div>
              <div style={{ fontSize: 12, color: '#666' }}>composite-*.spec.ts</div>
            </div>
              <div style={{ border: '1px solid #e3e8ef', borderRadius: 6, padding: 12 }}>
                <div style={{ fontSize: 12, color: '#666' }}>Selector suggestions</div>
                <div style={{ fontSize: 20, fontWeight: 600 }}>
                  {reporting.selectorSuggestions ? reporting.selectorSuggestions.pendingCount : 0}
                </div>
                {reporting.selectorSuggestions?.file && (
                  <div style={{ fontSize: 12, color: '#666' }}>{reporting.selectorSuggestions.file}</div>
                )}
              </div>
              {reporting.structures[0] && (
                <div style={{ border: '1px solid #e3e8ef', borderRadius: 6, padding: 12 }}>
                  <div style={{ fontSize: 12, color: '#666' }}>Latest capture</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{reporting.structures[0].crawlId}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>{reporting.structures[0].fileCount} files</div>
                </div>
              )}
              <div style={{ border: '1px solid #e3e8ef', borderRadius: 6, padding: 12 }}>
                <div style={{ fontSize: 12, color: '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Pipeline</span>
                  <button
                    onClick={startPipelineRun}
                    disabled={startingPipeline || !!reporting.pipeline?.active}
                    style={{ fontSize: 11, padding: '2px 8px' }}
                  >
                    {startingPipeline ? 'Starting…' : 'Start'}
                  </button>
                </div>
                {reporting.pipeline?.active ? (
                  <>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{reporting.pipeline.active.status}</div>
                    <div style={{ fontSize: 11, color: '#666' }}>ID {reporting.pipeline.active.id.slice(0, 8)}</div>
                    <ul style={{ marginTop: 6, paddingLeft: 16, fontSize: 12 }}>
                      {reporting.pipeline.active.stages.map((stage) => (
                        <li key={stage.name}>
                          {stage.name}: {stage.status}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: '#666' }}>
                    {reporting.pipeline?.pipelines?.[0]
                      ? `Last run ${reporting.pipeline.pipelines[0].status} (${new Date(
                          reporting.pipeline.pipelines[0].startedAt,
                        ).toLocaleString()})`
                      : 'No pipeline runs yet'}
                  </div>
                )}
              </div>
            </div>
            {reporting.crawls.length > 0 && (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Recent crawls</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid #e3e8ef', padding: 4 }}>ID</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid #e3e8ef', padding: 4 }}>Nodes</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid #e3e8ef', padding: 4 }}>Success</th>
                      <th style={{ textAlign: 'left', borderBottom: '1px solid #e3e8ef', padding: 4 }}>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporting.crawls.slice(0, 5).map((crawl) => (
                      <tr key={crawl.crawlId}>
                        <td style={{ padding: 4 }}>{crawl.crawlId}</td>
                        <td style={{ padding: 4 }}>{crawl.totalNodes}</td>
                        <td style={{ padding: 4 }}>{crawl.successNodes}</td>
                        <td style={{ padding: 4 }}>{crawl.updatedAt ? new Date(crawl.updatedAt).toLocaleString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 13, color: '#666' }}>No reporting data yet.</div>
        )}
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 1fr) minmax(360px, 1fr)', gap: 16, alignItems: 'start', marginBottom: 12 }}>
        <section style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', border: '1px solid #e3e8ef', padding: 12, borderRadius: 8, boxShadow: '0 12px 24px rgba(15,23,42,0.08)' }}>
          <h3>Run controls</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <label style={{ whiteSpace: 'nowrap' }}>Tests</label>
            <input value={tests} onChange={(e) => { updateTestsField(e.target.value); }} placeholder="apply-send-to-customer, add-internal-note" />
            <button onClick={() => setQueueEditor({ open: true, text: tests })}>Edit</button>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={headed}
                onChange={(e) => {
                  setHeaded(e.target.checked);
                  try { localStorage.setItem('ui.headed', String(e.target.checked)); } catch {}
                }}
              /> Headed
            </label>
          </div>
          {specGroups.length > 0 && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
              <label style={{ whiteSpace: 'nowrap' }}>Test set</label>
              <select
                value={selectedSpecGroup}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedSpecGroup(id);
                  const group = specGroups.find((g) => g.id === id);
                  if (group) {
                    updateTestsField(group.specs.join(', '));
                  }
                }}
              >
                <option value="">Custom</option>
                {specGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: 12, color: '#666' }}>
                Choose a Kayako page (e.g., Inbox, Ticket, Users) to prefill page-specific specs.
              </span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <label>Ticket ID</label>
            <input value={ticketId} onChange={(e) => { setTicketId(e.target.value); try { localStorage.setItem('ui.ticketId', e.target.value); } catch {} }} placeholder="e.g., 12345 (optional)" />
            <label><input type="checkbox" checked={openFirstIfEmpty} onChange={(e) => setOpenFirstIfEmpty(e.target.checked)} /> Open first if empty</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={showVideoLink}
                onChange={(e) => {
                  const v = e.target.checked;
                  setShowVideoLink(v);
                  try { localStorage.setItem('ui.showVideoLink', String(v)); } catch {}
                  if (!v) setLatestVideoUrl(null);
                }}
              /> Show latest video link
            </label>
            <span style={{ fontSize: 12, color: '#666' }}>
              If Ticket ID is provided, tests using goto-conversation-by-env-id will open it; otherwise most demo tests open the first conversation.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <button onClick={startRun}>Start Run</button>
            <button onClick={stopRun} disabled={!runId}>Stop Run</button>
            <button onClick={async () => { await api('/api/runs/kill-all', { method: 'POST' }); setRunId(null); }}>Force stop</button>
            <a
              href={
                runId
                  ? `${import.meta.env.VITE_ORCH_URL || 'http://127.0.0.1:7333'}/runs/${encodeURIComponent(runId)}/html/index.html`
                  : `${import.meta.env.VITE_ORCH_URL || 'http://127.0.0.1:7333'}/report/index.html`
              }
              target="_blank"
            >
              Open HTML report
            </a>
            {showVideoLink && latestVideoUrl && (
              <a
                href={`${import.meta.env.VITE_ORCH_URL || 'http://127.0.0.1:7333'}${latestVideoUrl}`}
                target="_blank"
                title="Open the most recent test video for the last run"
              >
                Latest video
              </a>
            )}
          </div>
        </section>
        {/* Queue editor modal */}
        {queueEditor.open && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
            <div style={{ width: 520, maxWidth: '95vw', background: '#fff', borderRadius: 10, border: '1px solid #e3e8ef', boxShadow: '0 16px 32px rgba(15,23,42,0.2)' }}>
              <div style={{ padding: 12, borderBottom: '1px solid #e3e8ef', fontWeight: 600 }}>Edit queued tests</div>
              <div style={{ padding: 12 }}>
                <textarea
                  rows={6}
                  style={{ width: '100%', fontFamily: 'monospace' }}
                  value={queueEditor.text}
                  onChange={(e) => setQueueEditor({ ...queueEditor, text: e.target.value })}
                  placeholder="Comma-separated names, e.g. apply-send-to-customer, add-internal-note"
                />
              </div>
              <div style={{ padding: 12, display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid #e3e8ef' }}>
                <button onClick={() => setQueueEditor({ open: false, text: '' })}>Cancel</button>
                <button
                  onClick={() => {
                    updateTestsField(queueEditor.text);
                    setQueueEditor({ open: false, text: '' });
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        <section style={{ border: '1px solid #e3e8ef', padding: 12, borderRadius: 8, textAlign: 'left' }}>
          <h3>Flows (@flows)</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#666' }}>View:</span>
            {(['individual', 'composite', 'test'] as FlowCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setFlowCategory(cat)}
                style={{
                  border: flowCategory === cat ? '1px solid #4f46e5' : '1px solid #e3e8ef',
                  borderRadius: 999,
                  padding: '4px 10px',
                  background: flowCategory === cat ? '#eef2ff' : '#f9fafb',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                {cat === 'individual' ? 'Individual actions' : cat === 'composite' ? 'Composite actions' : 'Tests'}
              </button>
            ))}
          </div>

          {flowCategory === 'individual' && (
            <div style={{ fontSize: 13 }}>
              <div style={{ marginBottom: 8, color: '#666' }}>
                Atomic actions you can use inside flows and saved tests. Each maps to a single Playwright helper.
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #e3e8ef', padding: 4 }}>Action</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #e3e8ef', padding: 4 }}>Step type</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #e3e8ef', padding: 4 }}>What it does</th>
                  </tr>
                </thead>
                <tbody>
                  {PRIMITIVE_ACTIONS.map((a) => (
                    <tr key={a.id}>
                      <td style={{ padding: 4, fontWeight: 600 }}>{a.label}</td>
                      <td style={{ padding: 4 }}>
                        <code>{a.id}</code>
                      </td>
                      <td style={{ padding: 4 }}>{a.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {flowCategory !== 'individual' && (
            <>
              {flowCategory === 'test' && specGroups.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>Tests grouped by Kayako page</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {specGroups.map((g) => (
                      <button
                        key={g.id}
                        style={{
                          border: selectedSpecGroup === g.id ? '1px solid #4f46e5' : '1px solid #e3e8ef',
                          borderRadius: 999,
                          padding: '4px 10px',
                          background: selectedSpecGroup === g.id ? '#eef2ff' : '#f9fafb',
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                        title={
                          g.specs.length
                            ? `Specs: ${g.specs.join(', ')}`
                            : 'No specs assigned yet; update storage/spec-groups.json'
                        }
                        onClick={() => {
                          if (g.specs.length === 0) return;
                          setSelectedSpecGroup(g.id);
                          updateTestsField(g.specs.join(', '));
                        }}
                      >
                        {g.label} ({g.specs.length})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 6, fontSize: 12, color: '#666' }}>
                {flowCategory === 'composite'
                  ? 'Composite flows: sequences of individual actions such as “add internal note”, “change properties and send”, or “apply macro and close”.'
                  : 'Test flows: higher-level scenarios built from composites and primitives (e.g., demos, settings flows, and page-level tests).'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) auto auto auto', gap: 8, alignItems: 'center' }}>
                {filteredFlows.map((f) => (
                  <div key={f.file} style={{ display: 'contents' }}>
                    <div>
                      <strong>{f.name}</strong>
                      {f.description ? <div style={{ color: '#666', fontSize: 12 }}>{f.description}</div> : null}
                      <div style={{ color: '#999', fontSize: 11 }}>{f.file}</div>
                    </div>
                    <button onClick={() => convertFlow(f.file)}>Convert to spec</button>
                    <button
                      onClick={() =>
                        updateTestsField((prev) =>
                          prev && prev.trim().length > 0 ? `${prev.replace(/\s*,\s*$/, '')}, ${f.name}` : f.name,
                        )
                      }
                    >
                      Queue in “Tests” field
                    </button>
                    <button onClick={() => openFlowEditor(f.file)}>Edit</button>
                  </div>
                ))}
                {flows.length === 0 && <div>No flows found in mcp/flows</div>}
                {flows.length > 0 && filteredFlows.length === 0 && flowCategory !== 'individual' && (
                  <div>No flows matched this view. Adjust the category or add a new flow under mcp/flows/.</div>
                )}
              </div>
            </>
          )}
          {flowEditing && (
            <div style={{ marginTop: 10, border: '1px solid #eee', borderRadius: 4, padding: 8 }}>
              <div style={{ marginBottom: 6 }}>
                Editing <code>{flowEditing.file}</code>
              </div>
              <textarea
                rows={12}
                style={{ width: '100%', fontFamily: 'monospace' }}
                value={flowEditing.content}
                onChange={(e) => setFlowEditing({ ...flowEditing, content: e.target.value })}
                placeholder="YAML content for the flow"
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button onClick={saveFlow}>Save</button>
                <button onClick={() => setFlowEditing(null)}>Cancel</button>
              </div>
            </div>
          )}
        </section>
      </div>

      <section style={{ border: '1px solid #e3e8ef', padding: 12, borderRadius: 8, marginBottom: 12, textAlign: 'left' }}>
        <h3>Saved Tests</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) auto auto auto', gap: 8, alignItems: 'center' }}>
          {savedTests.map((t) => (
            <div key={t.id} style={{ display: 'contents' }}>
              <div>
                <strong>{t.name}</strong>
                <div style={{ color: '#999', fontSize: 11 }}>{t.id}</div>
              </div>
              <button
                title="Add to queue"
                onClick={() => {
                  setTestId(t.id);
                  updateTestsField((prev) => (prev && prev.trim().length > 0 ? `${prev.replace(/\s*,\s*$/, '')}, ${t.name}` : t.name));
                }}
              >
                Queue
              </button>
              <button title="Load into Test Builder for editing" onClick={() => loadTestToBuilder(t)}>Edit</button>
              <button title="Delete saved test" onClick={() => deleteTest(t.id)}>Delete</button>
            </div>
          ))}
          {savedTests.length === 0 && <div>No saved tests in storage/tests.json</div>}
        </div>
      </section>

      <section style={{ border: '1px solid #e3e8ef', padding: 12, borderRadius: 8, marginBottom: 12, textAlign: 'left' }}>
        <h3>Test Builder</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
          <input value={builderId} onChange={(e) => setBuilderId(e.target.value)} placeholder="Test ID (unique)" />
          <input value={builderName} onChange={(e) => setBuilderName(e.target.value)} placeholder="Test Name" />
          <input value={builderDesc} onChange={(e) => setBuilderDesc(e.target.value)} placeholder="Description (optional)" />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <select value={newStepType} onChange={(e) => setNewStepType(e.target.value)}>
            <option value="goto">goto</option>
            <option value="goto-conversation-by-env-id">goto-conversation-by-env-id</option>
            <option value="click">click</option>
            <option value="dispatch-click">dispatch-click</option>
            <option value="dispatch-click-text">dispatch-click-text</option>
            <option value="insert-reply-text">insert-reply-text</option>
            <option value="switch-to-reply">switch-to-reply</option>
            <option value="add-tags">add-tags</option>
            <option value="set-status">set-status</option>
            <option value="set-custom-field">set-custom-field</option>
            <option value="wait">wait</option>
          </select>
          <button onClick={addBuilderStep}>Add step</button>
          <button onClick={saveTest} disabled={!builderId || !builderName || builderSteps.length === 0}>Save test</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
          {builderSteps.map((s, idx) => (
            <div key={idx} style={{ display: 'contents' }}>
              <div style={{ border: '1px solid #eee', padding: 8, borderRadius: 4 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{s.type}</div>
                {s.type === 'goto' && (
                  <div><input value={s.url || ''} onChange={(e) => updateStep(idx, { url: e.target.value })} placeholder="URL" style={{ width: '100%' }} /></div>
                )}
                {(s.type === 'click' || s.type === 'dispatch-click' || s.type === 'fill' || s.type === 'press') && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <input value={s.selectorKey || ''} onChange={(e) => updateStep(idx, { selectorKey: e.target.value })} placeholder="selector group.key" style={{ flex: 1 }} />
                    {s.type === 'fill' && <input value={s.value || ''} onChange={(e) => updateStep(idx, { value: e.target.value })} placeholder="value" />}
                    {s.type === 'press' && <input value={s.key || ''} onChange={(e) => updateStep(idx, { key: e.target.value })} placeholder="key (e.g., Enter)" />}
                  </div>
                )}
                {s.type === 'dispatch-click-text' && (
                  <div><input value={s.value || ''} onChange={(e) => updateStep(idx, { value: e.target.value })} placeholder="exact text to click" style={{ width: '100%' }} /></div>
                )}
                {s.type === 'insert-reply-text' && (
                  <div><input value={s.value || ''} onChange={(e) => updateStep(idx, { value: e.target.value })} placeholder="reply text" style={{ width: '100%' }} /></div>
                )}
                {s.type === 'add-tags' && (
                  <div><input value={(s.values || []).join(', ')} onChange={(e) => updateStep(idx, { values: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) })} placeholder="tag1, tag2" style={{ width: '100%' }} /></div>
                )}
                {s.type === 'set-status' && (
                  <div><input value={s.value || ''} onChange={(e) => updateStep(idx, { value: e.target.value })} placeholder="Status label (e.g., Open)" style={{ width: '100%' }} /></div>
                )}
                {s.type === 'set-custom-field' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <select value={s.fieldType || 'text'} onChange={(e) => updateStep(idx, { fieldType: e.target.value })}>
                      <option value="text">text</option>
                      <option value="textarea">textarea</option>
                      <option value="radio">radio</option>
                      <option value="dropdown">dropdown</option>
                      <option value="checkbox">checkbox</option>
                      <option value="integer">integer</option>
                      <option value="decimal">decimal</option>
                      <option value="yesno">yesno</option>
                      <option value="cascading">cascading</option>
                      <option value="date">date</option>
                      <option value="regex">regex</option>
                    </select>
                    <input value={s.label || ''} onChange={(e) => updateStep(idx, { label: e.target.value })} placeholder="Field label" />
                    <input value={s.value || ''} onChange={(e) => updateStep(idx, { value: e.target.value })} placeholder="Value" />
                    <input value={(s.path || []).join(' > ')} onChange={(e) => updateStep(idx, { path: e.target.value.split('>').map((t: string) => t.trim()).filter(Boolean) })} placeholder="Cascading path (A > B > C)" />
                  </div>
                )}
                {s.type === 'wait' && (
                  <div><input value={s.value || ''} onChange={(e) => updateStep(idx, { value: e.target.value })} placeholder="Milliseconds" /></div>
                )}
              </div>
              <div><button onClick={() => removeStep(idx)}>Remove</button></div>
            </div>
          ))}
          {builderSteps.length === 0 && <div>No steps yet. Add one above.</div>}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
          Tip: To send a public reply and apply, add steps: switch-to-reply → insert-reply-text → click selectorKey=composer.sendButton → set-status → click selectorKey=assign.updatePropertiesButton (if needed).
        </div>
      </section>

      <section style={{ border: '1px solid #e3e8ef', padding: 12, borderRadius: 8, marginBottom: 12, textAlign: 'left' }}>
        <h3>Selectors</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={lintSelectors}>Lint selectors.jsonc</button>
          <span>{lintStatus}</span>
        </div>
        {editingSel && (
          <div style={{ marginTop: 8, border: '1px solid #eee', padding: 8, borderRadius: 4 }}>
            <div style={{ marginBottom: 6 }}>
              Editing <code>{editingSel.group}.{editingSel.key}</code>
            </div>
            <textarea value={editingText} onChange={(e) => setEditingText(e.target.value)} rows={6} style={{ width: '100%' }} placeholder="[class*='...'] selector per line" />
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={saveEditSelector}>Save</button>
              <button onClick={() => { setEditingSel(null); setEditingText(''); }}>Cancel</button>
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>Note: Duplicates are removed and [class*=...] selectors are prioritized.</div>
          </div>
        )}
      </section>

      <section style={{ border: '1px solid #e3e8ef', padding: 12, borderRadius: 8, marginBottom: 12, textAlign: 'left' }}>
        <h3>Flow generation</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={testId} onChange={(e) => setTestId(e.target.value)} placeholder="Test ID from storage/tests.json" />
          <button onClick={generateFlow}>Generate spec</button>
        </div>
      </section>

      <section style={{ border: '1px solid #e3e8ef', padding: 12, borderRadius: 8, marginBottom: 12, textAlign: 'left' }}>
        <h3>Generated tests</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) auto', gap: 8 }}>
          {specs.map((s) => (
            <div key={s.file} style={{ display: 'contents' }}>
              <div>
                <strong>{s.name}</strong>
                <div style={{ color: '#999', fontSize: 11 }}>{s.file}</div>
              </div>
              <button
                onClick={() =>
                  updateTestsField((prev) => (prev && prev.trim().length > 0 ? `${prev.replace(/\s*,\s*$/, '')}, ${s.name}` : s.name))
                }
              >
                Queue in “Tests” field
              </button>
            </div>
          ))}
          {specs.length === 0 && <div>No generated specs found under tests/generated</div>}
        </div>
      </section>

      <section style={{ border: '1px solid #e3e8ef', padding: 12, borderRadius: 8, marginBottom: 12, textAlign: 'left' }}>
        <h3>Selectors (groups and keys)</h3>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {selectorGroups.map((g) => (
            <div key={g.group} style={{ minWidth: 260 }}>
              <h4 style={{ margin: '4px 0' }}>{g.group}</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {g.items.map((it) => (
                  <li key={it.key} style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <code style={{ fontSize: 12 }}>{it.key}</code>
                      <button onClick={() => validateSelector(g.group, it.key)} style={{ fontSize: 12 }}>Validate</button>
                      <button onClick={() => openEditSelector(g.group, it.key, it.candidates)} style={{ fontSize: 12 }}>Edit</button>
                    </div>
                    <div style={{ fontSize: 11, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 420 }}>
                      {it.candidates.join('  |  ')}
                    </div>
                  </li>
                ))}
                {g.items.length === 0 && <li>(no items)</li>}
              </ul>
            </div>
          ))}
          {selectorGroups.length === 0 && <div>No selectors loaded</div>}
        </div>
      </section>

      <section style={{ border: '1px solid #e3e8ef', padding: 12, borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3>Live logs</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={copyLogs}>Copy logs</button>
            <button onClick={clearLogs}>Clear logs</button>
          </div>
        </div>
        <pre ref={logRef} style={{ background: '#0b1221', color: '#d6e2ff', height: 320, overflow: 'auto', padding: 12, borderRadius: 6 }} />
      </section>
    </div>
  );
}
