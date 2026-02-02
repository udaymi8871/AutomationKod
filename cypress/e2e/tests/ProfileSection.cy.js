import user from "../../../cypress/fixtures/user.json";
import basicDetail from "../../../cypress/fixtures/basicdetail.json";
import ugDetail from "../../../cypress/fixtures/UGDetails.json";
import academicDetail from "../../../cypress/fixtures/academicdetail.json";
import "cypress-file-upload";

describe("Profile Personal Details Update", () => {
  beforeEach(() => {
    cy.viewport(1400, 877);
    cy.login(user.email, user.password);
  });

  it("updates personal profile details successfully", () => {
    cy.get("button[aria-haspopup='menu']", { timeout: 10000 })
      .should("be.visible")
      .click();

    cy.get("#profile-menu-item")
      .filter(":visible")
      .should("have.length", 1)
      .click();

    cy.get("#section-personaldetails", { timeout: 10000 })
      .should("be.visible")
      .find("button")
      .contains(/edit/i)
      .click();

    cy.get("form", { timeout: 10000 }).should("be.visible");

    // Basic details
    cy.get("input[name='primary_contact']")
      .clear()
      .type(basicDetail.contacts.primary);

    cy.get("input[name='whatsapp_contact']")
      .clear()
      .type(basicDetail.contacts.whatsapp);

    cy.get("div[role='dialog']")
      .find("button[type='submit']")
      .should("be.enabled")
      .click();

    cy.get("body").type("{esc}");

    // Academic details: 10th & 12th
    cy.uploadFile('#file-input-0', 'marksheet10.jpeg');
    cy.uploadFile('#file-input-1', 'marksheet12.jpeg');

    // UG details
    cy.get("input[placeholder='University Roll No.']")
      .clear()
      .type(ugDetail.academicDetails.universityRollNo);

    cy.get("input[placeholder='College Name']")
      .clear()
      .type(ugDetail.academicDetails.collegeName);

    // Course dropdown
    cy.selectRadixDropdown(0, "Bachelor of Engineering (B.E./B.Eng.)");

    // Branch dropdown (example)
    cy.selectRadixDropdown(1, "Computer Science");

    // Year of Passout dropdown (example)
    cy.selectRadixDropdown(2, "2023");

    // Percentage
    cy.get('input[name="graduation_percentage"]')
      .should("be.visible")
      .invoke("val", "")
      .type(String(academicDetail.graduation.percentage));

    cy.get('input[name="graduation_percentage"]')
      .invoke("val")
      .then((val) => {
        expect(parseInt(val)).to.eq(academicDetail.graduation.percentage);
      });

    // CGPA
    cy.get('input[name="graduation_cgpa"]')
      .should("be.visible")
      .invoke("val", "")
      .type(String(academicDetail.graduation.cgpa));

    cy.get('input[name="graduation_cgpa"]')
      .invoke("val")
      .then((val) => {
        expect(parseFloat(val)).to.eq(academicDetail.graduation.cgpa);
      });

    //save
    cy.get('input[name="graduation_cgpa"]').blur();

    // Scroll + click Save
    cy.contains("button", "Save")
      .scrollIntoView()
      .should("be.visible")
      .and("be.enabled")
      .click();

    //Final UG detail save toggle confirmation
    // cy.get('[role="dialog"]').within(() => {
    //   cy.get('button[role="switch"]').each(($toggle) => {
        
    //     cy.wrap($toggle)
    //       .should("have.attr", "aria-checked", "false")
    //       .click()
    //       .should("have.attr", "aria-checked", "true");
    //   });

      cy.contains("button", "Confirm & Save").should("be.enabled").click();
    });
  });

