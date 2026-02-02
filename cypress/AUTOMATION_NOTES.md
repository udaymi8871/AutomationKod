# Course Navigation Automation – Notes

## What’s in place

- **Login** → **Courses** → **View Syllabus** → **Start course** (Continue or Module/Topic/Subtopic).
- **Linear navigation**: Next through content; detects **code challenges** (Monaco), **MCQ/Practice**, and **Finish**.
- **Code challenges**: Uses `solutionCode.json` (javaSolution, javaSolution2, javaSolution3).
- **MCQ**: Tries options in order; if wrong, clicks Retake and tries next option until correct.

## Best approach used

- Reusable commands: `cy.login()`, `cy.submitCodeSolution()`, `cy.handleMCQQuestion()`, `cy.clickNextButton()`.
- Multiple selectors for MCQ (IDs + fallback by text/context) so the Practice screen is caught even if IDs change.
- Explicit waits for MCQ UI (Submit button visible) before interacting.
- Config timeouts tuned so the full flow can complete (Chrome headless).

## What would help from your side (optional)

- **Stable test account** – Login credentials that don’t expire or get locked; same course/syllabus so the path doesn’t change.
- **Test IDs in the app** – e.g. `data-testid="mcq-option-0"`, `data-testid="submit-mcq"` on the Practice screen. Makes selectors stable and less dependent on layout/text.
- **Fixed test course** – A short course (e.g. one module, one topic, one subtopic + one MCQ + one code challenge) so runs are fast and predictable.
- **Environment URL** – If you add a staging/test base URL, we can switch to it via `baseUrl` in `cypress.config.js` instead of hardcoding.

None of these are required for the current automation to run; they would make it easier to maintain and extend.

## Run

```bash
npx cypress run --browser chrome --spec "cypress/e2e/tests/CourseNavigation.cy.js"
```

Or open the runner and run the spec:

```bash
npx cypress open
```
