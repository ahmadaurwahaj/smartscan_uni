import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { CommonModule } from '@angular/common';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ApiService', ['getDocuments']);
    authSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'isLoggedIn', 'getToken', 'getAuthHeaders', 'logout']);
    authSpy.getAuthHeaders.and.returnValue({});

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, CommonModule, RouterTestingModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    apiSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    authSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should create and load documents', () => {
    authSpy.getCurrentUser.and.returnValue({ username: 'tester' });
    apiSpy.getDocuments.and.returnValue(of([
      { status: 'uploaded', created_at: '2025-01-01' },
      { status: 'processing', created_at: '2025-01-02' },
      { status: 'completed', created_at: '2025-01-03' }
    ]));

    fixture.detectChanges();

    expect(component.user.username).toBe('tester');
    expect(component.documents.length).toBe(3);
    expect(component.totalDocs).toBe(3);
    expect(component.uploadedDocs).toBe(1);
    expect(component.processingDocs).toBe(1);
    expect(component.completedDocs).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('should expose recent 5 docs via recentDocs getter', () => {
    authSpy.getCurrentUser.and.returnValue(null);
    const docs = Array.from({ length: 8 }, (_, i) => ({ status: 'completed', created_at: `2025-01-0${i+1}` }));
    apiSpy.getDocuments.and.returnValue(of(docs));
    fixture.detectChanges();
    expect(component.recentDocs.length).toBe(5);
  });

  it('should handle API error gracefully', () => {
    authSpy.getCurrentUser.and.returnValue(null);
    apiSpy.getDocuments.and.returnValue(throwError(() => new Error('load failed')));
    fixture.detectChanges();
    expect(component.loading).toBeFalse();
    expect(component.documents.length).toBe(0);
  });
});
