import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

const BASE_URL = 'http://localhost:8000';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    // AuthService uses getAuthHeaders() — must be included in spy
    const spy = jasmine.createSpyObj('AuthService', [
      'getToken', 'getAuthHeaders', 'isLoggedIn', 'getCurrentUser', 'logout'
    ]);
    spy.getAuthHeaders.and.returnValue({ Authorization: 'Bearer mock-token' });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        { provide: AuthService, useValue: spy }
      ]
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get documents list', () => {
    service.getDocuments().subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/documents/`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should upload document with form data', () => {
    const mockFormData = new FormData();
    service.uploadDocument(mockFormData).subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/documents/upload`);
    expect(req.request.method).toBe('POST');
    req.flush([{ task_id: 'abc' }]);
  });

  it('should delete a document', () => {
    service.deleteDocument(1).subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/documents/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });

  it('should download a document as blob', () => {
    service.downloadDocument(1).subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/documents/1/download`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });

  it('should get document text', () => {
    service.getDocumentText(1).subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/documents/1/text`);
    expect(req.request.method).toBe('GET');
    req.flush({ text: 'Sample text' });
  });

  it('should start analysis', () => {
    service.startAnalysis(1).subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/analysis/start/1`);
    expect(req.request.method).toBe('POST');
    req.flush({ task_id: 'xyz' });
  });

  it('should fetch analysis result with keyword filter param', () => {
    service.getAnalysisResult('123', { keyword: 'test' }).subscribe();
    const req = httpMock.expectOne(r => r.url === `${BASE_URL}/analysis/result/123`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('keyword')).toBe('test');
    req.flush({ status: 'completed', keywords: [] });
  });

  it('should fetch analysis result with no filters', () => {
    service.getAnalysisResult('123').subscribe();
    const req = httpMock.expectOne(r => r.url === `${BASE_URL}/analysis/result/123`);
    expect(req.request.method).toBe('GET');
    req.flush({ status: 'completed', keywords: [] });
  });

  it('should request an export blob', () => {
    service.exportAnalysisResult('123', 'pdf').subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/analysis/export/123?format=pdf`);
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });

  it('should cancel analysis', () => {
    service.cancelAnalysis('123').subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/analysis/cancel/123`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Cancelled' });
  });

  it('should retry analysis', () => {
    service.retryAnalysis('123').subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/analysis/retry/123`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });

  it('should filter by min_freq', () => {
    service.getAnalysisResult('123', { min_freq: 5 }).subscribe();
    const req = httpMock.expectOne(r => r.url === `${BASE_URL}/analysis/result/123`);
    expect(req.request.params.get('min_freq')).toBe('5');
    req.flush({ status: 'completed', keywords: [] });
  });

  it('should filter by max_freq', () => {
    service.getAnalysisResult('123', { max_freq: 100 }).subscribe();
    const req = httpMock.expectOne(r => r.url === `${BASE_URL}/analysis/result/123`);
    expect(req.request.params.get('max_freq')).toBe('100');
    req.flush({ status: 'completed', keywords: [] });
  });

  it('should filter by sort_by', () => {
    service.getAnalysisResult('123', { sort_by: 'frequency_asc' }).subscribe();
    const req = httpMock.expectOne(r => r.url === `${BASE_URL}/analysis/result/123`);
    expect(req.request.params.get('sort_by')).toBe('frequency_asc');
    req.flush({ status: 'completed', keywords: [] });
  });

  it('should filter by limit', () => {
    service.getAnalysisResult('123', { limit: 10 }).subscribe();
    const req = httpMock.expectOne(r => r.url === `${BASE_URL}/analysis/result/123`);
    expect(req.request.params.get('limit')).toBe('10');
    req.flush({ status: 'completed', keywords: [] });
  });
});
