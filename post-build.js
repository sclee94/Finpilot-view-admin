import { readFileSync, writeFileSync, mkdirSync, renameSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const indexPath = resolve(__dirname, "out/index.html");
const loginDir = resolve(__dirname, "out/login");
const loginIndexPath = resolve(loginDir, "index.html");

let html = readFileSync(indexPath, "utf-8");

// Replace JS and CSS paths
html = html.replaceAll("/finpilot/admin/assets/JS/", "/finpilot/static/admin/assets/JS/");
html = html.replaceAll("/finpilot/admin/assets/CSS/", "/finpilot/static/admin/assets/CSS/");

// Replace favicon/icon paths — 이 경로들도 /finpilot/admin/** SPA 캐치올(RegistryConfig)에
// 잡혀서 HTML이 리턴되던 문제가 있어, 실제 이미지 리소스 핸들러(/finpilot/static/admin/images/)로 보낸다.
html = html.replaceAll("/finpilot/admin/favicon-16.png", "/finpilot/static/admin/images/favicon-16.png");
html = html.replaceAll("/finpilot/admin/favicon-32.png", "/finpilot/static/admin/images/favicon-32.png");
html = html.replaceAll("/finpilot/admin/apple-touch-icon.png", "/finpilot/static/admin/images/apple-touch-icon.png");

writeFileSync(indexPath, html, "utf-8");

// Move index.html to login/index.html
mkdirSync(loginDir, { recursive: true });
renameSync(indexPath, loginIndexPath);

console.log("post-build: index.html moved to out/login/index.html with paths updated.");
