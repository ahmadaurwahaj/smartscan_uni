import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnalysisResultComponent } from './analysis';
import { ApiService } from '../../core/api.service';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

const mockCompleted = {
  task_id: '123', status: 'completed', progress: 100,
  keywords: [{ keyword: 'test', frequency: 5 }, { keyword: 'doc', frequency: 3 }]
};

// ── Main suite (task_id = '123') ───────────────────────────────────────────
describe('AnalysisResultComponent', () => {
  let component: AnalysisResultComponent;
  let fixture: ComponentFixture<AnalysisResultComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ApiService', [
      'getAnalysisResult', 'cancelAnalysis', 'retryAnalysis', 'exportAnalysisResult'
    ]);
    // Set default response BEFORE detectChanges so ngOnInit gets data immediately
    apiSpy.getAnalysisResult.and.returnValue(of(mockCompleted));

    await TestBed.configureTestingModule({
      imports: [AnalysisResultComponent, CommonModule, FormsModule, RouterTestingModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ task_id: '123' })) }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisResultComponent);
    component = fixture.componentInstance;
    apiSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    // Prevent Chart.js canvas crash in headless environment
    spyOn(component, 'renderChart').and.callFake(() => {});

    // Run ngOnInit — component will be in 'completed' state by the time each test runs
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create component and load completed result', async () => {
    await fixture.whenStable();
    expect(component).toBeTruthy();
    expect(component.taskId).toBe('123');
    expect(component.result).toEqual(mockCompleted);
    expect(component.loading).toBeFalse();
    expect(component.isRunning).toBeFalse();
  });

  it('should show isRunning when status is running', () => {
    // Override and re-fetch directly
    apiSpy.getAnalysisResult.and.returnValue(of({ ...mockCompleted, status: 'running' }));
    component.fetchResult();
    expect(component.isRunning).toBeTrue();
    component.stopPolling();
  });

  it('should show isRunning when status is pending', () => {
    apiSpy.getAnalysisResult.and.returnValue(of({ ...mockCompleted, status: 'pending' }));
    component.fetchResult();
    expect(component.isRunning).toBeTrue();
    component.stopPolling();
  });

  it('should expose topKeywords sorted by frequency desc', () => {
    const top = component.topKeywords;
    expect(top[0].keyword).toBe('test');
    expect(top[1].keyword).toBe('doc');
  });

  it('should cancel analysis and set status to cancelled', () => {
    apiSpy.cancelAnalysis.and.returnValue(of({}));
    component.cancelAnalysis();
    expect(apiSpy.cancelAnalysis).toHaveBeenCalledWith('123');
    expect(component.result?.status).toBe('cancelled');
    expect(component.cancelling).toBeFalse();
  });

  it('should handle cancel error', () => {
    apiSpy.cancelAnalysis.and.returnValue(throwError(() => ({ error: { detail: 'Cancel failed' } })));
    component.cancelAnalysis();
    expect(component.error).toBe('Cancel failed');
    expect(component.cancelling).toBeFalse();
  });

  it('should retry analysis', () => {
    apiSpy.retryAnalysis.and.returnValue(of({}));
    component.retryAnalysis();
    expect(apiSpy.retryAnalysis).toHaveBeenCalledWith('123');
    expect(component.result?.status).toBe('running');
    component.stopPolling();
  });

  it('should handle retry error', () => {
    apiSpy.retryAnalysis.and.returnValue(throwError(() => ({ error: { detail: 'Retry failed' } })));
    component.retryAnalysis();
    expect(component.error).toBe('Retry failed');
    expect(component.loading).toBeFalse();
  });

  it('should export CSV by calling exportAnalysisResult', () => {
    const blob = new Blob(['csv']);
    apiSpy.exportAnalysisResult.and.returnValue(of(blob));
    spyOn(window.URL, 'createObjectURL').and.returnValue('blob:fake');
    spyOn(window.URL, 'revokeObjectURL').and.stub();

    component.exportCSV();

    expect(apiSpy.exportAnalysisResult).toHaveBeenCalledWith('123', 'csv');
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
  });

  it('should export PDF by calling exportAnalysisResult', () => {
    const blob = new Blob(['pdf']);
    apiSpy.exportAnalysisResult.and.returnValue(of(blob));
    spyOn(window.URL, 'createObjectURL').and.returnValue('blob:fake');
    spyOn(window.URL, 'revokeObjectURL').and.stub();

    component.exportPDF();

    expect(apiSpy.exportAnalysisResult).toHaveBeenCalledWith('123', 'pdf');
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);
  });

  it('should apply filters debounced', (done) => {
    const callsBefore = apiSpy.getAnalysisResult.calls.count();
    component.keywordFilter = 'test';
    component.applyFilters();
    setTimeout(() => {
      expect(apiSpy.getAnalysisResult.calls.count()).toBeGreaterThan(callsBefore);
      done();
    }, 500);
  });

  it('should switch tab to chart and back to keywords', () => {
    component.switchTab('chart');
    expect(component.activeTab).toBe('chart');
    component.switchTab('keywords');
    expect(component.activeTab).toBe('keywords');
  });

  it('should handle fetch error', () => {
    apiSpy.getAnalysisResult.and.returnValue(
      throwError(() => ({ error: { detail: 'Fetch error' } }))
    );
    component.fetchResult();
    expect(component.error).toBe('Fetch error');
    expect(component.loading).toBeFalse();
  });

  // Cover startPolling guard: calling startPolling when already polling should return early
  it('should not set a second interval if already polling', () => {
    apiSpy.getAnalysisResult.and.returnValue(of({ ...mockCompleted, status: 'running' }));
    component.fetchResult();         // starts polling → sets pollInterval
    const firstInterval = (component as any).pollInterval;
    component.startPolling();        // guard: pollInterval truthy → should return early
    expect((component as any).pollInterval).toBe(firstInterval); // same interval, not replaced
    component.stopPolling();
  });

  // Cover stopPolling both branches: truthy (interval cleared) and falsy (no-op)
  it('should stop polling gracefully when not currently polling', () => {
    expect((component as any).pollInterval).toBeNull();
    component.stopPolling(); // falsy branch — should not throw
    expect((component as any).pollInterval).toBeNull();
  });

  // Cover filterTimeout truthy branch: calling applyFilters twice clears the first timer
  it('should cancel previous filter timeout when applyFilters is called twice', (done) => {
    component.applyFilters(); // sets filterTimeout
    component.applyFilters(); // filterTimeout is truthy → clears previous, sets new
    const callsBefore = apiSpy.getAnalysisResult.calls.count();
    setTimeout(() => {
      // Only ONE extra call should have fired (the second applyFilters, not two)
      expect(apiSpy.getAnalysisResult.calls.count()).toBeLessThanOrEqual(callsBefore + 1);
      done();
    }, 500);
  });

  // Cover cancelAnalysis when result is null (if (this.result) false branch)
  it('should not throw when cancelling with null result', () => {
    apiSpy.cancelAnalysis.and.returnValue(of({}));
    component.result = null;
    expect(() => component.cancelAnalysis()).not.toThrow();
    expect(component.cancelling).toBeFalse();
  });

  // Cover retryAnalysis when result is null (if (this.result) false branch)
  it('should handle retry when result is null', () => {
    apiSpy.retryAnalysis.and.returnValue(of({}));
    component.result = null;
    component.retryAnalysis();
    // result stays null, no status set
    expect(component.result).toBeNull();
    component.stopPolling();
  });
});

// ── Separate suite for missing task_id (needs fresh TestBed) ────────────────
describe('AnalysisResultComponent (no task_id)', () => {
  let component: AnalysisResultComponent;
  let fixture: ComponentFixture<AnalysisResultComponent>;

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', [
      'getAnalysisResult', 'cancelAnalysis', 'retryAnalysis', 'exportAnalysisResult'
    ]);

    await TestBed.configureTestingModule({
      imports: [AnalysisResultComponent, CommonModule, FormsModule, RouterTestingModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({})) }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AnalysisResultComponent);
    component = fixture.componentInstance;
    spyOn(component, 'renderChart').and.callFake(() => {});
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should set error when task_id is missing from URL', () => {
    expect(component.error).toBe('Task ID missing in URL.');
    expect(component.loading).toBeFalse();
  });
});
