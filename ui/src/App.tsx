import { useEffect, useRef, useState } from 'react';
import { api, stream } from './api';
import './App.css';

type Run = {
  id: string;
  status: string;
  startedAt?: string;
  endedAt?: string;
  summary?: { total: number; passed: number; failed: number; skipped: number };
};

export default function App() {
  const [tests, setTests] = useState('');
  const [grep, setGrep] = useState('');
  const [project, setProject] = useState('chromium');
  const [workers, setWorkers] = useState('50%');
  const [headed, setHeaded] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [lintStatus, setLintStatus] = useState<string>('');
  const [testId, setTestId] = useState<string>('');
  const logRef = useRef<HTMLPreElement>(null);
  const esRef = useRef<EventSource | null>(null);
  const [flows, setFlows] = useState<Array<{ name: string; file: string; description?: string }>>([]);
  const [selectorGroups, setSelectorGroups] = useState<Array<{ group: string; items: Array<{ key: string; candidates: string[] }> }>>([]);
  const [specs, setSpecs] = useState<Array<{ name: string; file: string }>>([]);

  useEffect(() => {
    api<{ runs: Run[] }>('/api/runs')
      .then((d) => setRuns(d.runs || []))
      .catch(() => {});
    api<{ flows: Array<{ name: string; file: string; description?: string }> }>('/api/flows')
      .then((d) => setFlows(d.flows || []))
      .catch(() => {});
    api<{ groups: Array<{ group: string; items: Array<{ key: string; candidates: string[] }> }> }>('/api/selectors')
      .then((d) => setSelectorGroups(d.groups || []))
      .catch(() => {});
    api<{ specs: Array<{ name: string; file: string }> }>('/api/specs')
      .then((d) => setSpecs(d.specs || []))
      .catch(() => {});
  }, []);

  function appendLog(line: string) {
    const el = logRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 4;
    el.textContent += line + '\n';
    if (atBottom) el.scrollTop = el.scrollHeight;
  }

  async function startRun() {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    const body: any = {
      target: {} as any,
      options: {} as any,
    };
    if (tests.trim()) body.target.tests = tests.split(',').map((s) => s.trim()).filter(Boolean);
    if (grep.trim()) body.target.grep = grep.trim();
    if (project.trim()) body.options.project = project.trim();
    if (workers.trim()) body.options.workers = workers.trim();
    if (headed) body.options.headed = true;
    const d = await api<{ runId: string }>('/api/runs', { method: 'POST', body: JSON.stringify(body) });
    setRunId(d.runId);
    const es = stream(`/api/runs/${encodeURIComponent(d.runId)}/stream`);
    es.addEventListener('log', (ev: MessageEvent) => {
      try {
        const m = JSON.parse(ev.data);
        if (m?.line) appendLog(m.line);
      } catch {}
    });
    es.addEventListener('end', () => {
      es.close();
      esRef.current = null;
      api<{ runs: Run[] }>('/api/runs')
        .then((dd) => setRuns(dd.runs || []))
        .catch(() => {});
    });
    esRef.current = es;
    if (logRef.current) logRef.current.textContent = '';
  }

  async function stopRun() {
    if (!runId) return;
    await api(`/api/runs/${encodeURIComponent(runId)}/stop`, { method: 'POST' });
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

  return (
    <div style={{ padding: 16 }}>
      <h2>Kayako Control Center (UI)</h2>

      <section style={{ border: '1px solid #ddd', padding: 12, borderRadius: 6, marginBottom: 12 }}>
        <h3>Run controls</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <label>Tests</label>
          <input value={tests} onChange={(e) => setTests(e.target.value)} placeholder="login-and-open-inbox, open-first-conversation" />
          <label>Grep</label>
          <input value={grep} onChange={(e) => setGrep(e.target.value)} placeholder="@smoke" />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <label>Project</label>
          <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="chromium" />
          <label>Workers</label>
          <input value={workers} onChange={(e) => setWorkers(e.target.value)} placeholder="50%" />
          <label><input type="checkbox" checked={headed} onChange={(e) => setHeaded(e.target.checked)} /> Headed</label>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <button onClick={startRun}>Start Run</button>
          <button onClick={stopRun} disabled={!runId}>Stop Run</button>
          <a href={`${import.meta.env.VITE_ORCH_URL || 'http://127.0.0.1:7333'}/report/index.html`} target="_blank">Open HTML report</a>
        </div>
        <div style={{ fontSize: 12, color: '#666' }}>
          Recent runs: {runs.length === 0 ? 'none' : runs.map((r) => `${r.id.substring(0, 6)}:${r.status}`).join(', ')}
        </div>
      </section>

      <section style={{ border: '1px solid #ddd', padding: 12, borderRadius: 6, marginBottom: 12 }}>
        <h3>Selectors</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={lintSelectors}>Lint selectors.jsonc</button>
          <span>{lintStatus}</span>
        </div>
      </section>

      <section style={{ border: '1px solid #ddd', padding: 12, borderRadius: 6, marginBottom: 12 }}>
        <h3>Flow generation</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={testId} onChange={(e) => setTestId(e.target.value)} placeholder="Test ID from storage/tests.json" />
          <button onClick={generateFlow}>Generate spec</button>
        </div>
      </section>

      <section style={{ border: '1px solid #ddd', padding: 12, borderRadius: 6, marginBottom: 12 }}>
        <h3>Flows (@flows)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8 }}>
          {flows.map((f) => (
            <div key={f.file} style={{ display: 'contents' }}>
              <div>
                <strong>{f.name}</strong>
                {f.description ? <div style={{ color: '#666', fontSize: 12 }}>{f.description}</div> : null}
                <div style={{ color: '#999', fontSize: 11 }}>{f.file}</div>
              </div>
              <button onClick={() => convertFlow(f.file)}>Convert to spec</button>
              <button onClick={() => setTests(f.name)}>Queue in “Tests” field</button>
            </div>
          ))}
          {flows.length === 0 && <div>No flows found in mcp/flows</div>}
        </div>
      </section>

      <section style={{ border: '1px solid #ddd', padding: 12, borderRadius: 6, marginBottom: 12 }}>
        <h3>Generated tests</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
          {specs.map((s) => (
            <div key={s.file} style={{ display: 'contents' }}>
              <div>
                <strong>{s.name}</strong>
                <div style={{ color: '#999', fontSize: 11 }}>{s.file}</div>
              </div>
              <button onClick={() => setTests(s.name)}>Queue in “Tests” field</button>
            </div>
          ))}
          {specs.length === 0 && <div>No generated specs found under tests/generated</div>}
        </div>
      </section>

      <section style={{ border: '1px solid #ddd', padding: 12, borderRadius: 6, marginBottom: 12 }}>
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

      <section style={{ border: '1px solid #ddd', padding: 12, borderRadius: 6 }}>
        <h3>Live logs</h3>
        <pre ref={logRef} style={{ background: '#0b1221', color: '#d6e2ff', height: 320, overflow: 'auto', padding: 12, borderRadius: 6 }} />
      </section>
    </div>
  );
}
