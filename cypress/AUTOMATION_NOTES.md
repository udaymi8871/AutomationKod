# Course Navigation Automation – Notes

## What’s in place

- **Login** → **Courses** → **View Syllabus** → **Start course** (Continue or Module/Topic/Subtopic).
- **Linear navigation**: Next through content; detects **code challenges** (Monaco), **MCQ/Practice**, and **Finish**.
- **Code challenges**: Uses `solutionCode.json` (javaSolution, javaSolution2, javaSolution3).
- **MCQ** (only some subtopics have MCQ; next subtopic can also be MCQ type): For each MCQ subtopic: select option → submit → check **toast message** (passed or not). If not passed, click Retake and try next option until the toast says passed. Same flow whenever we land on an MCQ subtopic (including when the next subtopic is also MCQ).

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

## Regression flow (after first course completion)

1. Go back to **Courses**.
2. Click **Completed** tab (selector: `button` or `[role="tab"]` with text "Completed"; override in `cy.clickCompletedTab()` in `commands.js` if your app uses a different locator).
3. Click **View Syllabus** on the first completed course card.
4. Start course again (Continue or Module → Topic → Subtopic).
5. Run the full navigation again: Next through every subtopic, handle code challenges and MCQ, until Finish (complete course again for regression).

## Run

```bash
npx cypress run --browser chrome --spec "cypress/e2e/tests/CourseNavigation.cy.js"
```

Or open the runner and run the spec:

```bash
npx cypress open
```
