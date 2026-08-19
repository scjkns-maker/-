# Blogger 자동 발행

이 저장소의 `posts/` 폴더에 새 JSON 글 파일을 추가해 `main` 브랜치로 병합하면 GitHub Actions가 Google Blogger API를 호출해 블로그스팟에 자동 발행합니다.

## 동작 방식

- 새로 추가된 `posts/*.json` 파일만 발행합니다.
- 기존 파일 수정은 다시 발행하지 않아 중복 게시를 방지합니다.
- `posts/example.json`은 예시 전용이며 자동 발행에서 제외됩니다.
- `isDraft: true`이면 임시 글, `false`이면 공개 글로 등록합니다.
- Google 인증정보는 코드가 아닌 GitHub Actions Secrets에만 저장합니다.

## 1. Google Cloud 설정

1. Google Cloud Console에서 프로젝트를 만듭니다.
2. **API 및 서비스 → 라이브러리**에서 **Blogger API v3**를 사용 설정합니다.
3. OAuth 동의 화면을 구성합니다.
4. OAuth 2.0 클라이언트 ID와 클라이언트 보안 비밀번호를 생성합니다.
5. Blogger 쓰기 범위 `https://www.googleapis.com/auth/blogger`로 장기 사용 가능한 Refresh Token을 발급합니다.
6. Blogger 관리 화면 또는 API에서 발행 대상의 숫자형 Blog ID를 확인합니다.

Refresh Token은 Blogger 블로그 소유 Google 계정으로 승인해야 합니다.

## 2. GitHub Secrets 등록

저장소의 **Settings → Secrets and variables → Actions → New repository secret**에서 아래 4개를 등록합니다.

| Secret | 값 |
|---|---|
| `BLOGGER_CLIENT_ID` | Google OAuth 클라이언트 ID |
| `BLOGGER_CLIENT_SECRET` | Google OAuth 클라이언트 보안 비밀번호 |
| `BLOGGER_REFRESH_TOKEN` | Blogger 권한을 승인한 Refresh Token |
| `BLOGGER_BLOG_ID` | 발행할 블로그의 숫자형 ID |

인증값을 글 파일, README, 커밋, 이슈 또는 PR에 직접 입력하지 마세요.

## 3. 글 작성

`posts/example.json`을 복사해 새로운 영문 파일명으로 저장합니다. 예: `posts/air-purifier-guide.json`

```json
{
  "title": "블로그 글 제목",
  "content": "<h2>첫 번째 소제목</h2><p>본문은 HTML 형식입니다.</p>",
  "labels": ["정보", "가이드"],
  "isDraft": true
}
```

필드 설명:

- `title`: 필수 제목
- `content`: 필수 HTML 본문
- `labels`: 선택 라벨 목록
- `isDraft`: `true`는 임시 글, `false`는 즉시 공개

처음에는 반드시 `isDraft: true`로 테스트하세요.

## 4. 자동 발행

새 글 파일을 커밋하고 `main` 브랜치에 반영하면 **Publish new posts to Blogger** 워크플로가 실행됩니다. 결과는 저장소의 **Actions** 탭에서 확인할 수 있습니다.

수동 테스트가 필요하면 Actions에서 워크플로를 선택하고 **Run workflow**를 누른 뒤 글 경로를 입력합니다. 같은 파일을 수동으로 여러 번 실행하면 중복 글이 생성될 수 있습니다.

## 로컬 검증

Node.js 20 이상에서 다음 명령으로 JSON 형식을 검사할 수 있습니다.

```bash
npm run validate -- posts/example.json
```

실제 발행은 GitHub Actions를 권장합니다.
