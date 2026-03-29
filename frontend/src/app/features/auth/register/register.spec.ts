import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register';
import { AuthService } from '../../../core/auth.service';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['register', 'isLoggedIn', 'getToken', 'getAuthHeaders', 'logout', 'getCurrentUser']);
    authSpy.getAuthHeaders.and.returnValue({});

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, FormsModule, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    authSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.loading).toBeFalse();
  });

  it('should require all fields — empty username', () => {
    component.username = '';
    component.email = 'e@e.com';
    component.password = 'pass';
    component.onSubmit();
    expect(component.error).toBe('All fields are required.');
    expect(authSpy.register).not.toHaveBeenCalled();
  });

  it('should require all fields — empty email', () => {
    component.username = 'user';
    component.email = '';
    component.password = 'pass';
    component.onSubmit();
    expect(component.error).toBe('All fields are required.');
  });

  it('should require all fields — empty password', () => {
    component.username = 'user';
    component.email = 'e@e.com';
    component.password = '';
    component.onSubmit();
    expect(component.error).toBe('All fields are required.');
  });

  it('should show error when passwords do not match', () => {
    component.username = 'user';
    component.email = 'e@e.com';
    component.password = 'pass1';
    component.confirmPassword = 'pass2';
    component.onSubmit();
    expect(component.error).toBe('Passwords do not match.');
    expect(authSpy.register).not.toHaveBeenCalled();
  });

  it('should register successfully and set success message', () => {
    authSpy.register.and.returnValue(of({}));
    component.username = 'user';
    component.email = 'e@e.com';
    component.password = 'pass';
    component.confirmPassword = 'pass';
    component.onSubmit();
    expect(authSpy.register).toHaveBeenCalledWith('user', 'e@e.com', 'pass');
    expect(component.success).toContain('Account created');
  });

  it('should show error on registration failure with detail', () => {
    authSpy.register.and.returnValue(throwError(() => ({ error: { detail: 'Email taken' } })));
    component.username = 'user';
    component.email = 'e@e.com';
    component.password = 'pass';
    component.confirmPassword = 'pass';
    component.onSubmit();
    expect(component.error).toBe('Email taken');
    expect(component.loading).toBeFalse();
  });

  it('should show generic error on registration failure without detail', () => {
    authSpy.register.and.returnValue(throwError(() => ({})));
    component.username = 'user';
    component.email = 'e@e.com';
    component.password = 'pass';
    component.confirmPassword = 'pass';
    component.onSubmit();
    expect(component.error).toBe('Registration failed. Please try again.');
  });
});
