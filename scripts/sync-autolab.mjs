// MLC Auto-Lab 연구 결과를 홈페이지로 가져오는 스크립트
//   사용법:  npm run autolab
//   연구실 폴더 위치가 다르면:  set AUTOLAB_DIR=D:\다른\경로\mlc-auto-lab && npm run autolab
//
// 하는 일
//   1) <AUTOLAB_DIR>/evaluation/rubric.yaml  → src/data/autolab-meta.json (평가 기준)
//   2) <AUTOLAB_DIR>/outputs/*/run.json 중 최종 판정이 난 연구(PASS·INCOMPLETE)의 report.md 와 그림
//      → src/data/autolab/<run_id>/index.md (+ 그림 파일)
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lab = resolve(process.env.AUTOLAB_DIR ?? join(site, '..', 'mlc-auto-lab'));
const outDir = join(site, 'src', 'data', 'autolab');

if (!existsSync(join(lab, 'outputs'))) {
	console.error(`연구실 폴더를 찾을 수 없습니다: ${lab}\nAUTOLAB_DIR 환경변수로 위치를 알려 주세요.`);
	process.exit(1);
}

// 1) 평가 기준
const rubric = parse(readFileSync(join(lab, 'evaluation', 'rubric.yaml'), 'utf8'));
writeFileSync(join(site, 'src', 'data', 'autolab-meta.json'), JSON.stringify({ rubric, syncedAt: new Date().toISOString() }, null, 2));

// 2) 연구 결과 (매번 새로 만든다)
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const yamlStr = (s) => JSON.stringify(String(s ?? '')); // JSON 문자열은 YAML 에서도 유효

// 공개 사이트에서 가릴 산학 과제 업체명 (첫 글자만 남김). 새 업체가 생기면 여기에 추가.
const MASK = ['포항산업과학연구원', '포솔이노텍', '조광요턴', '포스코', 'POSCO', 'POSSEN', 'RIST', 'Next Engineering', '넥스트엔지니어링'];
const maskNames = (text) =>
	MASK.reduce((t, name) => t.replaceAll(name, name[0] + '*'.repeat(name.length - 1)), String(text ?? ''));
let count = 0;
for (const runId of readdirSync(join(lab, 'outputs')).sort()) {
	const runDir = join(lab, 'outputs', runId);
	const runFile = join(runDir, 'run.json');
	const reportFile = join(runDir, 'report.md');
	if (!existsSync(runFile) || !existsSync(reportFile)) continue;
	const run = JSON.parse(readFileSync(runFile, 'utf8'));
	if (!['passed', 'incomplete'].includes(run.status)) continue;

	let body = readFileSync(reportFile, 'utf8').replace(/^\uFEFF/, '');
	const title = (body.match(/^#\s+(.+)$/m)?.[1] ?? run.topic).trim();
	body = body.replace(/^#\s+.+\n/, ''); // 제목은 페이지 머리말에서 표시
	const summary = (body.match(/##\s*요약\s*\n+([\s\S]*?)(\n##|\n*$)/)?.[1] ?? '').trim().split('\n\n')[0];

	// 보고서에서 참조한 그림만 복사 (상대경로 유지 → Astro 가 이미지 처리)
	const target = join(outDir, runId);
	mkdirSync(target, { recursive: true });
	for (const [, src] of body.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)) {
		if (/^https?:/.test(src)) continue;
		const from = join(runDir, src);
		if (existsSync(from)) {
			mkdirSync(dirname(join(target, src)), { recursive: true });
			cpSync(from, join(target, src));
		} else {
			body = body.replace(`](${src})`, `](#그림-없음)`);
			console.warn(`  ! ${runId}: 그림 파일 없음 ${src}`);
		}
	}

	const fm = [
		'---',
		`slug: ${yamlStr(runId)}`,
		`title: ${yamlStr(title)}`,
		`topic: ${yamlStr(run.topic)}`,
		`date: ${yamlStr((run.created ?? '').slice(0, 10))}`,
		`verdict: ${yamlStr(run.verdict ?? '')}`,
		`score: ${Number(run.best_score ?? 0)}`,
		`iterations: ${Number(run.iteration ?? 1)}`,
		`mode: ${yamlStr(run.mode)}`,
		`summary: ${yamlStr(summary)}`,
		'---',
		'',
	].join('\n');
	writeFileSync(join(target, 'index.md'), maskNames(fm + body));
	count++;
	console.log(`  + ${runId}  (${run.verdict}, ${run.best_score}점)`);
}
console.log(`완료: 연구 결과 ${count}건, 평가 기준 동기화 → src/data/autolab/`);
