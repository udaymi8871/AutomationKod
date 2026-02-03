import user from "../../../cypress/fixtures/user.json";
import solutionCode from "../../../cypress/fixtures/solutionCode.json";

describe('KodNest course flow', () => {
  it('login -> open course -> next', () => {
    cy.viewport(1400, 877);

    // Login using the custom command
    cy.login(user.email, user.password);

    // Wait for login to complete and page to navigate away from login page
    // Check that we're no longer on the login page
    cy.url({ timeout: 20000 }).should('not.include', '/login');

    // Wait for page to load after login - give more time for navigation
    cy.wait(3000);

    // Wait for the main page content to be visible
    cy.get('body', { timeout: 15000 }).should('be.visible');

    // 3) Open Courses - wait for it to be visible and clickable
    cy.contains('Courses', { matchCase: false }, { timeout: 20000 })
      .should('be.visible')
      .click();

    // Wait for courses page to load
    cy.wait(2000);

    // 4) Click View Syllabus using robust course card selector
    // Find the course card first, then the button within it
    cy.get('div[id^="course-item-"]', { timeout: 15000 })
      .first()
      .contains('button', 'View Syllabus')
      .scrollIntoView()
      .should('be.visible')
      .click();

    // Wait for syllabus to load - verify we navigated
    cy.url({ timeout: 15000 }).should('include', '/class/');
    cy.wait(3000); // Allow render time for modules

    // 5) Start the course
    cy.get('body').then(($body) => {
      // Option A: Click "Continue" or "Start" if available on the course header
      // We check for buttons containing relevant text
      const hasContinueBtn = $body.find('button').filter((i, el) => {
        const text = Cypress.$(el).text().trim();
        return text === 'Continue' || text === 'Start Course';
      }).length > 0;

      if (hasContinueBtn) {
        cy.log('Found Continue/Start button, clicking it...');
        cy.contains('button', /Continue|Start Course/i, { timeout: 10000 })
          .should('be.visible')
          .click({ force: true });
        cy.wait(3000);
      }
      // Option B: Navigate through Module -> Topic -> Subtopic
      else {
        cy.log('Start button not found, trying navigation via Module -> Topic -> Subtopic...');

        // 1. Expand the first Module
        // Module toggle IDs are like module-toggle-{uuid}
        cy.get('button[id^="module-toggle-"]', { timeout: 10000 })
          .first()
          .scrollIntoView()
          .should('be.visible')
          .click({ force: true });

        cy.wait(1000); // Wait for module to expand

        // 2. Expand the first Topic (if present) or click Subtopic directly
        cy.get('body').then(($body2) => {
          // Check for Topic toggles (nested inside module)
          const topicToggles = $body2.find('button[id^="topic-toggle-"]');

          if (topicToggles.length > 0 && topicToggles.is(':visible')) {
            cy.log('Found Topic toggle, expanding...');
            cy.get('button[id^="topic-toggle-"]')
              .first()
              .scrollIntoView()
              .click({ force: true });
            cy.wait(1000);
          }

          // 3. Click the first Subtopic/Lesson item
          cy.log('Clicking first lesson item...');
          cy.get('button[id^="subtopic-button-"]', { timeout: 10000 })
            .first()
            .should('exist')
            .scrollIntoView()
            .click({ force: true });

          cy.wait(3000);
        });
      }
    });

    // 6) Navigate linearly through the course: Module → Topic → Subtopic
    // Wait for the Next button to appear
    cy.get('#next-button', { timeout: 15000 })
      .should('be.visible');

    // Track programming challenge counter (first challenge uses javaSolution, second uses javaSolution2)
    let programmingChallengeCount = 0;

    // Navigate through the course - check for programming challenges and handle them
    // Continue until no more Next buttons are found or we reach the end
    for (let i = 0; i < 100; i++) { // Max 100 iterations to support longer courses
      cy.log(`Navigation iteration ${i + 1}`);

      // Check if we're on a programming challenge page or MCQ question
      cy.get('body').then(($body) => {
        const hasMonacoEditor = $body.find('.view-lines.monaco-mouse-cursor-text').length > 0;
        const hasRunButton = $body.find('#run-code-btn').length > 0;
        const hasSubmitCodeButton = $body.find('#submit-code-btn').length > 0;

        // MCQ detection: multiple strategies to catch the Practice/MCQ screen
        const hasOptionById = $body.find('#option-0').length > 0;
        const hasSubmitById = $body.find('#submit-button').length > 0;
        const win = $body[0]?.ownerDocument?.defaultView;
        const currentUrl = (win && win.location && win.location.href) ? win.location.href : '';
        const isOnClassPage = currentUrl.includes('/my-learning/class/');
        const hasPracticeLabel = $body.text().includes('Practice');
        const submitBtnByText = $body.find('button').filter((i, el) => {
          const t = Cypress.$(el).text().trim().toLowerCase();
          return t === 'submit' && !Cypress.$(el).closest('[id*="code"]').length;
        });
        // Catch MCQ screen: by ID, or on class page with Submit (no code editor) + options or "Practice"
        const hasMCQSubmitButton = hasSubmitById || (submitBtnByText.length > 0);
        const hasMCQOptions = hasOptionById || (isOnClassPage && !hasMonacoEditor && hasMCQSubmitButton && (hasPracticeLabel || $body.find('[id^="option-"]').length > 0 || $body.find('[data-option]').length > 0));

        // Check for "Finish" or "Complete" button (end of course)
        const finishButton = $body.find('button').filter((i, el) => {
          const text = Cypress.$(el).text().trim().toLowerCase();
          return text === 'finish' || text === 'complete course' || text === 'finish course';
        });

        if (hasMonacoEditor && hasRunButton && hasSubmitCodeButton) {
          // Programming challenge detected
          programmingChallengeCount++;
          cy.log(`Detected programming challenge #${programmingChallengeCount}...`);

          // CHECK IF ALREADY SUBMITTED (Disabled Submit Button)
          cy.get('#submit-code-btn', { timeout: 10000 }).then(($btn) => {
            if ($btn.is(':disabled')) {
              cy.log('Submit button is disabled - Challenge already submitted. Proceeding to next...');
            } else {
              // NOT SUBMITTED YET - PERFORM SUBMISSION
              cy.log('Submit button enabled - Submitting solution...');

              // Use appropriate solution based on challenge number
              let solutionToUse;
              if (programmingChallengeCount === 1) {
                solutionToUse = solutionCode.javaSolution;
              } else if (programmingChallengeCount === 2) {
                solutionToUse = solutionCode.javaSolution2;
              } else if (programmingChallengeCount === 3) {
                solutionToUse = solutionCode.javaSolution3;
              } else {
                solutionToUse = solutionCode.javaSolution;
              }

              // Use custom command to submit the code solution
              cy.submitCodeSolution(solutionToUse);

              // Add wait after submission for state to update
              cy.wait(3000);

              // VERIFY SUBMISSION SUCCESS: Check if button became disabled
              cy.log('Verifying submission: Submit button should be disabled...');
              cy.get('#submit-code-btn', { timeout: 10000 }).should('be.disabled');
            }

            // Proceed to Next button regardless of whether we submitted or it was already done
            cy.clickNextButton();
          });

          cy.wait(2000);
        } else if (hasMCQOptions && hasMCQSubmitButton) {
          // Only some subtopics have MCQ. When this subtopic is MCQ (or next subtopic is also MCQ type), handle it: select option → submit → check toast (passed/not) → retake and try next option until correct
          cy.log('Detected MCQ subtopic - handling: select → submit → toast → retake until correct (next subtopic if MCQ type will be handled same way)...');

          // Wait for MCQ UI to be ready (Submit button or options visible)
          cy.get('body').then(($b) => {
            if ($b.find('#submit-button').length) {
              cy.get('#submit-button', { timeout: 8000 }).should('be.visible');
            } else {
              cy.contains('button', 'Submit', { timeout: 8000 }).should('be.visible');
            }
          });

          // Always run option-by-option flow: select one option → submit → check toast (passed/not) → if not correct, retake and try next option until correct (Submit may be disabled until an option is selected)
          cy.log('Handling MCQ: try options one by one, submit each, check toast until correct...');
          cy.handleMCQQuestion();
          cy.wait(2000);

          // Click Next button after MCQ
          cy.clickNextButton();

          cy.wait(2000);
        } else if (finishButton.length > 0 && finishButton.is(':visible')) {
          // FINISH BUTTON FOUND
          cy.log('Found Finish/Complete button - Course Navigation Complete!');
          cy.wrap(finishButton).click({ force: true });
          cy.wait(3000);
          return false; // Break loop, course done
        } else {
          // Not a programming challenge or MCQ, check if Next button exists
          const nextButton = $body.find('#next-button');

          if (nextButton.length > 0 && nextButton.is(':visible')) {
            cy.log(`Clicking Next button (iteration ${i + 1})`);
            cy.clickNextButton();
            cy.wait(2000);
          } else {
            cy.log('No Next button found, navigation complete');
            return false; // Break the loop
          }
        }
      });
    }

    // ========== REGRESSION: Course completed – go to Completed tab, View Syllabus, run full course again ==========
    cy.log('Course completed. Starting regression: Completed tab → View Syllabus → complete all subtopics again.');

    // Go back to Courses (to see Completed tab)
    cy.contains('Courses', { matchCase: false }, { timeout: 15000 })
      .should('be.visible')
      .click();
    cy.wait(2000);

    // Click Completed tab (selector: button or [role="tab"] with "Completed", or use cy.clickCompletedTab() in commands.js to override)
    cy.clickCompletedTab();
    cy.wait(2000);

    // Open View Syllabus on the completed course (first course card in Completed list)
    cy.get('div[id^="course-item-"]', { timeout: 15000 })
      .first()
      .contains('button', 'View Syllabus')
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });
    cy.url({ timeout: 15000 }).should('include', '/class/');
    cy.wait(3000);

    // Start course again (Continue or Module → Topic → Subtopic)
    cy.get('body').then(($body) => {
      const hasContinueBtn = $body.find('button').filter((i, el) => {
        const text = Cypress.$(el).text().trim();
        return text === 'Continue' || text === 'Start Course';
      }).length > 0;

      if (hasContinueBtn) {
        cy.contains('button', /Continue|Start Course/i, { timeout: 10000 }).should('be.visible').click({ force: true });
        cy.wait(3000);
      } else {
        cy.get('button[id^="module-toggle-"]', { timeout: 10000 }).first().scrollIntoView().click({ force: true });
        cy.wait(1000);
        cy.get('body').then(($b2) => {
          if ($b2.find('button[id^="topic-toggle-"]').length > 0) {
            cy.get('button[id^="topic-toggle-"]').first().scrollIntoView().click({ force: true });
            cy.wait(1000);
          }
          cy.get('button[id^="subtopic-button-"]', { timeout: 10000 }).first().scrollIntoView().click({ force: true });
          cy.wait(3000);
        });
      }
    });

    // Wait for Next button and run full navigation loop again (regression)
    cy.get('#next-button', { timeout: 15000 }).should('be.visible');

    let regressionProgrammingCount = 0;
    for (let r = 0; r < 100; r++) {
      cy.log(`Regression navigation iteration ${r + 1}`);

      cy.get('body').then(($body) => {
        const hasMonacoEditor = $body.find('.view-lines.monaco-mouse-cursor-text').length > 0;
        const hasRunButton = $body.find('#run-code-btn').length > 0;
        const hasSubmitCodeButton = $body.find('#submit-code-btn').length > 0;

        const hasOptionById = $body.find('#option-0').length > 0;
        const hasSubmitById = $body.find('#submit-button').length > 0;
        const win = $body[0]?.ownerDocument?.defaultView;
        const currentUrl = (win && win.location && win.location.href) ? win.location.href : '';
        const isOnClassPage = currentUrl.includes('/my-learning/class/');
        const hasPracticeLabel = $body.text().includes('Practice');
        const submitBtnByText = $body.find('button').filter((i, el) => {
          const t = Cypress.$(el).text().trim().toLowerCase();
          return t === 'submit' && !Cypress.$(el).closest('[id*="code"]').length;
        });
        const hasMCQSubmitButton = hasSubmitById || (submitBtnByText.length > 0);
        const hasMCQOptions = hasOptionById || (isOnClassPage && !hasMonacoEditor && hasMCQSubmitButton && (hasPracticeLabel || $body.find('[id^="option-"]').length > 0 || $body.find('[data-option]').length > 0));

        const finishButton = $body.find('button').filter((i, el) => {
          const text = Cypress.$(el).text().trim().toLowerCase();
          return text === 'finish' || text === 'complete course' || text === 'finish course';
        });

        if (hasMonacoEditor && hasRunButton && hasSubmitCodeButton) {
          regressionProgrammingCount++;
          cy.get('#submit-code-btn', { timeout: 10000 }).then(($btn) => {
            if ($btn.is(':disabled')) {
              cy.log('Regression: Submit code disabled – already submitted. Next.');
            } else {
              let solutionToUse = solutionCode.javaSolution;
              if (regressionProgrammingCount === 2) solutionToUse = solutionCode.javaSolution2;
              else if (regressionProgrammingCount === 3) solutionToUse = solutionCode.javaSolution3;
              cy.submitCodeSolution(solutionToUse);
              cy.wait(3000);
              cy.get('#submit-code-btn', { timeout: 10000 }).should('be.disabled');
            }
            cy.clickNextButton();
          });
          cy.wait(2000);
        } else if (hasMCQOptions && hasMCQSubmitButton) {
          cy.log('Regression: MCQ subtopic – handling options and toast...');
          cy.get('body').then(($b) => {
            if ($b.find('#submit-button').length) cy.get('#submit-button', { timeout: 8000 }).should('be.visible');
            else cy.contains('button', 'Submit', { timeout: 8000 }).should('be.visible');
          });
          cy.handleMCQQuestion();
          cy.wait(2000);
          cy.clickNextButton();
          cy.wait(2000);
        } else if (finishButton.length > 0 && finishButton.is(':visible')) {
          cy.log('Regression: Finish/Complete – course completed again.');
          cy.wrap(finishButton).click({ force: true });
          cy.wait(3000);
          return false;
        } else {
          const nextButton = $body.find('#next-button');
          if (nextButton.length > 0 && nextButton.is(':visible')) {
            cy.clickNextButton();
            cy.wait(2000);
          } else {
            cy.log('Regression: No Next button – navigation complete.');
            return false;
          }
        }
      });
    }

    cy.log('Regression run complete.');
  });
});
