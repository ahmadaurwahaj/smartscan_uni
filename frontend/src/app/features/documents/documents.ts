import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './documents.html',
  styleUrls: ['./documents.css']
})
export class DocumentsComponent implements OnInit {
  documents: any[] = [];
  loading = true;
  error: string | null = null;
  successMessage: string | null = null;

  // Search & sort (S01, S03)
  searchQuery = '';
  sortAsc = false;

  // Delete confirmation dialog (R06, R19)
  showDeleteDialog = false;
  docToDelete: any = null;
  deleting = false;

  // Text preview (R13)
  previewDocId: number | null = null;
  previewText: string | null = null;
  previewLoading = false;

  // Per-doc loading states
  analyzingDocId: number | null = null;
  downloadingDocId: number | null = null;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading = true;
    this.error = null;
    this.api.getDocuments().subscribe({
      next: (res) => {
        this.documents = res;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.detail || 'Failed to load documents.';
        this.loading = false;
      }
    });
  }

  // Filtered + sorted list (S01, S03)
  get filteredDocuments(): any[] {
    let docs = this.documents.filter(d =>
      d.filename.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
    return [...docs].sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return this.sortAsc ? diff : -diff;
    });
  }

  toggleSort(): void {
    this.sortAsc = !this.sortAsc;
  }

  // Analysis
  startAnalysis(docId: number): void {
    this.analyzingDocId = docId;
    this.error = null;
    this.api.startAnalysis(docId).subscribe({
      next: (res) => {
        this.analyzingDocId = null;
        if (res.task_id) this.router.navigate(['/analysis', res.task_id]);
      },
      error: (err) => {
        this.error = err.error?.detail || 'Failed to start analysis.';
        this.analyzingDocId = null;
      }
    });
  }

  // Download (R18)
  downloadDocument(doc: any): void {
    this.downloadingDocId = doc.id;
    this.api.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.filename;
        a.click();
        window.URL.revokeObjectURL(url);
        this.downloadingDocId = null;
      },
      error: () => {
        this.error = 'Download failed.';
        this.downloadingDocId = null;
      }
    });
  }

  // Text preview (R13)
  togglePreview(docId: number): void {
    if (this.previewDocId === docId) {
      this.previewDocId = null;
      this.previewText = null;
      return;
    }
    this.previewDocId = docId;
    this.previewText = null;
    this.previewLoading = true;
    this.api.getDocumentText(docId).subscribe({
      next: (res) => {
        this.previewText = res.text.slice(0, 1000);
        this.previewLoading = false;
      },
      error: () => {
        this.previewText = 'Could not load text preview.';
        this.previewLoading = false;
      }
    });
  }

  // Delete confirmation (R06, R19)
  confirmDelete(doc: any): void {
    this.docToDelete = doc;
    this.showDeleteDialog = true;
  }

  cancelDelete(): void {
    this.docToDelete = null;
    this.showDeleteDialog = false;
  }

  executeDelete(): void {
    if (!this.docToDelete) return;
    this.deleting = true;
    this.api.deleteDocument(this.docToDelete.id).subscribe({
      next: () => {
        const name = this.docToDelete.filename;
        this.documents = this.documents.filter(d => d.id !== this.docToDelete.id);
        this.successMessage = `"${name}" deleted successfully.`;
        this.showDeleteDialog = false;
        this.docToDelete = null;
        this.deleting = false;
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.error = err.error?.detail || 'Delete failed.';
        this.showDeleteDialog = false;
        this.deleting = false;
      }
    });
  }
}
