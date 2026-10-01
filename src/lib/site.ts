import { getCollection, getEntry } from 'astro:content';

export const roleOrder = ['교수', '박사후연구원', '박사과정', '석사과정', '학부연구생', '졸업생'] as const;

/** 사이트 주소 앞에 배포 경로(base)를 붙여 줍니다. */
export function url(path = '') {
	const base = import.meta.env.BASE_URL.replace(/\/$/, '');
	return `${base}/${path.replace(/^\//, '')}`;
}

export async function getLab() {
	const entry = await getEntry('lab', 'lab');
	if (!entry) throw new Error('src/data/lab.yaml 을 찾을 수 없습니다.');
	return entry.data;
}

export async function getNews() {
	const news = await getCollection('news');
	return news.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function getPublications() {
	const pubs = await getCollection('publications');
	return pubs.map((p) => p.data).sort((a, b) => b.year - a.year || a.order - b.order);
}

export async function getProjects() {
	const projects = await getCollection('projects');
	return projects.map((p) => p.data).sort((a, b) => b.start - a.start || a.order - b.order);
}

export async function getMembers() {
	const members = await getCollection('members');
	return members.map((m) => m.data).sort((a, b) => a.order - b.order);
}

export function formatDate(date: Date) {
	return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}
