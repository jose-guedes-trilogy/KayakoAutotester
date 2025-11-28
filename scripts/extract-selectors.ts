import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import fg from 'fast-glob';

type HbsResult = {
	file: string;
	type: 'hbs';
	qaTokens: string[];
	selectors: string[];
};

type CssResult = {
	file: string;
	type: 'css';
	moduleToken: string;
	classNames: string[];
	selectors: string[];
};

type ExtractResult = HbsResult | CssResult;

const REPO_ROOT = process.cwd();
const FRONTEND_BASE = path.join(REPO_ROOT, 'kayako-frontend-cp-master');
const APP_BASE = path.join(FRONTEND_BASE, 'app');
const TEMP_LIST = path.join(REPO_ROOT, 'selectors', 'temp.txt');
const OUTPUT_DIR = path.join(REPO_ROOT, 'selectors', 'extracted');
const DEFAULT_OUTPUT_FILE = path.join(OUTPUT_DIR, 'all-selectors.json');

function log(message: string, ...args: unknown[]) {
	// Simple structured log for easier triage
	console.log(`[extract-selectors] ${message}`, ...args);
}

async function ensureDir(p: string) {
	await fsp.mkdir(p, { recursive: true }).catch(() => {});
}

async function readTextFileOrNull(filePath: string): Promise<string | null> {
	try {
		return await fsp.readFile(filePath, 'utf-8');
	} catch (err) {
		return null;
	}
}

function normalizeTempLine(line: string): string | null {
	const trimmed = line.trim();
	if (!trimmed) return null;
	// Ignore comments or headers if any
	if (trimmed.startsWith('#') || trimmed.startsWith('//')) return null;
	return trimmed.replace(/^\.\//, '');
}

function parseCliArgs() {
	const args = process.argv.slice(2);
	const flags = new Map<string, string | boolean>();
	for (let i = 0; i < args.length; i++) {
		const raw = args[i];
		if (!raw.startsWith('--')) continue;
		const eqIdx = raw.indexOf('=');
		if (eqIdx !== -1) {
			const key = raw.slice(2, eqIdx);
			const value = raw.slice(eqIdx + 1);
			flags.set(key, value);
			continue;
		}
		const key = raw.slice(2);
		const next = args[i + 1];
		if (next && !next.startsWith('--')) {
			flags.set(key, next);
			i++;
		} else {
			flags.set(key, true);
		}
	}
	return flags;
}

async function readInputListFromTemp(): Promise<string[]> {
	const file = await readTextFileOrNull(TEMP_LIST);
	if (!file) {
		log(`No temp list found at ${TEMP_LIST}.`);
		return [];
	}
	const lines = file.split(/\r?\n/).map(normalizeTempLine).filter(Boolean) as string[];
	// Deduplicate while preserving order
	const seen = new Set<string>();
	const result: string[] = [];
	for (const l of lines) {
		// Lines are relative to 'app', e.g. app\components\...\template.hbs
		const normalized = l.replace(/\\/g, '/'); // windows -> posix
		if (!seen.has(normalized)) {
			seen.add(normalized);
			result.push(normalized);
		}
	}
	return result;
}

async function buildScanListFromDirs(dirsCsv: string | boolean | undefined, allFlag: boolean): Promise<string[]> {
	const patterns: string[] = [];
	if (allFlag) {
		patterns.push('**/*.hbs', '**/*.css');
	} else if (typeof dirsCsv === 'string' && dirsCsv.trim().length > 0) {
		const dirs = dirsCsv.split(',').map((d) => d.trim()).filter(Boolean);
		for (const d of dirs) {
			// Scan both templates and css in provided directories
			patterns.push(`${d.replace(/\\/g, '/')}/**/*.hbs`);
			patterns.push(`${d.replace(/\\/g, '/')}/**/*.css`);
		}
	}
	if (patterns.length === 0) return [];
	const matches = await fg(patterns, { cwd: APP_BASE, dot: false, onlyFiles: true });
	// Prefix with app/
	const rels = matches.map((m) => `app/${m.replace(/\\/g, '/')}`);
	// Dedup
	return Array.from(new Set(rels));
}

function computeModuleTokenFromCssPath(absCssPath: string): string {
	// Derive token mimicking ember-cli-build generateScopedName override
	// path considered relative to app/ root
	let rel = path.relative(APP_BASE, absCssPath).replace(/\\/g, '/'); // posix-like
	// Expect .../styles.css
	if (!rel.endsWith('/styles.css')) {
		// If it's a direct styles.css under app root (e.g., app/styles/styles.css), handle generically
		rel = rel.replace(/\/?styles\.css$/i, '');
	} else {
		rel = rel.slice(0, -('/styles.css'.length));
	}
	// Convert path segments to underscore form
	let token = rel.replace(/\//g, '_');
	// Remove leading "components_" for compatibility with build override
	if (token.startsWith('components_')) {
		token = token.substring('components_'.length);
	}
	return token;
}

function extractCssClassNames(cssSource: string): string[] {
	// Remove comments to cut noise
	const withoutComments = cssSource.replace(/\/\*[\s\S]*?\*\//g, ' ');
	// Capture .class tokens (skip dots in numbers, but keep _ and -)
	const re = /\.([_a-zA-Z][-_a-zA-Z0-9]*)/g;
	const names = new Set<string>();
	let match: RegExpExecArray | null;
	while ((match = re.exec(withoutComments))) {
		const cls = match[1];
		// Skip known globals marker class tokens often inside :global(...) which we don't want as module classes.
		// Heuristic: ignore classes that clearly denote 3rd-party scopes or power-select internals (optional).
		if (cls === 'global') continue;
		names.add(cls);
	}
	return Array.from(names).sort();
}

function buildModuleSelectors(moduleToken: string, classNames: string[]): string[] {
	return classNames.map((cls) => `[class*="${moduleToken}__${cls}_"]`);
}

function extractQaTokensFromHbs(hbsSource: string): string[] {
	const tokens = new Set<string>();
	// Match qa-cls "qa-token" or 'qa-token'
	const qaClsRe = /qa-cls\s+(?:"([^"]+)"|'([^']+)')/g;
	let m: RegExpExecArray | null;
	while ((m = qaClsRe.exec(hbsSource))) {
		const token = (m[1] || m[2] || '').trim();
		if (token) tokens.add(token);
	}
	// Match qaClass="token" or 'token'
	const qaClassAttrRe = /qaClass\s*=\s*(?:"([^"]+)"|'([^']+)')/g;
	while ((m = qaClassAttrRe.exec(hbsSource))) {
		const token = (m[1] || m[2] || '').trim();
		if (token) tokens.add(token);
	}
	return Array.from(tokens).sort();
}

function buildQaSelectors(qaTokens: string[]): string[] {
	return qaTokens.map((t) => `[class*="${t}"]`);
}

async function processCss(absPath: string, relAppPath: string): Promise<CssResult | null> {
	const css = await readTextFileOrNull(absPath);
	if (css == null) {
		log(`WARN: CSS file missing: ${relAppPath}`);
		return null;
	}
	const classNames = extractCssClassNames(css);
	const moduleToken = computeModuleTokenFromCssPath(absPath);
	const selectors = buildModuleSelectors(moduleToken, classNames);
	return {
		file: relAppPath.replace(/\\/g, '/'),
		type: 'css',
		moduleToken,
		classNames,
		selectors,
	};
}

async function processHbs(absPath: string, relAppPath: string): Promise<HbsResult | null> {
	const hbs = await readTextFileOrNull(absPath);
	if (hbs == null) {
		log(`WARN: HBS file missing: ${relAppPath}`);
		return null;
	}
	const qaTokens = extractQaTokensFromHbs(hbs);
	const selectors = buildQaSelectors(qaTokens);
	return {
		file: relAppPath.replace(/\\/g, '/'),
		type: 'hbs',
		qaTokens,
		selectors,
	};
}

async function main() {
	const start = Date.now();
	log(`Starting selector extraction...`);
	log(`Base: ${FRONTEND_BASE}`);

	const flags = parseCliArgs();
	const outFileFlag = (flags.get('outfile') as string) || '';
	const scanAll = Boolean(flags.get('all'));
	const scanDirsCsv = flags.get('dirs');

	let entries: string[] = [];
	if (scanAll || scanDirsCsv) {
		entries = await buildScanListFromDirs(scanDirsCsv, scanAll);
		log(`Loaded ${entries.length} paths from scan (${scanAll ? 'all app' : `dirs=${scanDirsCsv}`}), deduped.`);
	} else {
		entries = await readInputListFromTemp();
		if (!entries.length) {
			process.exitCode = 1;
			log(`No input entries found. Provide --all/--dirs or populate selectors/temp.txt.`);
			return;
		}
		log(`Loaded ${entries.length} paths from selectors/temp.txt (deduped).`);
	}

	const results: ExtractResult[] = [];
	let cssFiles = 0;
	let hbsFiles = 0;
	let missingFiles = 0;

	for (const rel of entries) {
		const appRelative = rel.startsWith('app/') ? rel.slice('app/'.length) : rel;
		const absPath = path.join(APP_BASE, appRelative);

		if (!fs.existsSync(absPath)) {
			missingFiles++;
			log(`WARN: File from list not found: ${rel}`);
			continue;
		}
		if (absPath.endsWith('.css')) {
			cssFiles++;
			const res = await processCss(absPath, path.join('app', appRelative));
			if (res) results.push(res);
		} else if (absPath.endsWith('.hbs')) {
			hbsFiles++;
			const res = await processHbs(absPath, path.join('app', appRelative));
			if (res) results.push(res);
		} else {
			// Ignore other file types listed (if any)
		}
	}

	// Aggregate unique selectors across all
	const allSelectors = new Set<string>();
	let totalCssClasses = 0;
	let totalQaTokens = 0;
	for (const r of results) {
		for (const s of r.selectors) allSelectors.add(s);
		if (r.type === 'css') totalCssClasses += r.classNames.length;
		if (r.type === 'hbs') totalQaTokens += r.qaTokens.length;
	}

	await ensureDir(OUTPUT_DIR);
	const payload = {
		generatedAt: new Date().toISOString(),
		source: 'scripts/extract-selectors.ts',
		basePath: 'kayako-frontend-cp-master/app',
		inputList: scanAll || scanDirsCsv ? `(scan:${scanAll ? 'all' : scanDirsCsv})` : 'selectors/temp.txt',
		summary: {
			filesListed: entries.length,
			filesProcessed: results.length,
			cssFilesProcessed: cssFiles,
			hbsFilesProcessed: hbsFiles,
			filesMissing: missingFiles,
			totalCssClasses,
			totalQaTokens,
			totalUniqueSelectors: allSelectors.size,
			durationMs: Date.now() - start,
		},
		results,
		selectors: Array.from(allSelectors).sort(),
	};
	const outputFile = outFileFlag
		? path.isAbsolute(outFileFlag)
			? outFileFlag
			: path.join(REPO_ROOT, outFileFlag)
		: DEFAULT_OUTPUT_FILE;
	await fsp.writeFile(outputFile, JSON.stringify(payload, null, 2), 'utf-8');

	log(`Extraction complete.`);
	log(
		`Processed: ${results.length} files (css=${cssFiles}, hbs=${hbsFiles}) | Unique selectors: ${allSelectors.size} | Output: ${path.relative(
			REPO_ROOT,
			outputFile
		)}`
	);
}

main().catch((err) => {
	console.error(`[extract-selectors] ERROR:`, err);
	process.exitCode = 1;
});


