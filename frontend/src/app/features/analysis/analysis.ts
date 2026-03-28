import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

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
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef  // <-- add this
  ) {}

  ngOnInit(): void {
    console.log("COMPONENT LOADED");

    this.route.paramMap.subscribe(params => {
      const id = params.get('task_id');
      console.log("PARAM ID:", id);

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

    this.http.get<AnalysisResult>(`http://localhost:8000/analysis/result/${this.taskId}`)
      .subscribe({
        next: (data) => {
          console.log("API RESPONSE:", data);
          this.result = data;
          this.loading = false;

          // Trigger change detection manually
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("API ERROR:", err);
          this.error = "Failed to fetch analysis result from server";
          this.loading = false;
        }
      });
  }
}