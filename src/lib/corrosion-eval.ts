// 부식 실험 결과 평가 모듈 — 결과표(빌드 시)와 입력 계산기(브라우저)가 함께 쓴다.
// 근거 규격: ASTM G1/G31(무게감량), ASTM G102(전기화학 → 부식속도), NACE SP0775(부식속도 등급),
//           ISO 9223(대기 부식성 — 아연 1년차), ISO 9227(염수분무). EIS 기준은 유기 코팅 경험칙.

export type TestType = 'weight_loss' | 'outdoor' | 'polarization' | 'sst' | 'eis';

export interface ExperimentInput {
	date?: string;
	student?: string;
	sample: string;
	material: string; // 'Zn flake' | 'Zn-Mg-Al' | '탄소강' | 기타
	test: TestType;
	replicate_n?: number;
	coating_thickness_um?: number;
	// 무게감량 / 옥외폭로
	area_cm2?: number;
	exposure_h?: number;
	mass_loss_g?: number;
	density_g_cm3?: number;
	max_pit_depth_um?: number;
	// 전기화학 분극
	icorr_uA_cm2?: number;
	ew_g?: number;
	// 염수분무
	sst_white_rust_h?: number;
	sst_red_rust_h?: number;
	sst_censored?: number; // 1 = 시험 종료 시점까지 적청 없음
	target_h?: number;
	// EIS
	z_lowfreq_ohm_cm2?: number;
	notes?: string;
}

export type Level = 'good' | 'fair' | 'poor' | 'bad' | 'info';
export interface Metric { label: string; value: string; }
export interface Evaluation {
	title: string;
	grade: { label: string; level: Level };
	metrics: Metric[];
	remarks: string[];
	recommendations: string[];
	missing: string[];
}

export const TEST_LABELS: Record<TestType, string> = {
	weight_loss: '무게감량 (침지·실험실)',
	outdoor: '옥외 대기폭로 (무게감량)',
	polarization: '동전위 분극 (icorr)',
	sst: '염수분무 시험 (ISO 9227)',
	eis: '전기화학 임피던스 (EIS)',
};

export const MATERIALS: Record<string, { ew: number; density: number; zinc: boolean; coated: boolean; note?: string }> = {
	'Zn flake': { ew: 32.68, density: 7.13, zinc: true, coated: true, note: 'Zn 기준 당량·밀도로 근사' },
	'Zn-Mg-Al': { ew: 32.68, density: 7.13, zinc: true, coated: true, note: 'Zn 기준 당량·밀도로 근사 (합금 조성에 따라 다름)' },
	'Zn 도금': { ew: 32.68, density: 7.13, zinc: true, coated: true },
	'탄소강': { ew: 27.92, density: 7.87, zinc: false, coated: false },
};

/** CSV 열 순서 (src/data/experiments.csv 헤더와 동일) */
export const CSV_COLUMNS: (keyof ExperimentInput)[] = [
	'date', 'student', 'sample', 'material', 'test', 'replicate_n', 'coating_thickness_um',
	'area_cm2', 'exposure_h', 'mass_loss_g', 'density_g_cm3', 'max_pit_depth_um',
	'icorr_uA_cm2', 'ew_g', 'sst_white_rust_h', 'sst_red_rust_h', 'sst_censored', 'target_h',
	'z_lowfreq_ohm_cm2', 'notes',
];

/** 시험 종류별 필수 입력 */
export const REQUIRED: Record<TestType, (keyof ExperimentInput)[]> = {
	weight_loss: ['area_cm2', 'exposure_h', 'mass_loss_g'],
	outdoor: ['area_cm2', 'exposure_h', 'mass_loss_g'],
	polarization: ['icorr_uA_cm2'],
	sst: ['sst_red_rust_h'],
	eis: ['z_lowfreq_ohm_cm2'],
};

export const FIELD_LABELS: Partial<Record<keyof ExperimentInput, string>> = {
	area_cm2: '시편 면적 (cm²)', exposure_h: '노출 시간 (h)', mass_loss_g: '무게 감량 (g)',
	density_g_cm3: '밀도 (g/cm³)', max_pit_depth_um: '최대 피트 깊이 (µm)', icorr_uA_cm2: '부식전류밀도 icorr (µA/cm²)',
	ew_g: '당량 EW (g)', sst_white_rust_h: '백청 발생 (h)', sst_red_rust_h: '적청 발생 (h)',
	sst_censored: '적청 미발생 종료 (1=예)', target_h: '목표 시간 (h)', z_lowfreq_ohm_cm2: '|Z| at 0.01 Hz (Ω·cm²)',
	coating_thickness_um: '도막/도금 두께 (µm)', replicate_n: '반복 시편 수 (n)',
};

const fmt = (v: number, d = 3) => (Math.abs(v) >= 1000 || (Math.abs(v) < 0.001 && v !== 0) ? v.toExponential(2) : Number(v.toFixed(d)).toString());
const has = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** NACE SP0775 부식속도 등급 (탄소강 기준, mm/y) */
function naceGrade(mmy: number): { label: string; level: Level } {
	if (mmy < 0.025) return { label: '낮음 (NACE <0.025 mm/y)', level: 'good' };
	if (mmy <= 0.12) return { label: '보통 (NACE 0.025–0.12 mm/y)', level: 'fair' };
	if (mmy <= 0.25) return { label: '높음 (NACE 0.13–0.25 mm/y)', level: 'poor' };
	return { label: '심각 (NACE >0.25 mm/y)', level: 'bad' };
}

/** ISO 9223 대기 부식성 등급 — 아연 1년차 부식속도 (µm/y) */
function iso9223Zinc(umy: number): { label: string; level: Level } {
	const cats: [number, string, Level][] = [[0.1, 'C1 매우 낮음', 'good'], [0.7, 'C2 낮음', 'good'], [2.1, 'C3 보통', 'fair'],
		[4.2, 'C4 높음', 'poor'], [8.4, 'C5 매우 높음', 'bad'], [25, 'CX 극심', 'bad']];
	for (const [max, label, level] of cats) if (umy <= max) return { label: `${label} (ISO 9223, Zn ${fmt(umy, 2)} µm/y)`, level };
	return { label: `CX 초과 (Zn ${fmt(umy, 2)} µm/y)`, level: 'bad' };
}

function materialProps(e: ExperimentInput) {
	const m = MATERIALS[e.material];
	return {
		ew: e.ew_g ?? m?.ew,
		density: e.density_g_cm3 ?? m?.density,
		zinc: m?.zinc ?? /zn|아연/i.test(e.material),
		coated: m?.coated ?? has(e.coating_thickness_um),
		note: e.density_g_cm3 || e.ew_g ? undefined : m?.note,
	};
}

export function evaluate(e: ExperimentInput): Evaluation {
	const out: Evaluation = { title: TEST_LABELS[e.test] ?? e.test, grade: { label: '평가 불가', level: 'info' }, metrics: [], remarks: [], recommendations: [], missing: [] };
	const req = REQUIRED[e.test];
	if (!req) {
		out.remarks.push(`알 수 없는 시험 종류: ${e.test}`);
		return out;
	}
	out.missing = req.filter((k) => !has(e[k])).map((k) => FIELD_LABELS[k] ?? String(k));
	const mp = materialProps(e);
	const rec = (s: string) => out.recommendations.includes(s) || out.recommendations.push(s);

	// ---------- 시험별 계산 ----------
	if (out.missing.length === 0) {
		if (e.test === 'weight_loss' || e.test === 'outdoor') {
			if (!has(mp.density)) {
				out.missing.push(FIELD_LABELS.density_g_cm3!);
			} else {
				const mmy = (87600 * e.mass_loss_g!) / (e.area_cm2! * e.exposure_h! * mp.density); // ASTM G1
				const umy = mmy * 1000;
				const penetration_um = umy * (e.exposure_h! / 8760);
				out.metrics.push({ label: '부식속도', value: `${fmt(mmy, 4)} mm/y (${fmt(umy, 2)} µm/y)` });
				out.metrics.push({ label: '평균 침식 깊이', value: `${fmt(penetration_um, 2)} µm` });
				out.grade = e.test === 'outdoor' && mp.zinc ? iso9223Zinc(umy) : naceGrade(mmy);
				if (e.test === 'outdoor' && mp.zinc && e.exposure_h! < 8760 * 0.9) out.remarks.push('ISO 9223 등급은 1년 폭로 기준입니다. 1년 미만 데이터는 참고용입니다.');
				if (mp.zinc && e.test === 'weight_loss') out.remarks.push('NACE 등급은 탄소강 기준이므로 아연계 재료에는 상대 비교용으로만 사용하세요.');
				if (has(e.coating_thickness_um) && umy > 0) out.metrics.push({ label: '도막 소모 예상 (선형 가정)', value: `${fmt(e.coating_thickness_um / umy, 1)} 년` });
				if (has(e.max_pit_depth_um) && penetration_um > 0) {
					const pf = e.max_pit_depth_um / penetration_um;
					out.metrics.push({ label: '피팅 계수 (최대 피트/평균 침식)', value: fmt(pf, 1) });
					if (pf > 3) {
						out.remarks.push('피팅 계수가 커서 국부부식이 우세합니다. 평균 부식속도만으로 수명을 판단하면 위험합니다.');
						rec('순환 분극(ASTM G61)으로 피팅 전위(Epit)·재부동태 전위 측정');
						rec('피트 단면 SEM/광학 관찰과 피트 밀도·깊이 분포 측정(ASTM G46)');
					}
				} else {
					rec('최대 피트 깊이 측정(ASTM G46)으로 국부부식 여부 확인');
				}
				if (out.grade.level === 'poor' || out.grade.level === 'bad') {
					rec('동전위 분극으로 icorr를 측정해 무게감량 부식속도와 교차검증');
					rec('부식생성물 XRD·SEM-EDS 분석으로 부식 메커니즘 확인');
				}
			}
		}

		if (e.test === 'polarization') {
			if (!has(mp.ew) || !has(mp.density)) {
				out.missing.push('당량 EW·밀도 (재료가 목록에 없으면 직접 입력)');
			} else {
				const mmy = 3.27e-3 * e.icorr_uA_cm2! * mp.ew / mp.density; // ASTM G102
				out.metrics.push({ label: '부식속도 (ASTM G102)', value: `${fmt(mmy, 4)} mm/y (${fmt(mmy * 1000, 2)} µm/y)` });
				out.grade = naceGrade(mmy);
				if (has(e.coating_thickness_um) && mmy > 0) out.metrics.push({ label: '도막 소모 예상 (선형 가정)', value: `${fmt(e.coating_thickness_um / (mmy * 1000), 1)} 년` });
				rec('Tafel 외삽 구간(±50 mV 이상 선형 구간)과 IR 보정 여부 확인');
				if (out.grade.level !== 'good') rec('EIS로 피막·전하이동 저항을 측정해 분극 결과와 비교');
				rec('무게감량 시험(ASTM G31)으로 전기화학 부식속도 교차검증');
			}
		}

		if (e.test === 'sst') {
			const red = e.sst_red_rust_h!;
			const censored = e.sst_censored === 1;
			const target = e.target_h ?? 720;
			out.metrics.push({ label: '적청 발생', value: censored ? `> ${red} h (시험 종료까지 적청 없음)` : `${red} h` });
			if (has(e.sst_white_rust_h)) out.metrics.push({ label: '백청 발생', value: `${e.sst_white_rust_h} h` });
			out.metrics.push({ label: '목표', value: `${target} h${e.target_h ? '' : ' (기본값 — target_h 로 변경 가능)'}` });
			if (has(e.coating_thickness_um) && e.coating_thickness_um > 0) out.metrics.push({ label: '두께당 내식 시간', value: `${censored ? '> ' : ''}${fmt(red / e.coating_thickness_um, 1)} h/µm` });
			const ratio = red / target;
			if (ratio >= 1) out.grade = { label: censored ? '목표 달성 (중도절단)' : '목표 달성', level: 'good' };
			else if (censored) out.grade = { label: '판정 보류 — 목표 전 시험 종료', level: 'info' };
			else if (ratio >= 0.7) out.grade = { label: `목표 근접 (${Math.round(ratio * 100)}%)`, level: 'fair' };
			else out.grade = { label: `목표 미달 (${Math.round(ratio * 100)}%)`, level: 'bad' };

			if (censored && ratio < 1) rec('목표 시간까지 시험 연장 (중도절단 상태로는 합불 판정 불가)');
			if (censored && ratio >= 1) rec('배합 간 순위를 가리려면 시험 연장 또는 복합사이클시험(CCT, ISO 16701 등)으로 판별력 확보');
			if (!has(e.sst_white_rust_h) && mp.zinc) rec('백청 발생 시간도 기록 (아연계 코팅의 희생방식 진행 지표)');
			if (out.grade.level === 'bad' || out.grade.level === 'fair') {
				rec('도막두께 분포(ISO 2808)와 경화 조건 점검 — 두께 부족이 가장 흔한 원인');
				rec('절단면(cut-edge)·스크래치 부위 부식 별도 평가');
			}
			out.remarks.push('염수분무 시간은 실제 사용환경 수명과 직접 비례하지 않습니다. 배합 간 상대 비교로 사용하세요.');
		}

		if (e.test === 'eis') {
			const z = e.z_lowfreq_ohm_cm2!;
			out.metrics.push({ label: '|Z| 0.01 Hz', value: `${fmt(z)} Ω·cm² (log ${fmt(Math.log10(z), 2)})` });
			if (z >= 1e9) out.grade = { label: '차단성 우수 (≥10⁹ Ω·cm²)', level: 'good' };
			else if (z >= 1e6) out.grade = { label: '차단성 저하 진행 (10⁶–10⁹ Ω·cm²)', level: 'fair' };
			else out.grade = { label: '차단성 불량 (<10⁶ Ω·cm²)', level: 'bad' };
			if (mp.zinc) out.remarks.push('Zn 함유 코팅은 희생방식 때문에 유기 코팅보다 |Z|가 낮게 나오는 것이 정상일 수 있습니다. 시간에 따른 변화 추세로 판단하세요.');
			rec('침지 시간에 따른 EIS 반복 측정(예: 1, 24, 168, 500 h)으로 열화 추세 확인');
			rec('등가회로 피팅으로 피막 저항(Rcoat)·용량(Ccoat) 추출');
			if (out.grade.level !== 'good') rec('부착력(ISO 2409 크로스컷)과 기공·결함 SEM 관찰');
		}
	}

	// ---------- 공통 점검 ----------
	if (!has(e.replicate_n) || e.replicate_n < 3) rec('반복 시편 n≥3으로 재시험해 편차(평균±표준편차) 확보');
	if (mp.coated && !has(e.coating_thickness_um)) rec('도막/도금 두께 측정(ISO 2808·와전류) 후 결과와 함께 기록');
	if (mp.note && (e.test === 'polarization' || e.test === 'weight_loss' || e.test === 'outdoor')) out.remarks.push(`부식속도 환산: ${mp.note}.`);

	// ---------- 재료별 후속 실험 ----------
	if (e.material === 'Zn-Mg-Al') {
		rec('부식생성물 상 분석(XRD: simonkolleite, LDH 등)으로 Mg·Al의 보호 효과 확인');
		if (e.test === 'sst' || e.test === 'outdoor') rec('단면 부식량 영상 정량화(연구실 SAM 기반 분할법)로 절단면 부식 비교');
	}
	if (e.material === 'Zn flake') {
		if (e.test === 'sst') rec('실측 SST를 Zn flake 예측모델 v3.7과 비교·보정 (MLC Auto-Lab /research)');
		rec('배합(Zn flake·Zn dust·Al 분율)·경화조건을 함께 기록해 모델 보정 데이터로 활용');
	}
	if (out.missing.length) out.grade = { label: '입력 부족', level: 'info' };
	return out;
}

/** 여러 결과에서 추가 실험 제안을 모아 많이 필요한 순서로 정리 */
export function aggregateRecommendations(rows: { sample: string; ev: Evaluation }[]) {
	const map = new Map<string, Set<string>>();
	for (const { sample, ev } of rows) for (const r of ev.recommendations) (map.get(r) ?? map.set(r, new Set()).get(r)!).add(sample);
	return [...map.entries()].map(([text, s]) => ({ text, samples: [...s] })).sort((a, b) => b.samples.length - a.samples.length);
}

/** 학생 이름 가리기 — 한글 이름의 가운데 글자를 ㅇ으로 (우성훈 → 우ㅇ훈, 남궁민수 → 남ㅇㅇ수). 이미 가린 이름은 그대로. */
export function maskName(name?: string): string | undefined {
	if (!name) return name;
	return name.replace(/[가-힣]{2,5}/g, (n) => (n.length === 2 ? n[0] + 'ㅇ' : n[0] + 'ㅇ'.repeat(n.length - 2) + n[n.length - 1]));
}

/** 입력값을 experiments.csv 한 줄로 */
export function toCsvRow(e: ExperimentInput): string {
	return CSV_COLUMNS.map((c) => {
		const v = c === 'student' ? maskName(e.student) : e[c];
		if (v === undefined || v === null) return '';
		const s = String(v);
		return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
	}).join(',');
}
