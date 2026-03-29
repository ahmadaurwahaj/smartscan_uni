import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store token and user after login', () => {
    service.login('test@test.com', 'password').subscribe();
    const req = httpMock.expectOne('http://localhost:8000/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({ token: { access_token: 'jwt-123' }, user: { username: 'tester' } });

    expect(localStorage.getItem('auth_token')).toBe('jwt-123');
    expect(service.isLoggedIn()).toBeTrue();
    expect(service.getCurrentUser().username).toBe('tester');
    expect(service.getToken()).toBe('jwt-123');
  });

  it('should return auth headers with token', () => {
    localStorage.setItem('auth_token', 'jwt-abc');
    const headers = service.getAuthHeaders();
    expect(headers['Authorization']).toBe('Bearer jwt-abc');
  });

  it('should return empty headers when not logged in', () => {
    const headers = service.getAuthHeaders();
    expect(Object.keys(headers).length).toBe(0);
  });

  it('should clear tokens and navigate on logout', () => {
    localStorage.setItem('auth_token', 'jwt-123');
    localStorage.setItem('auth_user', JSON.stringify({ username: 'test' }));
    service.logout();
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should return null user when not authenticated', () => {
    expect(service.getCurrentUser()).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
    expect(service.getToken()).toBeNull();
  });

  it('should register a new user', () => {
    service.register('user', 'user@test.com', 'pass123').subscribe();
    const req = httpMock.expectOne('http://localhost:8000/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'user', email: 'user@test.com', password: 'pass123' });
    req.flush({ message: 'registered' });
  });
});
