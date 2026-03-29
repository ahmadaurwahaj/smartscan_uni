import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login';
import { AuthService } from '../../../core/auth.service';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { FormsModule } from '@angular/forms';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['login', 'isLoggedIn', 'getToken', 'getAuthHeaders', 'logout', 'getCurrentUser']);
    authSpy.getAuthHeaders.and.returnValue({});

    await TestBed.configureTestingModule({
      imports: [LoginComponent, FormsModule, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
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

  it('should show error when fields are empty', () => {
    component.email = '';
    component.password = '';
    component.onSubmit();
    expect(component.error).toBe('Please enter email and password.');
    expect(authSpy.login).not.toHaveBeenCalled();
  });

  it('should show error when only email is empty', () => {
    component.email = '';
    component.password = 'pass';
    component.onSubmit();
    expect(component.error).toBe('Please enter email and password.');
  });

  it('should show error when only password is empty', () => {
    component.email = 'test@test.com';
    component.password = '';
    component.onSubmit();
    expect(component.error).toBe('Please enter email and password.');
  });

  it('should login successfully and navigate to root', () => {
    authSpy.login.and.returnValue(of({}));
    component.email = 'test@test.com';
    component.password = 'password123';
    component.onSubmit();
    expect(authSpy.login).toHaveBeenCalledWith('test@test.com', 'password123');
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should show error on login failure', () => {
    authSpy.login.and.returnValue(throwError(() => ({ error: { detail: 'Invalid credentials' } })));
    component.email = 'test@test.com';
    component.password = 'wrongpass';
    component.onSubmit();
    expect(component.error).toBe('Invalid credentials');
    expect(component.loading).toBeFalse();
  });

  it('should display generic error when no detail provided', () => {
    authSpy.login.and.returnValue(throwError(() => ({})));
    component.email = 'test@test.com';
    component.password = 'wrongpass';
    component.onSubmit();
    expect(component.error).toBe('Login failed. Please check your credentials.');
  });
});
