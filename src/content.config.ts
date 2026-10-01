// 사이트 콘텐츠 정의 파일입니다. 내용 수정은 src/data 폴더에서 하세요.
import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { parse } from 'yaml';

// YAML 목록에 id와 순서를 자동으로 붙여서, 편집하는 사람이 id를 적지 않아도 되게 합니다.
const yamlList = (text: string) =>
	(parse(text) ?? []).map((item: Record<string, unknown>, index: number) => ({
		id: String(index),
		order: index,
		...item,
	}));

const roles = ['교수', '박사후연구원', '박사과정', '석사과정', '학부연구생', '졸업생'] as const;
const pubTypes = ['저널', '학회', '특허'] as const;
const projectCategories = ['연구과제', '산학협력·창업지원'] as const;

const lab = defineCollection({
	loader: file('src/data/lab.yaml', { parser: (text) => [{ id: 'lab', ...parse(text) }] }),
	schema: z.object({
		name: z.string(),
		nameEn: z.string().optional(),
		affiliation: z.string(),
		tagline: z.string(),
		intro: z.string(),
		research: z.array(z.object({ title: z.string(), summary: z.string() })),
		contact: z.object({
			email: z.string(),
			phone: z.string().optional(),
			address: z.string(),
			mapUrl: z.string().optional(),
		}),
		recruiting: z.boolean().default(false),
		recruitingText: z.string().optional(),
	}),
});

const members = defineCollection({
	loader: file('src/data/members.yaml', { parser: yamlList }),
	schema: z.object({
		order: z.number(),
		name: z.string(),
		nameEn: z.string().optional(),
		role: z.enum(roles, { message: `role은 다음 중 하나여야 합니다: ${roles.join(', ')}` }),
		photo: z.string().optional(),
		email: z.string().optional(),
		interest: z.string().optional(),
		note: z.string().optional(),
		career: z.array(z.string()).optional(),
		awards: z.array(z.string()).optional(),
	}),
});

const projects = defineCollection({
	loader: file('src/data/projects.yaml', { parser: yamlList }),
	schema: z.object({
		order: z.number(),
		title: z.string(),
		start: z.number({ message: 'start에는 시작 연도 숫자(예: 2025)만 적어 주세요' }),
		end: z.number({ message: 'end에는 종료 연도 숫자(예: 2027)만 적어 주세요' }).optional(),
		category: z
			.enum(projectCategories, { message: `category는 다음 중 하나여야 합니다: ${projectCategories.join(', ')}` })
			.default('연구과제'),
		type: z.string().optional(),
		agency: z.string().optional(),
		role: z.string().optional(),
		budget: z.string().optional(),
		summary: z.string().optional(),
	}),
});

const publications = defineCollection({
	loader: file('src/data/publications.yaml', { parser: yamlList }),
	schema: z.object({
		order: z.number(),
		title: z.string(),
		authors: z.string(),
		venue: z.string(),
		year: z.number({ message: 'year에는 숫자(예: 2026)만 적어 주세요' }),
		type: z.enum(pubTypes, { message: `type은 다음 중 하나여야 합니다: ${pubTypes.join(', ')}` }),
		link: z.string().optional(),
		highlight: z.boolean().default(false),
	}),
});

const news = defineCollection({
	loader: glob({ base: './src/data/news', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
	}),
});

// 학생 실험 결과 (src/data/experiments.csv) — 엑셀로 편집 가능한 CSV
function parseCsv(text: string): Record<string, string>[] {
	const rows: string[][] = [];
	let row: string[] = [], cell = '', quoted = false;
	const src = text.replace(/^﻿/, '');
	for (let i = 0; i < src.length; i++) {
		const ch = src[i];
		if (quoted) {
			if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
			else if (ch === '"') quoted = false;
			else cell += ch;
		} else if (ch === '"') quoted = true;
		else if (ch === ',') { row.push(cell); cell = ''; }
		else if (ch === '\n' || ch === '\r') {
			if (ch === '\r' && src[i + 1] === '\n') i++;
			row.push(cell); rows.push(row); row = []; cell = '';
		} else cell += ch;
	}
	if (cell || row.length) { row.push(cell); rows.push(row); }
	const [header = [], ...body] = rows.filter((r) => r.some((c) => c.trim() !== ''));
	return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

const num = z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number({ message: '숫자만 입력하세요' }).optional());
const testTypes = ['weight_loss', 'outdoor', 'polarization', 'sst', 'eis'] as const;

const experiments = defineCollection({
	loader: file('src/data/experiments.csv', {
		parser: (text) => parseCsv(text).map((r, i) => ({ id: String(i + 1), row: i + 2, ...r })),
	}),
	schema: z.object({
		row: z.number(),
		date: z.string().optional(),
		student: z.string().optional(),
		sample: z.string().min(1, 'sample(시편 이름)을 입력하세요'),
		material: z.string().min(1, 'material(재료)을 입력하세요'),
		test: z.enum(testTypes, { message: `test는 다음 중 하나여야 합니다: ${testTypes.join(', ')}` }),
		replicate_n: num, coating_thickness_um: num, area_cm2: num, exposure_h: num, mass_loss_g: num,
		density_g_cm3: num, max_pit_depth_um: num, icorr_uA_cm2: num, ew_g: num, sst_white_rust_h: num,
		sst_red_rust_h: num, sst_censored: num, target_h: num, z_lowfreq_ohm_cm2: num,
		notes: z.string().optional(),
	}),
});

// 자동 연구 결과 — `npm run autolab` 이 mlc-auto-lab/outputs 에서 생성한다 (직접 수정하지 않음)
const autolab = defineCollection({
	loader: glob({ base: './src/data/autolab', pattern: '*/index.md' }),
	schema: z.object({
		title: z.string(),
		topic: z.string(),
		date: z.string(),
		verdict: z.string(),
		score: z.number(),
		iterations: z.number(),
		mode: z.string(),
		summary: z.string(),
	}),
});

export const collections = { lab, members, publications, projects, news, autolab, experiments };
