import { readFile } from "node:fs/promises";

const requiredEnv = [
  "BLOGGER_CLIENT_ID",
  "BLOGGER_CLIENT_SECRET",
  "BLOGGER_REFRESH_TOKEN",
  "BLOGGER_BLOG_ID",
];

function fail(message) {
  console.error(`오류: ${message}`);
  process.exit(1);
}

function validatePost(post, source) {
  if (!post || typeof post !== "object") fail(`${source}: JSON 객체가 필요합니다.`);
  if (typeof post.title !== "string" || !post.title.trim()) fail(`${source}: title이 필요합니다.`);
  if (typeof post.content !== "string" || !post.content.trim()) fail(`${source}: content가 필요합니다.`);
  if (post.labels !== undefined && (!Array.isArray(post.labels) || post.labels.some((label) => typeof label !== "string"))) {
    fail(`${source}: labels는 문자열 배열이어야 합니다.`);
  }
}

async function getAccessToken() {
  for (const key of requiredEnv) {
    if (!process.env[key]) fail(`GitHub Secret ${key}가 설정되지 않았습니다.`);
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.BLOGGER_CLIENT_ID,
      client_secret: process.env.BLOGGER_CLIENT_SECRET,
      refresh_token: process.env.BLOGGER_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    fail(`Google OAuth 토큰 발급 실패 (${response.status}): ${data.error_description || data.error || "알 수 없는 오류"}`);
  }
  return data.access_token;
}

async function publishPost(post, accessToken) {
  const isDraft = post.isDraft === true;
  const endpoint = new URL(
    `https://www.googleapis.com/blogger/v3/blogs/${encodeURIComponent(process.env.BLOGGER_BLOG_ID)}/posts/`
  );
  if (isDraft) endpoint.searchParams.set("isDraft", "true");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      kind: "blogger#post",
      title: post.title.trim(),
      content: post.content,
      ...(post.labels?.length ? { labels: post.labels } : {}),
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    fail(`Blogger 발행 실패 (${response.status}): ${data.error?.message || "알 수 없는 오류"}`);
  }

  console.log(JSON.stringify({
    status: isDraft ? "draft" : "published",
    id: data.id,
    title: data.title,
    url: data.url || null,
  }));
}

const args = process.argv.slice(2);
const validateOnly = args.includes("--validate");
const paths = args.filter((arg) => arg !== "--validate");

if (paths.length === 0) fail("글 JSON 경로를 하나 이상 입력하세요.");

const posts = [];
for (const path of paths) {
  let post;
  try {
    post = JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    fail(`${path} 읽기 실패: ${error.message}`);
  }
  validatePost(post, path);
  posts.push({ path, post });
  console.log(`검증 완료: ${path}`);
}

if (!validateOnly) {
  const accessToken = await getAccessToken();
  for (const { path, post } of posts) {
    console.log(`발행 시작: ${path}`);
    await publishPost(post, accessToken);
  }
}
