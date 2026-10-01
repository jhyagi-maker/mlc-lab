// @ts-check
import { defineConfig } from 'astro/config';

// GitHub Actions에서 빌드할 때 저장소 이름을 읽어 GitHub Pages 주소를 자동으로 맞춥니다.
// 예) 저장소가 my-lab/website 이면 https://my-lab.github.io/website 로 배포됩니다.
// 직접 도메인(예: lab.example.ac.kr)을 쓰게 되면 site를 그 주소로, base를 '/'로 바꾸세요.
const [owner, repo] = (process.env.GITHUB_REPOSITORY ?? '').split('/');
const isUserSite = repo?.endsWith('.github.io');

// https://astro.build/config
export default defineConfig({
	site: owner ? `https://${owner}.github.io` : undefined,
	base: repo && !isUserSite ? `/${repo}` : '/',
});
