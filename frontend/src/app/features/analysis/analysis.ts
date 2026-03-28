import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/api.service';

interface Keyword {
  keyword: string;
  frequency: number;
}

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
  imports: [CommonModule]
})
export class AnalysisResultComponent implements OnInit {
  taskId!: string;
  result: AnalysisResult | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('task_id');
      if (id) {
        this.taskId = id;
        this.fetchAnalysisResult();
      } else {
        this.error = 'Task ID missing in URL';
        this.loading = false;
      }
    });
  }

  fetchAnalysisResult() {
    this.loading = true;
    this.error = null;

    this.api.getAnalysisResult(this.taskId).subscribe({
      next: (data: AnalysisResult) => {
        this.result = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Analysis fetch error:', err);
        this.error = err.error?.detail || 'Failed to fetch analysis result.';
        this.loading = false;
      }
    });
  }
}
