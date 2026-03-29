import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface Keyword { keyword: string; frequency: number; }

interface AnalysisResult {
  task_id: string;
  status: string;
  progress: number;
  keywords: Keyword[];
}

@Component({
  selector: 'app-analysis',
  templateUrl: './analysis.html',
  styleUrls: ['./analysis.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class AnalysisResultComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  taskId!: string;
  result: AnalysisResult | null = null;
  loading = true;
  error: string | null = null;
  cancelling = false;
  activeTab: 'keywords' | 'chart' = 'keywords';
  private chart: Chart | null = null;
  private pollInterval: any = null;
  private filterTimeout: any = null;

  keywordFilter = '';
  minFreq: number | null = null;
  sortBy = 'frequency_desc';

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('task_id');
      if (id) {
        this.taskId = id;
        this.fetchResult();
      } else {
        this.error = 'Task ID missing in URL.';
        this.loading = false;
      }
    });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.stopPolling();
    if (this.chart) this.chart.destroy();
  }

  fetchResult(): void {
    const filters = {
      keyword: this.keywordFilter || undefined,
      min_freq: this.minFreq || undefined,
      sort_by: this.sortBy || undefined
    };
    this.api.getAnalysisResult(this.taskId, filters).subscribe({
      next: (data: AnalysisResult) => {
        this.result = data;
        this.loading = false;

        if (data.status === 'running' || data.status === 'pending') {
          this.startPolling();
        } else {
          this.stopPolling();
          if (data.status === 'completed') {
            setTimeout(() => this.renderChart(), 100);
          }
        }
      },
      error: (err) => {
        this.error = err.error?.detail || 'Failed to fetch analysis result.';
        this.loading = false;
        this.stopPolling();
      }
    });
  }

  // R11 — poll every 2s while running
  startPolling(): void {
    if (this.pollInterval) return;
    this.pollInterval = setInterval(() => {
      this.api.getAnalysisResult(this.taskId).subscribe({
        next: (data: AnalysisResult) => {
          this.result = data;
          if (data.status !== 'running' && data.status !== 'pending') {
            this.stopPolling();
            if (data.status === 'completed') {
              setTimeout(() => this.renderChart(), 100);
            }
          }
        },
        error: () => this.stopPolling()
      });
    }, 2000);
  }

  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  // R12 — cancel analysis
  cancelAnalysis(): void {
    this.cancelling = true;
    this.api.cancelAnalysis(this.taskId).subscribe({
      next: () => {
        this.stopPolling();
        if (this.result) this.result.status = 'cancelled';
        this.cancelling = false;
      },
      error: (err) => {
        this.error = err.error?.detail || 'Cancel failed.';
        this.cancelling = false;
      }
    });
  }

  // S04 — retry analysis
  retryAnalysis(): void {
    this.loading = true;
    this.error = null;
    this.api.retryAnalysis(this.taskId).subscribe({
      next: () => {
        if (this.result) this.result.status = 'running';
        this.loading = false;
        this.startPolling();
      },
      error: (err) => {
        this.error = err.error?.detail || 'Retry failed.';
        this.loading = false;
      }
    });
  }

  // C01 — Apply Filters
  applyFilters(): void {
    if (this.filterTimeout) clearTimeout(this.filterTimeout);
    this.filterTimeout = setTimeout(() => {
      this.fetchResult();
    }, 400);
  }

  // C02 — Exports
  exportCSV(): void {
    this.api.exportAnalysisResult(this.taskId, 'csv').subscribe({
      next: (blob) => this.downloadBlob(blob, `analysis_${this.taskId}.csv`),
      error: () => alert('CSV Export failed.')
    });
  }

  exportPDF(): void {
    this.api.exportAnalysisResult(this.taskId, 'pdf').subscribe({
      next: (blob) => this.downloadBlob(blob, `analysis_${this.taskId}.pdf`),
      error: () => alert('PDF Export failed.')
    });
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  // R15 — bar chart using Chart.js
  renderChart(): void {
    if (!this.chartCanvas || !this.result?.keywords?.length) return;
    if (this.chart) this.chart.destroy();

    const top = [...this.result.keywords]
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20);

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: top.map(k => k.keyword),
        datasets: [{
          label: 'Frequency',
          data: top.map(k => k.frequency),
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  switchTab(tab: 'keywords' | 'chart'): void {
    this.activeTab = tab;
    if (tab === 'chart') setTimeout(() => this.renderChart(), 50);
  }

  get isRunning(): boolean {
    return this.result?.status === 'running' || this.result?.status === 'pending';
  }

  get topKeywords(): Keyword[] {
    return [...(this.result?.keywords || [])]
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 50);
  }
}
