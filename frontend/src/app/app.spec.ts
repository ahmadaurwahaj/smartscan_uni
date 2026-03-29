import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AuthService } from './core/auth.service';

describe('App', () => {
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'getCurrentUser', 'getToken', 'getAuthHeaders', 'logout']);
    authSpy.getAuthHeaders.and.returnValue({});

    await TestBed.configureTestingModule({
      imports: [App, RouterTestingModule, HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: authSpy }]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should toggle sidebar state', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app.sidebarOpen).toBeFalse();
    app.toggleSidebar();
    expect(app.sidebarOpen).toBeTrue();
    app.closeSidebar();
    expect(app.sidebarOpen).toBeFalse();
  });
});
