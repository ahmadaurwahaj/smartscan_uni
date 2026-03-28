import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.html',
  styleUrls: ['./search.css']
})
export class SearchComponent implements OnInit {
  searchQuery = '';
  allDocuments: any[] = [];
  results: any[] = [];
  loading = false;
  initialLoad = true;
  error: string | null = null;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.api.getDocuments().subscribe({
      next: (docs) => {
        this.allDocuments = docs;
        this.initialLoad = false;
      },
      error: (err) => {
        this.error = err.error?.detail || 'Failed to load documents.';
        this.initialLoad = false;
      }
    });
  }

  // S01 — search documents by name
  onSearch(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.results = [];
      return;
    }
    this.results = this.allDocuments.filter(d =>
      d.filename.toLowerCase().includes(q)
    );
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.results = [];
  }

  startAnalysis(docId: number): void {
    this.api.startAnalysis(docId).subscribe({
      next: (res) => {
        if (res.task_id) this.router.navigate(['/analysis', res.task_id]);
      },
      error: (err) => { this.error = err.error?.detail || 'Analysis failed.'; }
    });
  }
}
