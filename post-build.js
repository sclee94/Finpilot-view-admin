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

writeFileSync(indexPath, html, "utf-8");

// Move index.html to login/index.html
mkdirSync(loginDir, { recursive: true });
renameSync(indexPath, loginIndexPath);

console.log("post-build: index.html moved to out/login/index.html with paths updated.");
