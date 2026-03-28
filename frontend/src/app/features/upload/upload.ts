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

  selectedFile!: File;
  message = '';
  isError = false;

  constructor(private api: ApiService, private router: Router) {}

  onFileSelect(event: any) {
    this.selectedFile = event.target.files[0];
  }

  onUpload(event: Event) {
    event.preventDefault();

    if (!this.selectedFile) {
      this.message = 'Please select a file first.';
      this.isError = true;
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.api.uploadDocument(formData).subscribe({
      next: (res) => {
        this.message = `"${res.filename}" uploaded successfully!`;
        this.isError = false;
        setTimeout(() => this.router.navigate(['/documents']), 1000);
      },
      error: (err) => {
        console.error('Upload error:', err);
        this.message = err.error?.detail || 'Upload failed. Please try again.';
        this.isError = true;
      }
    });
  }
}
