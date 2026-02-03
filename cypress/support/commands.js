/// <reference types="cypress" />
/// <reference types="cypress-xpath" />

// Login Command
Cypress.Commands.add('login', (email, password) => {
  cy.visit('https://app.kodnest.in/login', { timeout: 40000 });
  cy.get('body', { timeout: 10000 }).should('be.visible');
  cy.get('#login-submit-button', { timeout: 10000 }).should('be.visible').should('not.be.disabled');
  cy.get('.loader', { timeout: 10000 }).should('not.exist');
  cy.get('#email-input', { timeout: 10000 }).should('be.visible').click().type(email, { timeout: 10000 });
  cy.get('#password-input', { timeout: 10000 }).should('be.visible').should('not.be.disabled').click().type(password, { timeout: 10000 });
  cy.get('#login-submit-button', { timeout: 10000 }).click();
});

// File Upload 10th and 12th

Cypress.Commands.add('uploadFile', (inputSelector, fileName) => {
  cy.get(inputSelector, { timeout: 10000 })
    .should('exist')
    .selectFile(`cypress/fixtures/${fileName}`, { force: true });
});


//UG detail update command

Cypress.Commands.add('selectRadixDropdown', (index, optionText) => {
  cy.get("button[role='combobox']")
    .eq(index)
    .should('be.visible')
    .click();

  cy.get('[role="option"]')
    .contains(optionText)
    .should('be.visible')
    .click();
});

// Reusable: click Next button in course flow (handles disabled state)
Cypress.Commands.add('clickNextButton', () => {
  cy.get('#next-button', { timeout: 20000 })
    .should('be.visible')
    .then(($btn) => {
      if ($btn.is(':disabled')) {
        cy.wait(2000);
        cy.get('#next-button').click({ force: true });
      } else {
        cy.wrap($btn).click();
      }
    });
});

// Reusable: click Completed tab (Courses page) for regression. Matches "Completed" or "Completed 1" (with count). Override in this command if your app uses a different selector.
Cypress.Commands.add('clickCompletedTab', () => {
  cy.get('body').then(($body) => {
    const $btn = $body.find('button').filter((i, el) => Cypress.$(el).text().trim().toLowerCase().includes('completed')).first();
    if ($btn.length) {
      cy.wrap($btn).scrollIntoView().click({ force: true });
      return;
    }
    const $tab = $body.find('[role="tab"]').filter((i, el) => Cypress.$(el).text().trim().toLowerCase().includes('completed')).first();
    if ($tab.length) {
      cy.wrap($tab).scrollIntoView().click({ force: true });
      return;
    }
    cy.contains(/Completed/i, { timeout: 10000 }).scrollIntoView().click({ force: true });
  });
});

// Custom command to handle programming challenge submission in Monaco editor
// This command: clicks editor, clears boilerplate, types solution, runs, and submits
// Parameters:
//   - solutionCode: The complete solution code as a string
// Usage: cy.submitCodeSolution(solutionCode)
Cypress.Commands.add('submitCodeSolution', (solutionCode) => {
  cy.log('Starting code solution submission...');


  // Click on Monaco editor multiple times to ensure it gets focus
  // This is critical - without proper focus, keyboard inputs won't work
  cy.log('Waiting for Monaco editor to be ready...');

  // Wait for Monaco editor to be fully loaded
  cy.get('.monaco-editor', { timeout: 15000 })
    .should('exist');

  cy.wait(1000);

  cy.log('Clicking on Monaco editor to focus it...');

  // First, scroll the Monaco editor into view to ensure it's visible
  cy.get('.monaco-editor', { timeout: 10000 })
    .first()
    .scrollIntoView()
    .should('be.visible');

  cy.wait(1000);

  // First click - click on the editor container
  cy.get('.monaco-editor', { timeout: 10000 })
    .first()
    .click({ force: true });

  cy.wait(1000);

  // Second click - click on the view lines area (the actual code area)
  cy.get('.view-lines.monaco-mouse-cursor-text', { timeout: 10000 })
    .first()
    .scrollIntoView()
    .should('exist')
    .click({ force: true });

  cy.wait(1000);

  // Third click - click again to ensure focus
  cy.get('.view-lines.monaco-mouse-cursor-text')
    .first()
    .click({ force: true });

  cy.wait(1000);


  // Clear all pre-existing code using multiple methods to ensure it's gone
  cy.log('Clearing all existing boilerplate code...');

  // Method 1: Try to access Monaco editor API directly via window
  cy.window().then((win) => {
    // Check if Monaco editor instance is available
    const monaco = win.monaco;
    const editors = win.monaco?.editor?.getEditors?.() || [];

    if (editors.length > 0) {
      cy.log('Found Monaco editor instance, clearing via API...');
      const editor = editors[0];
      if (editor && typeof editor.setValue === 'function') {
        editor.setValue('');
        editor.setPosition({ lineNumber: 1, column: 1 });
        cy.wait(500);
      }
    }
  });

  // Method 2: Find and clear Monaco's textarea directly
  cy.get('body').then(($body) => {
    const textarea = $body.find('textarea.monaco-mouse-cursor-text, textarea.inputarea, textarea[class*="monaco"], textarea[class*="input"]');

    if (textarea.length > 0) {
      cy.log('Found textarea, clearing all content...');
      // Clear multiple times to ensure it's empty
      cy.wrap(textarea.first())
        .clear({ force: true })
        .invoke('val', '')
        .clear({ force: true })
        .invoke('val', '')
        .trigger('input', { force: true })
        .trigger('change', { force: true })
        .trigger('keyup', { force: true });
      cy.wait(500);
    }
  });

  // Method 3: Use keyboard shortcuts to select all and delete (MOST RELIABLE)
  cy.log('Using keyboard shortcuts to clear all code...');

  // Click on editor again to ensure focus before keyboard input
  cy.get('.view-lines.monaco-mouse-cursor-text')
    .first()
    .scrollIntoView()
    .click({ force: true });

  cy.wait(500);

  // Select all existing code (Ctrl+A or Cmd+A)
  cy.get('body').type('{selectall}', { force: true });
  cy.wait(300);

  // Delete using backspace
  cy.get('body').type('{backspace}', { force: true });
  cy.wait(300);

  // Delete using delete key
  cy.get('body').type('{del}', { force: true });
  cy.wait(300);

  // Try select all and delete again to catch any remaining content
  cy.get('.view-lines.monaco-mouse-cursor-text')
    .first()
    .scrollIntoView()
    .click({ force: true });
  cy.wait(300);

  cy.get('body').type('{selectall}', { force: true });
  cy.wait(200);
  cy.get('body').type('{backspace}', { force: true });
  cy.wait(500);

  cy.log('All boilerplate code cleared. Typing solution...');


  // Now that the editor is cleared, type our solution code
  cy.log('Typing solution code...');

  // Method 1: Try to use Monaco Editor API directly (MOST RELIABLE)
  cy.window().then((win) => {
    // Try to find Monaco editor instance
    const monaco = win.monaco;
    let editorInstance = null;

    // Try multiple ways to get the editor instance
    if (win.monaco?.editor?.getEditors) {
      const editors = win.monaco.editor.getEditors();
      if (editors.length > 0) {
        editorInstance = editors[0];
      }
    }

    // Also try to find editor via DOM
    if (!editorInstance) {
      const editorElements = win.document.querySelectorAll('.monaco-editor');
      if (editorElements.length > 0) {
        // Try to access the editor model
        const editorElement = editorElements[0];
        const editorId = editorElement.getAttribute('data-editor-id');
        if (editorId && win.monaco?.editor?.getEditor) {
          editorInstance = win.monaco.editor.getEditor(editorId);
        }
      }
    }

    if (editorInstance && typeof editorInstance.setValue === 'function') {
      cy.log('Using Monaco API to set code directly...');
      try {
        editorInstance.setValue(solutionCode);
        editorInstance.setPosition({ lineNumber: 1, column: 1 });
        // Force a model update
        const model = editorInstance.getModel();
        if (model) {
          model.setValue(solutionCode);
        }
        cy.wait(2000);
      } catch (e) {
        cy.log('Monaco API setValue failed, trying alternative method...');
      }
    }

    // Method 2: Use textarea directly (always try this as backup/primary method)
    cy.log('Setting code via textarea method...');
    cy.get('body').then(($body) => {
      // Find all possible textarea selectors Monaco might use
      const textarea = $body.find('textarea.monaco-mouse-cursor-text, textarea.inputarea, textarea[class*="monaco"], textarea[class*="input"], textarea');

      if (textarea.length > 0) {
        cy.log(`Found ${textarea.length} textarea(s), setting code...`);
        // Focus, clear, and set value
        cy.wrap(textarea.first())
          .focus({ force: true })
          .clear({ force: true })
          .invoke('val', solutionCode)
          .trigger('input', { force: true, bubbles: true })
          .trigger('change', { force: true, bubbles: true })
          .trigger('keyup', { force: true, bubbles: true })
          .trigger('keydown', { force: true, bubbles: true })
          .trigger('compositionend', { force: true, bubbles: true })
          .trigger('paste', { force: true, bubbles: true });
        cy.wait(2000);
      } else {
        // Method 3: Click editor and type via keyboard (last resort)
        cy.log('No textarea found, typing via keyboard...');
        cy.get('.view-lines.monaco-mouse-cursor-text, .monaco-editor')
          .first()
          .scrollIntoView()
          .click({ force: true });

        cy.wait(1000);

        // Type the solution code
        cy.get('body').type(solutionCode, {
          force: true,
          parseSpecialCharSequences: false,
          delay: 10 // Small delay to ensure each character is captured
        });
        cy.wait(2000);
      }
    });
  });

  // Wait for code to be fully typed and editor to update
  cy.wait(2000);

  // Wait for code to be fully processed by Monaco editor
  cy.log('Waiting for Monaco editor to process the code...');
  cy.wait(3000);

  // Verify code was typed by checking if editor has content
  cy.log('Verifying code was typed into Monaco editor...');

  // Check if code exists in the editor by looking for common keywords
  cy.get('body').then(($body) => {
    // Check for common Java keywords that should be in any solution
    const hasMain = $body.text().includes('public class Main') || $body.text().includes('class Main');
    const hasCode = $body.text().includes('System.out') || $body.text().includes('Scanner') || $body.text().includes('println');

    if (!hasMain || !hasCode) {
      cy.log('WARNING: Code might not be typed correctly. Retrying...');

      // Retry typing the code
      cy.get('.view-lines.monaco-mouse-cursor-text')
        .first()
        .scrollIntoView()
        .click({ force: true });
      cy.wait(500);

      // Try typing again via textarea
      const textarea = $body.find('textarea');
      if (textarea.length > 0) {
        cy.wrap(textarea.first())
          .focus({ force: true })
          .invoke('val', solutionCode)
          .trigger('input', { force: true, bubbles: true })
          .trigger('change', { force: true, bubbles: true });
        cy.wait(2000);
      }
    } else {
      cy.log('Code verification passed - solution code is present in editor');
    }
  });

  // Wait a bit more for Monaco to fully process the code
  cy.wait(2000);

  // Execute the code to verify it works before submitting
  cy.log('Waiting for Run Code button to become enabled...');

  // Wait for Run Code button to become enabled (it might be disabled until code is properly entered)
  cy.get('#run-code-btn', { timeout: 20000 })
    .should('be.visible')
    .then(($btn) => {
      const isDisabled = $btn.attr('disabled') !== undefined;

      if (isDisabled) {
        cy.log('Run Code button is disabled, waiting for it to become enabled...');
        // Wait and retry - the button should become enabled after Monaco processes the code
        cy.wait(5000);

        // Check again if button is enabled
        cy.get('#run-code-btn', { timeout: 15000 })
          .then(($btn2) => {
            const stillDisabled = $btn2.attr('disabled') !== undefined;

            if (stillDisabled) {
              cy.log('Run Code button still disabled - code may not be entered correctly. Trying force click...');
              // Last resort: try clicking with force (sometimes the button works even if it appears disabled)
              cy.get('#run-code-btn').click({ force: true });
            } else {
              cy.get('#run-code-btn').click();
            }
          });
      } else {
        // Button is already enabled, click it
        cy.wrap($btn).click();
      }
    });

  // Wait for code execution to complete
  // This gives time for the code to run and show results
  cy.log('Waiting for code execution...');
  cy.wait(5000);


  // Submit the code solution to complete the challenge
  cy.log('Waiting for Submit Code button to become enabled...');
  cy.get('#submit-code-btn', { timeout: 20000 })
    .should('be.visible')
    .then(($btn) => {
      const isDisabled = $btn.attr('disabled') !== undefined;

      if (isDisabled) {
        cy.log('Submit Code button is disabled, waiting for it to become enabled...');
        // Wait for button to become enabled after code execution
        cy.wait(5000);

        // Check again if button is enabled
        cy.get('#submit-code-btn', { timeout: 15000 })
          .then(($btn2) => {
            const stillDisabled = $btn2.attr('disabled') !== undefined;

            if (stillDisabled) {
              cy.log('Submit Code button still disabled - trying force click...');
              // Last resort: try clicking with force
              cy.get('#submit-code-btn').click({ force: true });
            } else {
              cy.get('#submit-code-btn').click();
            }
          });
      } else {
        // Button is already enabled, click it
        cy.wrap($btn).click();
      }
    });

  // Wait for submission to complete
  // After submission, the Next button should become enabled
  cy.log('Waiting for submission to complete...');
  cy.wait(5000);
});

// ============================================================================
// MCQ QUESTION HANDLING COMMAND
// ============================================================================
// Flow: Select option -> Submit -> Check toast message (passed or not).
// If not passed, click Retake and try next option until correct.
// ============================================================================
Cypress.Commands.add('handleMCQQuestion', () => {
  cy.log('Handling MCQ subtopic: select option -> submit -> check toast (passed/not) -> retake and try next until correct. (Only some subtopics are MCQ; next subtopic if MCQ type uses same flow.)');

  // Helper: get Submit button (by ID or by text "Submit", excluding "Submit Code")
  const getSubmitButton = ($body) => {
    const byId = $body.find('#submit-button');
    if (byId.length) return byId.first();
    const byText = $body.find('button').filter((i, el) => {
      const t = Cypress.$(el).text().trim().toLowerCase();
      return t === 'submit' && !Cypress.$(el).closest('[id*="code"]').length;
    });
    return byText.first();
  };

  // Helper: get Retake button (same element as submit, but text is Retake)
  const getRetakeButton = ($body) => {
    const byId = $body.find('#submit-button').filter((i, el) => Cypress.$(el).text().trim().toLowerCase().includes('retake'));
    if (byId.length) return byId.first();
    return $body.find('button').filter((i, el) => Cypress.$(el).text().trim().toLowerCase().includes('retake')).first();
  };

  // Helper: check if toast/snackbar says PASSED (correct, success, etc.)
  const toastSaysPassed = ($body) => {
    const text = $body.text();
    const lower = text.toLowerCase();
    const passedWords = ['correct', 'passed', 'success', 'right answer', 'well done', 'congratulations'];
    return passedWords.some((word) => lower.includes(word));
  };

  // Helper: check if toast/snackbar says NOT PASSED (incorrect, wrong, etc.)
  const toastSaysNotPassed = ($body) => {
    const lower = $body.text().toLowerCase();
    const notPassedWords = ['incorrect', 'wrong', 'try again', 'retake', 'not correct', 'failed'];
    return notPassedWords.some((word) => lower.includes(word));
  };

  // Helper: find option elements - by ID, data-option, buttons, or clickable option-like elements (e.g. "on", "in", "under", "over")
  const getOptionElements = ($body) => {
    if ($body.find('#option-0').length > 0) {
      const list = [];
      for (let i = 0; i < 10; i++) {
        const $el = $body.find(`#option-${i}`);
        if ($el.length) list.push($el.get(0)); else break;
      }
      return Cypress.$(list);
    }
    const $submit = getSubmitButton($body);
    if ($submit.length) {
      const $container = $submit.closest('div[class*="content"], div[class*="practice"], main, [role="main"], form').length
        ? $submit.closest('div[class*="content"], div[class*="practice"], main, [role="main"], form')
        : $submit.parent();
      const exclude = ['submit', 'back', 'next'];
      const $btns = $container.find('button').filter((i, el) => {
        const t = Cypress.$(el).text().trim().toLowerCase();
        return !exclude.includes(t) && Cypress.$(el).is(':visible');
      });
      if ($btns.length >= 2) return $btns;
      // Fallback: clickable option-like elements (div/span with short text, e.g. "on", "in", "under", "over")
      const $clickables = $container.find('[role="button"], [role="radio"], [role="option"], div[class*="option"], button, [data-option]').filter((i, el) => {
        const $el = Cypress.$(el);
        const t = $el.text().trim().toLowerCase();
        const isExcluded = exclude.includes(t) || t.length > 80;
        return $el.is(':visible') && !isExcluded && t.length >= 1;
      });
      if ($clickables.length >= 2) return $clickables;
    }
    if ($body.find('[data-option]').length > 0) {
      return $body.find('[data-option]');
    }
    return Cypress.$();
  };

  cy.get('body').then(($body) => {
    const $opts = getOptionElements($body);
    const optionCount = $opts.length;
    const $submitBtn = getSubmitButton($body);

    cy.log(`MCQ options found: ${optionCount}. Submit button: ${$submitBtn.length ? 'yes' : 'no'}`);

    if (optionCount === 0 || !$submitBtn.length) {
      cy.log('⚠️ No MCQ options or Submit button found. Skipping MCQ logic.');
      return;
    }

    const tryOption = (index) => {
      if (index >= optionCount) {
        cy.log('⚠️ Tried all options. Stopping.');
        return;
      }

      cy.log(`Attempting Option ${index + 1} of ${optionCount}...`);

      cy.get('body').then(($b) => {
        const $options = getOptionElements($b);
        const $opt = $options.eq(index);
        if ($opt.length) {
          cy.wrap($opt).scrollIntoView().should('be.visible').click({ force: true });
        } else {
          cy.get(`#option-${index}`, { timeout: 5000 }).scrollIntoView().click({ force: true });
        }
      });

      // Wait for selection to register (Submit may be disabled until option is selected)
      cy.wait(1500);

      cy.get('body').then(($b) => {
        const $sub = getSubmitButton($b);
        if ($sub.length) {
          cy.wrap($sub).scrollIntoView().should('be.visible').click({ force: true });
        } else {
          cy.get('#submit-button', { timeout: 5000 }).click({ force: true });
        }
      });

      // Wait for toast message to appear after submit
      cy.wait(2500);

      // Check toast message: passed or not (then Retake and try next if not passed)
      cy.get('body').then(($b) => {
        const passedByToast = toastSaysPassed($b);
        const notPassedByToast = toastSaysNotPassed($b);
        const $retake = getRetakeButton($b);

        if (passedByToast) {
          cy.log(`✅ Option ${index + 1} PASSED (toast: passed).`);
          return;
        }
        if (notPassedByToast || $retake.length) {
          cy.log(`❌ Option ${index + 1} NOT passed (toast or Retake). Clicking Retake...`);
          if ($retake.length) {
            cy.wrap($retake).scrollIntoView().click({ force: true });
          }
          cy.wait(2000);
          tryOption(index + 1);
        } else {
          cy.log(`✅ Option ${index + 1} assumed PASSED (no fail toast, no Retake).`);
        }
      });
    };

    tryOption(0);
  });
});