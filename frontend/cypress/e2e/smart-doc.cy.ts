/// <reference types="cypress" />
describe('Smart Document Analysis E2E Flow', () => {
  beforeEach(() => {
    // Intercept backend login to fake authenticated session
    cy.intercept('POST', '**/auth/login', {
      statusCode: 200,
      body: { 
        token: { access_token: 'fake-jwt' },
        user: { username: 'tester' }
      }
    }).as('loginReq');

    // Intercept documents fetch
    cy.intercept('GET', '**/documents/', {
      statusCode: 200,
      body: []
    }).as('getDocs');

    cy.visit('http://localhost:4200/login');
  });

  it('should complete full lifecycle from login to analysis', () => {
    // 1. Login
    cy.get('input[name="email"]').type('testing@example.com');
    cy.get('input[type="password"]').type('fdskfj2p34_21##');
    cy.get('button').contains('Sign In').click();

    cy.wait('@loginReq');
    cy.wait('@getDocs');
    cy.contains('Welcome, tester').should('be.visible');

    // 2. Navigate to upload
    cy.get('a').contains('Upload').click();
    cy.url().should('include', '/upload');

    // MOCK Upload API
    cy.intercept('POST', '**/documents/upload', {
      statusCode: 200,
      body: [
        { id: 1, filename: 'sample.pdf', status: 'pending', created_at: new Date().toISOString() }
      ]
    }).as('uploadDoc');

    // Fake file upload input
    cy.get('input[type="file"]').selectFile({
      contents: Cypress.Buffer.from('dummy file content'),
      fileName: 'sample.pdf',
      mimeType: 'application/pdf',
      lastModified: Date.now(),
    }, { force: true });
    
    // Upload button
    cy.get('button').contains('Upload').click();
    cy.wait('@uploadDoc');

    cy.contains('document(s) uploaded successfully').should('be.visible');

    // 3. Move to analysis view
    cy.intercept('GET', '**/analysis/result/1*', {
      statusCode: 200,
      body: {
        task_id: '1',
        status: 'completed',
        progress: 100,
        keywords: [
          { keyword: 'smart', frequency: 10 },
          { keyword: 'doc', frequency: 5 }
        ]
      }
    }).as('getAnalysis');

    cy.visit('http://localhost:4200/analysis/1');
    cy.wait('@getAnalysis');

    // 4. Assert UI updates
    cy.contains('Total Keywords Found').should('be.visible');
    cy.contains('100%').should('be.visible');
    
    // 5. Test Filters
    cy.get('input[placeholder="Filter..."]').type('smart');
    cy.get('table').contains('smart').should('be.visible');
  });

  it('should navigate to history and verify items', () => {
    // 1. Mock Login since we start fresh or from previous session
    cy.get('input[name="email"]').type('testing@example.com');
    cy.get('input[type="password"]').type('fdskfj2p34_21##');
    cy.get('button').contains('Sign In').click();

    // 2. Mock History API
    cy.intercept('GET', '**/analysis/history', {
      statusCode: 200,
      body: [
        { task_id: 'task-1', filename: 'history-doc.pdf', status: 'completed', progress: 100, started_at: new Date().toISOString() }
      ]
    }).as('getHistory');

    // 2b. Mock Analysis Result for task-1 (History navigation)
    cy.intercept('GET', '**/analysis/result/task-1*', {
      statusCode: 200,
      body: {
        task_id: 'task-1',
        status: 'completed',
        progress: 100,
        keywords: [
          { keyword: 'history', frequency: 15 },
          { keyword: 'pdf', frequency: 7 }
        ]
      }
    }).as('getAnalysisHistoryDetail');

    // 3. Navigate to History
    cy.get('a').contains('Analysis History').click();
    cy.url().should('include', '/history');
    cy.wait('@getHistory');

    // 4. Assert items exist
    cy.contains('history-doc.pdf').should('be.visible');
    cy.contains('completed').should('be.visible');
    
    // 5. Test "View" click
    cy.get('a').contains('View').first().click();
    cy.url().should('include', '/analysis/task-1');
    cy.wait('@getAnalysisHistoryDetail');
    
    // Check UI
    cy.contains('history').should('be.visible');
    cy.contains('100%').should('be.visible');
  });
});
