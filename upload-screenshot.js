#!/usr/bin/env node
const { chromium } = require("@playwright/test");
const { execSync, spawn, spawnSync } = require("child_process");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const DOWNLOADS = path.join(process.env.HOME, "Downloads");
const WATCH_MODE = process.argv.includes("--watch");
const VALID_EXT = new Set([".png", ".jpg", ".jpeg", ".tif", ".tiff", ".gif", ".bmp", ".webp", ".heic"]);

// --- Notification helper ---
function macNotifyTN({ title, message, sound = "Ping", imagePath }) {
  const args = [
    "-title", title,
    "-message", message,
    "-sound", sound,
    "-sender", "com.apple.Terminal",
  ];
  if (imagePath) args.push("-contentImage", imagePath);
  spawnSync("terminal-notifier", args, { stdio: "ignore" });
}

// --- Screenshot detection ---
function looksLikeScreenshot(name) {
  const n = name.toLowerCase();
  return (
    n.startsWith("screenshot") ||
    n.startsWith("screen shot") ||
    n.startsWith("cleanshot") ||
    n.startsWith("shottr") ||
    /screenshot.*\d/.test(n) ||
    /screen[\s-_]?shot.*\d/.test(n)
  );
}

async function getLatestScreenshot() {
  const files = await fsp.readdir(DOWNLOADS);
  let best = null;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!VALID_EXT.has(ext)) continue;

    const full = path.join(DOWNLOADS, file);
    const stat = await fsp.stat(full);
    if (!stat.isFile()) continue;

    const bias = looksLikeScreenshot(file) ? 10000 : 0;
    const score = stat.mtimeMs + bias;

    if (!best || score > best.score) best = { path: full, score };
  }
  return best?.path ?? null;
}

async function waitForFileStable(file) {
  let last = -1;
  for (let i = 0; i < 4; i++) {
    try {
      const s = await fsp.stat(file);
      if (s.size > 0 && s.size === last) return true;
      last = s.size;
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }
  return false;
}

// --- Upload to prnt.sc (your proven method) ---
async function uploadToPrntSc(filePath) {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  const page = await browser.newPage();

  try {
    await page.goto("https://prnt.sc", { waitUntil: "domcontentloaded" });
    await page.setInputFiles("input[type='file']", filePath);

    const linkLocator = page.locator("#link-textbox");
    await linkLocator.waitFor({ state: "visible" });
    await page.waitForFunction(
      el => el && el.getAttribute("href") && el.getAttribute("href").startsWith("http"),
      await linkLocator.elementHandle()
    );

    const link = await linkLocator.getAttribute("href");
    console.log("✅ Uploaded:", link);

    execSync(`printf %s "${link}" | pbcopy`);

    macNotifyTN({
      title: "Screenshot Uploaded",
      message: "Link copied to clipboard ✔",
      sound: "default",
      imagePath: filePath
    });

    execSync(`open "${link}"`);

    // setTimeout(() => {
    //   try {
    //     fs.unlinkSync(filePath);
    //     console.log("🗑️ Deleted:", filePath);
    //   } catch {}
    // }, 1500);

  } finally {
    await browser.close();
  }
}

// --- Run one upload ---
async function runOnce() {
  const latest = await getLatestScreenshot();
  if (!latest) return console.log("No screenshot found.");

  console.log("📁 Latest screenshot:", path.basename(latest));

  if (!(await waitForFileStable(latest))) {
    await new Promise(r => setTimeout(r, 300));
  }

  await uploadToPrntSc(latest);
}

// --- Watch mode ---
async function watchScreenshots() {
  console.log("👀 Watching for screenshots…");

  const seen = new Set();
  const seed = await getLatestScreenshot();
  if (seed) seen.add(seed);

  fs.watch(DOWNLOADS, { persistent: true }, async (_, filename) => {
    if (!filename) return;
    const full = path.join(DOWNLOADS, filename);

    const ext = path.extname(filename).toLowerCase();
    if (!VALID_EXT.has(ext)) return;
    if (!looksLikeScreenshot(filename)) return;

    await new Promise(r => setTimeout(r, 300));

    if (!(await waitForFileStable(full))) return;
    if (seen.has(full)) return;
    seen.add(full);

    console.log(`📸 New screenshot: ${filename}`);
    await uploadToPrntSc(full);
  });
}

// --- Entry ---
if (WATCH_MODE) {
  watchScreenshots();
} else {
  runOnce();
}
