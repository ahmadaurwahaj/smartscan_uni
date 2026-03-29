import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DocumentsComponent } from './documents';
import { ApiService } from '../../core/api.service';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

const DOCS = [
  { id: 1, filename: 'alpha.pdf', status: 'completed', created_at: '2025-01-01T10:00:00Z' },
  { id: 2, filename: 'beta.pdf',  status: 'uploaded',   created_at: '2025-01-02T10:00:00Z' }
];

describe('DocumentsComponent', () => {
  let component: DocumentsComponent;
  let fixture: ComponentFixture<DocumentsComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ApiService', [
      'getDocuments', 'startAnalysis', 'downloadDocument', 'getDocumentText', 'deleteDocument'
    ]);
    apiSpy.getDocuments.and.returnValue(of(DOCS));

    await TestBed.configureTestingModule({
      imports: [DocumentsComponent, CommonModule, FormsModule, RouterTestingModule],
      providers: [{ provide: ApiService, useValue: apiSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentsComponent);
    component = fixture.componentInstance;
    apiSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create and load documents on init', () => {
    expect(component).toBeTruthy();
    expect(component.documents.length).toBe(2);
    expect(component.loading).toBeFalse();
  });

  it('should filter documents by search query', () => {
    component.searchQuery = 'alpha';
    expect(component.filteredDocuments.length).toBe(1);
    expect(component.filteredDocuments[0].id).toBe(1);
  });

  it('should sort ascending/descending on toggleSort()', () => {
    component.sortAsc = false; // default descending
    expect(component.filteredDocuments[0].id).toBe(2); // newest first
    component.toggleSort();
    expect(component.filteredDocuments[0].id).toBe(1); // oldest first
  });

  it('should start analysis and navigate', () => {
    apiSpy.startAnalysis.and.returnValue(of({ task_id: 'task-1' }));
    component.startAnalysis(1);
    expect(apiSpy.startAnalysis).toHaveBeenCalledWith(1);
    expect(router.navigate).toHaveBeenCalledWith(['/analysis', 'task-1']);
  });

  it('should handle startAnalysis error', () => {
    apiSpy.startAnalysis.and.returnValue(throwError(() => ({ error: { detail: 'Failed' } })));
    component.startAnalysis(1);
    expect(component.error).toBe('Failed');
    expect(component.analyzingDocId).toBeNull();
  });

  it('should open and cancel delete dialog', () => {
    component.confirmDelete(DOCS[0]);
    expect(component.showDeleteDialog).toBeTrue();
    expect(component.docToDelete.id).toBe(1);

    component.cancelDelete();
    expect(component.showDeleteDialog).toBeFalse();
    expect(component.docToDelete).toBeNull();
  });

  it('should execute delete and remove document from list', () => {
    apiSpy.deleteDocument.and.returnValue(of({}));
    component.confirmDelete(DOCS[0]);
    component.executeDelete();
    expect(component.documents.find(d => d.id === 1)).toBeUndefined();
    expect(component.showDeleteDialog).toBeFalse();
    expect(component.successMessage).toContain('"alpha.pdf"');
  });

  it('should handle delete error', () => {
    apiSpy.deleteDocument.and.returnValue(throwError(() => ({ error: { detail: 'Delete failed' } })));
    component.confirmDelete(DOCS[0]);
    component.executeDelete();
    expect(component.error).toBe('Delete failed');
    expect(component.showDeleteDialog).toBeFalse();
  });

  it('should toggle text preview on and off', () => {
    apiSpy.getDocumentText.and.returnValue(of({ text: 'Hello world preview text here' }));
    component.togglePreview(1);
    expect(component.previewDocId).toBe(1);
    expect(component.previewText).toBe('Hello world preview text here');

    // Calling again closes the preview
    component.togglePreview(1);
    expect(component.previewDocId).toBeNull();
    expect(component.previewText).toBeNull();
  });

  it('should handle preview error gracefully', () => {
    apiSpy.getDocumentText.and.returnValue(throwError(() => new Error('error')));
    component.togglePreview(2);
    expect(component.previewText).toBe('Could not load text preview.');
  });

  it('should handle getDocuments error on init', async () => {
    apiSpy.getDocuments.and.returnValue(throwError(() => ({ error: { detail: 'Load failed' } })));
    component.loadDocuments();
    expect(component.error).toBe('Load failed');
    expect(component.loading).toBeFalse();
  });

  it('should not call delete API if docToDelete is null', () => {
    component.docToDelete = null;
    component.executeDelete();
    expect(apiSpy.deleteDocument).not.toHaveBeenCalled();
  });

  it('should download document successfully', () => {
    const blob = new Blob(['file']);
    apiSpy.downloadDocument.and.returnValue(of(blob));
    spyOn(window.URL, 'createObjectURL').and.returnValue('blob:fake');
    spyOn(window.URL, 'revokeObjectURL').and.stub();
    component.downloadDocument(DOCS[0]);
    expect(apiSpy.downloadDocument).toHaveBeenCalledWith(1);
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(component.downloadingDocId).toBeNull();
  });

  it('should handle download error', () => {
    apiSpy.downloadDocument.and.returnValue(throwError(() => new Error('Download failed')));
    component.downloadDocument(DOCS[0]);
    expect(component.error).toBe('Download failed.');
    expect(component.downloadingDocId).toBeNull();
  });

  it('should handle startAnalysis with no task_id in response', () => {
    apiSpy.startAnalysis.and.returnValue(of({}));
    component.startAnalysis(1);
    // No navigation expected when task_id is missing
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.analyzingDocId).toBeNull();
  });
});
