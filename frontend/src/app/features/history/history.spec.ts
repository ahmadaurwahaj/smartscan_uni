import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistoryComponent } from './history';
import { ApiService } from '../../core/api.service';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

const HISTORY = [
  { task_id: 'task-1', filename: 'alpha.pdf', status: 'completed', progress: 100, started_at: '2025-06-01T10:00:00Z' },
  { task_id: 'task-2', filename: 'beta.pdf',  status: 'failed',    progress: 0,   started_at: '2025-06-15T10:00:00Z' },
  { task_id: 'task-3', filename: 'gamma.pdf', status: 'cancelled', progress: 0,   started_at: '2025-07-01T10:00:00Z' },
];

describe('HistoryComponent', () => {
  let component: HistoryComponent;
  let fixture: ComponentFixture<HistoryComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ApiService', ['getAnalysisHistory', 'retryAnalysis']);
    apiSpy.getAnalysisHistory.and.returnValue(of(HISTORY));

    await TestBed.configureTestingModule({
      imports: [HistoryComponent, CommonModule, FormsModule, RouterTestingModule],
      providers: [{ provide: ApiService, useValue: apiSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(HistoryComponent);
    component = fixture.componentInstance;
    apiSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    fixture.detectChanges();
  });

  it('should create and load history on init', () => {
    expect(component).toBeTruthy();
    expect(component.history.length).toBe(3);
    expect(component.loading).toBeFalse();
  });

  it('should handle history load error', () => {
    apiSpy.getAnalysisHistory.and.returnValue(throwError(() => ({ error: { detail: 'Load error' } })));
    component.loadHistory();
    expect(component.error).toBe('Load error');
    expect(component.loading).toBeFalse();
  });

  it('should handle history load error without detail', () => {
    apiSpy.getAnalysisHistory.and.returnValue(throwError(() => ({})));
    component.loadHistory();
    expect(component.error).toBe('Failed to load history.');
  });

  // filteredHistory — branch: filterFrom excludes early items
  it('should filter history by filterFrom date', () => {
    component.filterFrom = '2025-06-10';
    const filtered = component.filteredHistory;
    // Only items on or after June 10
    expect(filtered.length).toBe(2);
    expect(filtered[0].task_id).toBe('task-2');
    expect(filtered[1].task_id).toBe('task-3');
  });

  // filteredHistory — branch: filterTo excludes late items
  it('should filter history by filterTo date', () => {
    component.filterTo = '2025-06-20';
    const filtered = component.filteredHistory;
    // Only items before June 20
    expect(filtered.length).toBe(2);
    expect(filtered[0].task_id).toBe('task-1');
    expect(filtered[1].task_id).toBe('task-2');
  });

  // filteredHistory — both from and to applied
  it('should filter history by both filterFrom and filterTo', () => {
    component.filterFrom = '2025-06-10';
    component.filterTo = '2025-06-20';
    const filtered = component.filteredHistory;
    expect(filtered.length).toBe(1);
    expect(filtered[0].task_id).toBe('task-2');
  });

  // filteredHistory — no filters returns all
  it('should return all items when no filters set', () => {
    expect(component.filteredHistory.length).toBe(3);
  });

  it('should clear filters', () => {
    component.filterFrom = '2025-01-01';
    component.filterTo = '2025-12-31';
    component.clearFilter();
    expect(component.filterFrom).toBe('');
    expect(component.filterTo).toBe('');
  });

  it('should retry a failed task and update its status', () => {
    apiSpy.retryAnalysis.and.returnValue(of({}));
    const item = { task_id: 'task-2', filename: 'beta.pdf', status: 'failed', progress: 0 };
    component.retryTask(item);
    expect(apiSpy.retryAnalysis).toHaveBeenCalledWith('task-2');
    expect(item.status).toBe('running');
    expect(item.progress).toBe(0);
    expect(component.retryingId).toBeNull();
    expect(component.successMessage).toContain('"beta.pdf"');
  });

  it('should handle retry error with detail', () => {
    apiSpy.retryAnalysis.and.returnValue(throwError(() => ({ error: { detail: 'Cannot retry' } })));
    const item = { task_id: 'task-2', filename: 'beta.pdf', status: 'failed', progress: 0 };
    component.retryTask(item);
    expect(component.error).toBe('Cannot retry');
    expect(component.retryingId).toBeNull();
  });

  it('should handle retry error without detail', () => {
    apiSpy.retryAnalysis.and.returnValue(throwError(() => ({})));
    const item = { task_id: 'task-2', filename: 'beta.pdf', status: 'failed', progress: 0 };
    component.retryTask(item);
    expect(component.error).toBe('Retry failed.');
  });
});
