# jyot.maheshwari — portfolio

Single-page portfolio. Plain HTML, CSS and JavaScript; no build step, no framework, no tracking.

```
index.html            the page
assets/css/style.css  theme, layout, components
assets/css/story.css  story mode
assets/images/        favicon (SVG monogram)
js/main.js            nav, hero event stream, counters, tabs, case-study modal, skill wiring, contact form
js/terminal.js        the ` terminal
js/story.js           story mode
resume/               the PDF the Resume buttons open
```

## Run locally

Open `index.html` in a browser. Everything works from `file://` except the contact form, which needs the page to be served over HTTP (any static server works: `python -m http.server 8000` then http://localhost:8000).

## Deploy to GitHub Pages

1. Create a **public** repository named exactly `<your-github-username>.github.io`.
2. Push this folder to its `main` branch:
   ```
   git init
   git add .
   git commit -m "Portfolio"
   git branch -M main
   git remote add origin https://github.com/<username>/<username>.github.io.git
   git push -u origin main
   ```
3. In the repo, Settings → Pages → Source: *Deploy from a branch*, branch `main`, folder `/ (root)`.
4. The site is live at `https://<username>.github.io/` within a minute or two.

## Before you publish

Search the files for these and fix each one:

- GitHub links point at `jyot21` (og:url, the three GitHub links, the MCP and RideSharing case-study links). Change them if you publish under a different account.
- `TODO` comments in `index.html` — places where only you know the detail: migration strategy, attendance partitioning and late-event handling, lock expiry strategy, MCP guardrails, the story chapters, and the "Present" end date on the Senior role.
- The contact form posts to **formsubmit.co** using `jyotmmaheshwari@gmail.com`. The first submission triggers a one-time activation email to that address; click the link in it, after which messages arrive normally.
- `resume/Jyot_Maheshwari_Resume.pdf` — replace when the resume changes, and update the "Last updated" text in the About section.

## Updating content

- **Experience**: each role is an `article.xp-panel` with `data-start` / `data-end` (`YYYY-MM` or `now`); the duration is computed.
- **Case studies**: each is an `article.card[data-case="id"]` for the grid plus a `<template id="case-id">` for the modal. Add both to add one.
- **Skills wiring**: the `WIRES` map at the top of the skill section in `js/main.js` says which chips light up together and what caption to show.
- **Terminal**: commands live in the `commands` object in `js/terminal.js`.
- **Story**: each `section.scene` in `index.html` is one chapter; `--d` on a child sets its reveal delay.
