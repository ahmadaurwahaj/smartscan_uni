import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar';
import { RouterTestingModule } from '@angular/router/testing';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the sidebar', () => {
    expect(component).toBeTruthy();
  });

  it('should emit linkClicked event', () => {
    let emitted = false;
    component.linkClicked.subscribe(() => emitted = true);
    component.linkClicked.emit();
    expect(emitted).toBeTrue();
  });
});
