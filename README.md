# 📸 Print Screenshot Automation with Playwright

A fast, silent, privacy-friendly Mac automation that uploads your latest screenshot to ```prnt.sc```, copies the link, shows a notification (with thumbnail), opens the link, and removes the local file. 

---

## ✨ Features

| Feature | Status |
|--------|--------|
Auto-detect newest screenshot | ✅  
Silent upload (headless Playwright) | ✅  
macOS notification with thumbnail | ✅  
Sound alert | ✅  
Auto-copy link to clipboard | ✅  
Opens link in browser | ✅  
Deletes local screenshot | ✅  
`--watch` mode | ✅  

---

## ⚙️ Requirements

| Dependency | Desc | Install
|-----------|--------|--------|
Node.js | https://nodejs.org | Use Node 18/18+.
Playwright | Automation Tool | `npm install @playwright/test && npx playwright install`
Playwright Chromium | For Running the action in the background | `npx playwright install chromium`
terminal-notifier | For notification | `brew install terminal-notifier`

---

## 📦 Setup

```bash
git clone https://github.com/showhan/prnt-screenshot-uploader-automation.git
cd prnt-screenshot-uploader-automation
npm install
npm install @playwright/test
npx playwright install
npx playwright install chromium
brew install terminal-notifier
```

## Usage

Run node once to upload the latest screenshot file to https://prnt.sc/.
```
node upload-screenshot.js
```

Or, run node watch to keep it watching.
```
node upload-screenshot.js --watch
```

Now, when a new screenshot is added to the `Downloads` directory, it will automatically be uploaded to the https://prnt.sc/ website with opening the copied uploaded linke on a new tab of the browser.

That's all! 🎉
