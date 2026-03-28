import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
})
export class DashboardComponent implements OnInit {
  user: any = null;
  documents: any[] = [];
  loading = true;

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.user = this.auth.getCurrentUser();
    this.api.getDocuments().subscribe({
      next: (docs) => {
        this.documents = docs;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get totalDocs(): number { return this.documents.length; }
  get uploadedDocs(): number { return this.documents.filter(d => d.status === 'uploaded').length; }
  get processingDocs(): number { return this.documents.filter(d => d.status === 'processing').length; }
  get completedDocs(): number { return this.documents.filter(d => d.status === 'completed').length; }
  get recentDocs(): any[] { return this.documents.slice(0, 5); }
}
