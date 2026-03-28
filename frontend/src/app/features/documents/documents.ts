import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documents.html',
  styleUrls: ['./documents.css']
})
export class DocumentsComponent {

  documents: any[] = [];
  loading: boolean = true;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadDocuments();
  }

  loadDocuments() {
    this.http.get('http://localhost:8000/documents')
      .subscribe({
        next: (res: any) => {
          this.documents = res;
          this.loading = false;
        },
        error: (err) => {
          console.error("Failed to load documents:", err);
          this.loading = false;
        }
      });
  }

   startAnalysis(docId: number) {
  this.http.post(`http://localhost:8000/analysis/start/${docId}`, {})
    .subscribe({
      next: (res: any) => {
        console.log("Analysis Response:", res);

        if (res.task_id) {
          // AUTO REDIRECT TO ANALYSIS RESULT PAGE
          window.location.href = `/analysis/${res.task_id}`;
        } else {
          alert("Analysis completed, but no task ID returned.");
        }
      },
      error: (err: any) => {
        console.error("Analysis error:", err);
        alert("Analysis failed!");
      }
    });
}



}
