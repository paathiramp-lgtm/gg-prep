# GG Prep — IIT JAM Geology quiz app

This is a static web app. It needs no paid API, database, server, or build step.

## Files
- `index.html` — page structure
- `styles.css` — design and responsive layout
- `app.js` — quiz engine, scoring, filters and validation
- `questions.json` — separate question bank

## Run it on your computer
Do not double-click `index.html` to open it as a `file://` page. The app loads `questions.json` using `fetch`, and browsers may block that.

1. Open this folder in VS Code.
2. Install the VS Code extension **Live Server** (by Ritwick Dey), if you do not already have it.
3. Right-click `index.html` and choose **Open with Live Server**.
4. The app should open in your browser.

## Publish online for free with GitHub Pages
1. Create or sign in to a GitHub account.
2. Create a new **public** repository, e.g. `gg-prep`.
3. Upload all four files (`index.html`, `styles.css`, `app.js`, `questions.json`) to the repository root.
4. Open repository **Settings → Pages**.
5. Under Build and deployment, choose **Deploy from a branch**.
6. Select branch `main`, folder `/ (root)`, then Save.
7. Wait for GitHub Pages to publish. The URL will look like `https://YOUR-USERNAME.github.io/gg-prep/`.

When you update `questions.json`, upload/commit the updated file to the same repository. The live site will serve the new bank.

## Question format
Each question is one JSON object in the `questions.json` array:

```json
{
  "id": "GG013",
  "mode": "mcq",
  "topic": "Mineralogy",
  "subtopic": "Silicate structures",
  "difficulty": "Medium",
  "marks": 2,
  "question": "Question text here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "answer": [1],
  "explanation": "Explain the correct answer and why the distractors are incorrect."
}
```

Rules:
- `mode` must be `mcq`, `msq`, or `nat`.
- `mcq` and `nat` must have exactly one correct option index in `answer`.
- `msq` may have multiple correct option indices.
- Option indices start at zero: `[0]` means A, `[1]` means B, `[0,2]` means A and C.
- `marks` should be 1 or 2.
- IDs must be unique.
- `nat` is the custom formula/mathematical-method recognition mode requested for this project; it is not numerical-answer entry.

The app checks IDs, modes, options, answer indices and required metadata when it loads. A malformed bank produces a visible load error rather than silently proceeding.

## Scoring
- MCQ: +1 or +2 if correct; −1/3 for a wrong 1-mark question; −2/3 for a wrong 2-mark question.
- MSQ: full marks only for an exact match; otherwise zero.
- NAT: full marks for the correct method/formula option; otherwise zero.
- Unattempted questions score zero.

## Important
The included `questions.json` contains 12 starter questions to test the application. It is not the 8,000-question bank. Question creation and subject-matter validation are a separate phase. The app can load a much larger JSON bank without changing the quiz engine, subject to browser memory and practical file-size limits.
