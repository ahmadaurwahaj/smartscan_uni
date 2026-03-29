import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  templateUrl: './upload.html',
  styleUrls: ['./upload.css'],
  imports: [NgIf]
})
export class UploadComponent {

  selectedFiles: File[] = [];
  message = '';
  isError = false;
  uploading = false;

  constructor(private api: ApiService, private router: Router) {}

  onFileSelect(event: any) {
    this.selectedFiles = Array.from(event.target.files);
  }

  onUpload(event: Event) {
    event.preventDefault();

    if (this.selectedFiles.length === 0) {
      this.message = 'Please select a file first.';
      this.isError = true;
      return;
    }

    this.uploading = true;
    this.message = '';

    const formData = new FormData();
    this.selectedFiles.forEach(file => formData.append('files', file));

    this.api.uploadDocument(formData).subscribe({
      next: (res: any[]) => {
        this.message = `${res.length} document(s) uploaded successfully!`;
        this.isError = false;
        this.uploading = false;
        setTimeout(() => this.router.navigate(['/documents']), 1000);
      },
      error: (err) => {
        this.message = err.error?.detail || 'Upload failed. Please try again.';
        this.isError = true;
        this.uploading = false;
      }
    });
  }
}
