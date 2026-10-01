# 연구실 홈페이지 관리 가이드

코딩을 몰라도 **텍스트 파일만 고치면** 사이트가 바뀌도록 만들어져 있습니다.
고칠 파일은 모두 `src/data` 폴더 안에 있습니다. **그 밖의 파일은 건드리지 않아도 됩니다.**

| 바꾸고 싶은 것 | 고칠 파일 |
|---|---|
| 연구실 이름, 소개, 연구 분야, 연락처, 학생 모집 | `src/data/lab.yaml` |
| 구성원 추가·삭제 | `src/data/members.yaml` |
| 논문 추가 | `src/data/publications.yaml` |
| 연구과제(펀딩) 추가 | `src/data/projects.yaml` |
| 소식(뉴스) 올리기 | `src/data/news` 폴더에 파일 추가 |
| 학생 실험 결과 (부식 평가·추가 실험) | `src/data/experiments.csv` |
| 실험실 연구진행 (AI 자동 연구 결과) | `npm run autolab` 한 줄 실행 |
| 구성원 사진 | `public/images/members` 폴더에 사진 넣기 |

---

## 공개 정보 규칙 (꼭 지켜 주세요)

이 사이트의 원본 파일은 GitHub에 **공개**됩니다.
- **학생 이름**은 가운데 글자를 ㅇ으로 적습니다 (우성훈 → 우ㅇ훈). 실험 결과 입력 화면은 자동으로 가립니다.
- **산학 과제 업체명**은 첫 글자만 남기고 *로 가립니다 (포스코 → 포**).
- 논문 저자 목록은 이미 공개된 서지 정보라 실명 그대로 둡니다.

## 1. 구성원 추가하기

`src/data/members.yaml` 을 열고, 기존 사람 한 명의 덩어리를 복사해 붙여넣은 뒤 내용을 바꿉니다.

```yaml
- name: 김새봄
  nameEn: Saebom Kim
  role: 석사과정
  interest: 부식 억제제 개발
```

- `role` 은 **교수 / 박사후연구원 / 박사과정 / 석사과정 / 학부연구생 / 졸업생** 중 하나를 그대로 써야 합니다.
- 졸업하면 `role: 졸업생` 으로 바꾸고 `note: 2026 석사 졸업 → OO회사` 처럼 적으면 됩니다.
- 사진을 넣으려면 `public/images/members` 폴더에 `saebom.jpg` 같은 파일을 넣고 `photo: saebom.jpg` 한 줄을 추가하세요.

## 2. 논문 추가하기

`src/data/publications.yaml` 에 아래 덩어리를 추가합니다. 연도별 정렬은 자동입니다.

```yaml
- title: 논문 제목
  authors: 김새봄, 홍길동
  venue: Corrosion Science
  year: 2026
  type: 저널
  link: https://doi.org/10.xxxx/xxxxx
```

- `type` 은 **저널 / 학회 / 특허** 중 하나.
- `highlight: true` 줄을 추가하면 홈 화면 '대표 논문'에 나옵니다.

## 3. 연구과제(펀딩) 추가하기

`src/data/projects.yaml` 에 아래 덩어리를 추가합니다. '연구' 페이지 아래쪽에 최신순으로 나옵니다.

```yaml
- title: 과제 이름
  start: 2026
  end: 2029
  type: 기본연구
  agency: 한국연구재단
  role: 주관
  budget: 1억 5,000만 원
  summary: 과제 내용을 한두 문장으로
```

- 진행 중인 과제는 `end` 줄을 지우면 "2026 – 현재"로 표시됩니다.
- 창업보육·강소특구 같은 사업은 `category: 산학협력·창업지원` 줄을 넣으면 별도 목록으로 나옵니다.
- `type`, `agency`, `role`, `budget`, `summary` 는 없으면 줄째로 지워도 됩니다.
- 산학협력단 최신 과제는 [ScholarWorks 교수 페이지](https://scholarworks.gnu.ac.kr/researcher/b794a301-2fc4-4270-8f47-496b21f2120c/item)에서 'Funding'으로 걸러 확인할 수 있습니다.

## 4. 교수 약력·수상 고치기

`src/data/members.yaml` 의 교수 덩어리에서 `career:`(약력), `awards:`(수상) 아래 `- ` 로 시작하는 줄을 추가·수정하면 됩니다.

## 5. 소식(뉴스) 올리기

`src/data/news` 폴더의 파일 하나를 복사해서 이름을 바꿉니다. (예: `2026-10-05-seminar.md`)
파일 이름은 **영문·숫자·하이픈(-)만** 쓰세요. 이 이름이 인터넷 주소가 됩니다.

```markdown
---
title: 소식 제목
date: 2026-10-05
---

여기에 본문을 씁니다. 빈 줄로 문단을 나눕니다.

**굵게**, *기울임*, [링크 글자](https://주소) 를 쓸 수 있습니다.
```

---

### 사진이 있는 소식
소식 하나를 **폴더**로 만들고, 그 안에 `index.md` 와 사진 파일을 함께 넣습니다.
```
src/data/news/2026-10-05-seminar/
  index.md        ← 맨 위 --- 사이에 slug: 2026-10-05-seminar 한 줄 추가
  photo1.jpg
```
본문에서는 `![사진 설명](./photo1.jpg)` 로 넣습니다. 사진 여러 장을 가로로 나란히 놓으려면 `<div class="gallery">` 와 `</div>` 사이에 넣습니다 (예시: `src/data/news/2021-12-16-lab-intro/`).

## 6. 실험 결과 등록하기 (학생용)

'실험실 연구진행 → 실험 결과 평가' 페이지에서 측정값을 넣고 **평가하기**를 누르면 바로 부식 평가와 추가 실험 제안이 나옵니다.
결과를 홈페이지에 남기려면:

1. 평가 결과 아래 **CSV 한 줄 복사** 버튼을 누릅니다.
2. `src/data/experiments.csv` 를 열어 맨 아래 줄에 붙여넣고 저장합니다. (엑셀로 열어도 됩니다 — 저장할 때 형식은 'CSV UTF-8')
3. 사이트에 반영되면 '등록된 실험 결과'와 '추가 실험 계획'에 자동으로 나타납니다.

| 열 이름 | 내용 |
|---|---|
| `test` | `weight_loss`(침지 무게감량) · `outdoor`(옥외폭로) · `polarization`(분극) · `sst`(염수분무) · `eis` 중 하나 |
| `material` | `Zn flake` · `Zn-Mg-Al` · `Zn 도금` · `탄소강` 또는 다른 재료 이름 |
| `sst_censored` | 시험 종료까지 적청이 없으면 `1` |
| 나머지 | 열 이름에 단위가 붙어 있습니다 (예: `area_cm2` = cm², `icorr_uA_cm2` = µA/cm²). 해당 없는 칸은 비워 둡니다 |

평가식(ASTM G1·G102, NACE SP0775, ISO 9223·9227)과 추가 실험 규칙은 `src/lib/corrosion-eval.ts` 에 있습니다.

## 7. 실험실 연구진행 (AI 자동 연구 결과) 반영하기

'실험실 연구진행' 페이지는 `mlc-auto-lab` 폴더의 자동 연구 결과를 보여 줍니다. 새 연구가 끝나면 이 폴더에서:

```
npm run autolab
```

- 최종 판정(PASS·INCOMPLETE)이 난 연구의 보고서·그림과 평가 기준이 `src/data/autolab/` 로 복사됩니다.
- `src/data/autolab/` 과 `src/data/autolab-meta.json` 은 자동 생성 파일이니 직접 고치지 마세요. 공개하고 싶지 않은 연구는 복사된 폴더를 지우면 됩니다(다음 동기화 때 다시 생기므로, 연구실 폴더 쪽에서 정리하는 것이 확실합니다).
- 연구실 폴더 위치가 다르면: `set AUTOLAB_DIR=D:\경로\mlc-auto-lab` 후 실행.

## 8. 고친 내용을 사이트에 반영하기 (GitHub 사용)

처음 한 번만 설정하면, 이후로는 **GitHub 웹사이트에서 파일을 고치고 저장만 하면** 1~2분 뒤 사이트에 자동 반영됩니다.

**처음 한 번 설정**
1. 이 폴더를 GitHub 저장소로 올립니다. (Claude에게 "GitHub에 올려줘"라고 부탁해도 됩니다)
2. 저장소 → **Settings → Pages** → Source를 **GitHub Actions** 로 선택합니다.
3. 사이트 주소는 `https://<계정이름>.github.io/<저장소이름>/` 이 됩니다.

**평소 수정 방법**
1. GitHub 저장소에서 고칠 파일(예: `src/data/members.yaml`)을 클릭합니다.
2. 오른쪽 위 연필 아이콘(✏️)을 눌러 수정합니다.
3. **Commit changes** 버튼을 누르면 끝입니다.
4. 저장소의 **Actions** 탭에서 초록색 체크(✅)가 뜨면 반영 완료입니다.

**빨간 X(❌)가 뜨면?** 파일에 오타가 있다는 뜻입니다. 빨간 X를 눌러 보면 한글로 무엇이 잘못됐는지 나옵니다.
흔한 실수:
- 들여쓰기가 다른 줄과 맞지 않음 (탭 대신 스페이스 2칸 사용)
- `role`, `type` 에 정해진 단어가 아닌 글자를 씀 (예: `석사` → `석사과정`)
- `year` 에 숫자가 아닌 글자를 씀
- 콜론(`:`) 뒤에 한 칸 띄우지 않음 (`name:홍길동` ❌ → `name: 홍길동` ✅)

---

## (선택) 내 컴퓨터에서 미리 보기

[Node.js](https://nodejs.org) 설치 후, 이 폴더에서:

```
npm install
npm run dev
```

브라우저에서 http://localhost:4321 을 열면 됩니다. 파일을 저장하면 화면이 바로 바뀝니다.

## (선택) 포인트 색상 바꾸기

`src/styles/global.css` 맨 위의 `--accent: #b5482a;` 값을 원하는 색 코드로 바꾸면 전체 포인트 색이 바뀝니다.
