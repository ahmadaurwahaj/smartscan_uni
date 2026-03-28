import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './documents.html',
  styleUrls: ['./documents.css']
})
export class DocumentsComponent implements OnInit {

  documents: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.loadDocuments();
  }

  loadDocuments() {
    this.loading = true;
    this.error = null;
    this.api.getDocuments().subscribe({
      next: (res) => {
        this.loading = false;
        this.documents = res;
        console.log("Res", res);
        console.log("Loading state", this.loading)
      },
      error: (err) => {
        console.error('Failed to load documents:', err);
        this.error = err.error?.detail || 'Failed to load documents.';
        this.loading = false;
      },
      complete: () => console.log('stream completed') // add this

    });
  }

  startAnalysis(docId: number) {
    this.api.startAnalysis(docId).subscribe({
      next: (res) => {
        if (res.task_id) {
          this.router.navigate(['/analysis', res.task_id]);
        }
      },
      error: (err) => {
        console.error('Analysis error:', err);
        alert(err.error?.detail || 'Analysis failed.');
      }
    });
  }
}
