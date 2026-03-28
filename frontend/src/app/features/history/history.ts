import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './history.html',
})
export class HistoryComponent implements OnInit {
  history: any[] = [];
  loading = true;
  error: string | null = null;
  successMessage: string | null = null;

  // S02 — filter by date
  filterFrom = '';
  filterTo = '';

  // Per-task retry loading
  retryingId: string | null = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading = true;
    this.error = null;
    this.api.getAnalysisHistory().subscribe({
      next: (res) => {
        this.history = res;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.detail || 'Failed to load history.';
        this.loading = false;
      }
    });
  }

  // S02 — filtered by date range
  get filteredHistory(): any[] {
    return this.history.filter(item => {
      const date = new Date(item.started_at);
      if (this.filterFrom && date < new Date(this.filterFrom)) return false;
      if (this.filterTo && date > new Date(this.filterTo + 'T23:59:59')) return false;
      return true;
    });
  }

  clearFilter(): void {
    this.filterFrom = '';
    this.filterTo = '';
  }

  // S04 — retry failed/cancelled
  retryTask(item: any): void {
    this.retryingId = item.task_id;
    this.error = null;
    this.api.retryAnalysis(item.task_id).subscribe({
      next: () => {
        item.status = 'running';
        item.progress = 0;
        this.retryingId = null;
        this.successMessage = `Retrying analysis for "${item.filename}"...`;
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => {
        this.error = err.error?.detail || 'Retry failed.';
        this.retryingId = null;
      }
    });
  }
}
