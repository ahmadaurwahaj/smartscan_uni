import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavbarComponent } from './navbar';
import { AuthService } from '../../core/auth.service';
import { RouterTestingModule } from '@angular/router/testing';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    // AuthService.logout() navigates internally, give it all real methods
    authSpy = jasmine.createSpyObj('AuthService', [
      'isLoggedIn', 'getCurrentUser', 'getToken', 'getAuthHeaders', 'logout'
    ]);
    authSpy.getAuthHeaders.and.returnValue({});
    authSpy.getCurrentUser.and.returnValue({ username: 'tester' });

    await TestBed.configureTestingModule({
      imports: [NavbarComponent, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    authSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose current user via auth service', () => {
    expect(component.user?.username).toBe('tester');
  });

  it('should call auth.logout() when logout() is triggered', () => {
    component.logout();
    expect(authSpy.logout).toHaveBeenCalled();
  });

  it('should return null user when not logged in', () => {
    authSpy.getCurrentUser.and.returnValue(null);
    expect(component.user).toBeNull();
  });
});
