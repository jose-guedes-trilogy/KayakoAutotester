import type { Page } from '@playwright/test';

const HUD_ENV = (process.env.KAYAKO_HUD || '').trim();
const HUD_ENABLED: boolean = HUD_ENV === '' ? true : HUD_ENV !== '0';

export async function hudEnsure(page: Page): Promise<void> {
  if (!HUD_ENABLED) return;
  // Add once per context
  await page.addInitScript(() => {
    try {
      (window as any).__kayakoHudInit = (window as any).__kayakoHudInit || (() => {
        if (document.getElementById('kayako-hud')) return;
        const root = document.createElement('div');
        root.id = 'kayako-hud';
        root.style.position = 'fixed';
        root.style.top = '8px';
        root.style.left = '8px';
        root.style.zIndex = '2147483647';
        root.style.background = 'rgba(10, 16, 28, 0.92)';
        root.style.color = '#d6e2ff';
        root.style.font = '12px/1.4 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif';
        root.style.border = '1px solid rgba(227,232,239,0.6)';
        root.style.borderRadius = '8px';
        root.style.padding = '8px';
        root.style.width = '320px';
        root.style.maxHeight = '40vh';
        root.style.overflow = 'hidden';
        root.style.boxShadow = '0 8px 16px rgba(0,0,0,0.35)';
        root.style.userSelect = 'none';
        root.style.cursor = 'default';
        const header = document.createElement('div');
        header.style.fontWeight = '600';
        header.style.marginBottom = '6px';
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        const title = document.createElement('div');
        title.textContent = 'Kayako Test HUD';
        const pos = ((): [number, number] | null => {
          try {
            const s = localStorage.getItem('kayako.hud.pos');
            if (!s) return null;
            const v = JSON.parse(s);
            if (Array.isArray(v) && v.length === 2) return [Number(v[0]), Number(v[1])];
          } catch {}
          return null;
        })();
        if (pos) {
          root.style.left = `${pos[0]}px`;
          root.style.top = `${pos[1]}px`;
        }
        const drag = document.createElement('div');
        drag.textContent = 'drag';
        drag.style.opacity = '0.8';
        drag.style.fontSize = '10px';
        drag.style.padding = '2px 6px';
        drag.style.border = '1px solid rgba(227,232,239,0.35)';
        drag.style.borderRadius = '6px';
        drag.style.cursor = 'move';
        header.appendChild(title);
        header.appendChild(drag);
        const status = document.createElement('div');
        status.id = 'kayako-hud-status';
        status.style.margin = '4px 0 6px';
        status.style.whiteSpace = 'pre-wrap';
        status.style.wordBreak = 'break-word';
        const log = document.createElement('div');
        log.id = 'kayako-hud-log';
        log.style.overflow = 'auto';
        log.style.maxHeight = '26vh';
        log.style.paddingRight = '2px';
        const ul = document.createElement('ul');
        ul.style.listStyle = 'none';
        ul.style.margin = '0';
        ul.style.padding = '0';
        log.appendChild(ul);
        root.appendChild(header);
        root.appendChild(status);
        root.appendChild(log);
        root.style.pointerEvents = 'none';
        document.documentElement.appendChild(root);
        drag.style.pointerEvents = 'auto';
        // Drag logic
        let dragging = false;
        let dx = 0, dy = 0;
        drag.addEventListener('mousedown', (ev) => {
          dragging = true;
          dx = ev.clientX - root.getBoundingClientRect().left;
          dy = ev.clientY - root.getBoundingClientRect().top;
          ev.preventDefault();
        });
        window.addEventListener('mousemove', (ev) => {
          if (!dragging) return;
          const l = Math.max(0, Math.min(window.innerWidth - root.offsetWidth, ev.clientX - dx));
          const t = Math.max(0, Math.min(window.innerHeight - root.offsetHeight, ev.clientY - dy));
          root.style.left = `${l}px`;
          root.style.top = `${t}px`;
        });
        window.addEventListener('mouseup', () => {
          if (!dragging) return;
          dragging = false;
          try {
            const left = parseInt(root.style.left || '0', 10) || 0;
            const top = parseInt(root.style.top || '0', 10) || 0;
            localStorage.setItem('kayako.hud.pos', JSON.stringify([left, top]));
          } catch {}
        });
        (window as any).__kayakoHudSet = (text: string) => {
          const s = document.getElementById('kayako-hud-status');
          if (s) s.textContent = text || '';
        };
        (window as any).__kayakoHudPush = (line: string) => {
          const list = document.querySelector('#kayako-hud-log ul');
          if (!list) return;
          const li = document.createElement('li');
          const ts = new Date();
          const hh = ts.getHours().toString().padStart(2, '0');
          const mm = ts.getMinutes().toString().padStart(2, '0');
          const ss = ts.getSeconds().toString().padStart(2, '0');
          li.textContent = `[${hh}:${mm}:${ss}] ${line}`;
          list.appendChild(li);
          // Trim to last 60
          while (list.children.length > 60) list.removeChild(list.firstChild as any);
          const logDiv = document.getElementById('kayako-hud-log');
          if (logDiv) logDiv.scrollTop = logDiv.scrollHeight;
        };
      });
      (window as any).__kayakoHudInit();
    } catch {}
  });
  await page.evaluate(() => {
    try {
      (window as any).__kayakoHudInit?.();
    } catch {}
  });
}

export async function hudSet(page: Page, text: string): Promise<void> {
  if (!HUD_ENABLED) return;
  await hudEnsure(page);
  await page.evaluate((t) => (window as any).__kayakoHudSet?.(t), text);
}

export async function hudPush(page: Page, line: string): Promise<void> {
  if (!HUD_ENABLED) return;
  await hudEnsure(page);
  await page.evaluate((l) => (window as any).__kayakoHudPush?.(l), line);
}

export function hudEnabled(): boolean {
  return HUD_ENABLED;
}


