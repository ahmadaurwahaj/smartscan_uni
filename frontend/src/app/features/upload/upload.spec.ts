import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UploadComponent } from './upload';
import { ApiService } from '../../core/api.service';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { CommonModule } from '@angular/common';

describe('UploadComponent', () => {
  let component: UploadComponent;
  let fixture: ComponentFixture<UploadComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  beforeEach(async () => {
    const apiMock = jasmine.createSpyObj('ApiService', ['uploadDocument']);

    await TestBed.configureTestingModule({
      imports: [UploadComponent, CommonModule, RouterTestingModule],
      providers: [
        { provide: ApiService, useValue: apiMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UploadComponent);
    component = fixture.componentInstance;
    apiSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
    expect(component.selectedFiles.length).toBe(0);
    expect(component.uploading).toBeFalse();
  });

  it('should select files from input event', () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file] } } as any;
    component.onFileSelect(event);
    expect(component.selectedFiles.length).toBe(1);
  });

  it('should show an error when uploading with no files selected', () => {
    const event = new Event('submit');
    component.selectedFiles = [];
    component.onUpload(event);
    expect(component.message).toContain('Please select a file first');
    expect(component.isError).toBeTrue();
  });

  it('should upload files successfully and redirect', (done) => {
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });
    component.selectedFiles = [file];
    apiSpy.uploadDocument.and.returnValue(of([{ id: 1 }, { id: 2 }]));

    const event = new Event('submit');
    component.onUpload(event);

    // Check immediately after observable resolves
    expect(apiSpy.uploadDocument).toHaveBeenCalled();
    expect(component.message).toContain('2 document(s) uploaded successfully');
    expect(component.isError).toBeFalse();
    expect(component.uploading).toBeFalse();

    // Check navigation after setTimeout(1000)
    setTimeout(() => {
      expect(router.navigate).toHaveBeenCalledWith(['/documents']);
      done();
    }, 1100);
  });

  it('should display error message on upload failure', () => {
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });
    component.selectedFiles = [file];
    apiSpy.uploadDocument.and.returnValue(
      throwError(() => ({ error: { detail: 'Server error' } }))
    );

    component.onUpload(new Event('submit'));

    expect(component.message).toBe('Server error');
    expect(component.isError).toBeTrue();
    expect(component.uploading).toBeFalse();
  });

  it('should show generic error when server gives no detail', () => {
    const file = new File(['content'], 'doc.pdf');
    component.selectedFiles = [file];
    apiSpy.uploadDocument.and.returnValue(throwError(() => ({})));
    component.onUpload(new Event('submit'));
    expect(component.message).toBe('Upload failed. Please try again.');
  });
});
