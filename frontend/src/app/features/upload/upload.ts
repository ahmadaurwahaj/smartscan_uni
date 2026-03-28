import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-upload',
  standalone: true,
  templateUrl: './upload.html',
  styleUrls: ['./upload.css'],
  imports: [NgIf]
})
export class UploadComponent {

  selectedFile!: File;
  message: string = '';

  constructor(private http: HttpClient) {}

  onFileSelect(event: any) {
    this.selectedFile = event.target.files[0];
  }

  onUpload(event: Event) {
    event.preventDefault();

    if (!this.selectedFile) {
      this.message = "Please select a file first.";
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http.post('http://localhost:8000/documents/upload', formData)
      .subscribe({
        next: (res) => {
          console.log("UPLOAD RESPONSE:", res);
          this.message = "File uploaded successfully!";
        },
        error: (err) => {
          console.error("UPLOAD ERROR:", err);
          this.message = "Upload failed!";
        }
      });
  }
}
