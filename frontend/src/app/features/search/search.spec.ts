import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchComponent } from './search';
import { ApiService } from '../../core/api.service';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ApiService', ['getDocuments', 'startAnalysis']);
    apiSpy.getDocuments.and.returnValue(of([
      { id: 1, filename: 'alpha.pdf' },
      { id: 2, filename: 'BETA_report.pdf' }
    ]));

    await TestBed.configureTestingModule({
      imports: [SearchComponent, CommonModule, FormsModule, RouterTestingModule],
      providers: [{ provide: ApiService, useValue: apiSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    apiSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create and load documents on init', () => {
    expect(component).toBeTruthy();
    expect(component.allDocuments.length).toBe(2);
    expect(component.initialLoad).toBeFalse();
  });

  it('should filter documents by search query (case-insensitive)', () => {
    component.searchQuery = 'beta';
    component.onSearch();
    expect(component.results.length).toBe(1);
    expect(component.results[0].filename).toBe('BETA_report.pdf');
  });

  it('should return empty results for blank query', () => {
    component.searchQuery = '';
    component.onSearch();
    expect(component.results.length).toBe(0);
  });

  it('should clear search results', () => {
    component.searchQuery = 'something';
    component.results = [{ id: 1 }];
    component.clearSearch();
    expect(component.searchQuery).toBe('');
    expect(component.results.length).toBe(0);
  });

  it('should navigate to analysis on startAnalysis', () => {
    apiSpy.startAnalysis.and.returnValue(of({ task_id: 'abc-task' }));
    component.startAnalysis(1);
    expect(router.navigate).toHaveBeenCalledWith(['/analysis', 'abc-task']);
  });

  it('should set error on startAnalysis failure', () => {
    apiSpy.startAnalysis.and.returnValue(throwError(() => ({ error: { detail: 'Analysis error' } })));
    component.startAnalysis(1);
    expect(component.error).toBe('Analysis error');
  });

  it('should set error when getDocuments fails on init', () => {
    apiSpy.getDocuments.and.returnValue(throwError(() => ({ error: { detail: 'Load error' } })));
    component.ngOnInit();
    expect(component.error).toBe('Load error');
    expect(component.initialLoad).toBeFalse();
  });
});
