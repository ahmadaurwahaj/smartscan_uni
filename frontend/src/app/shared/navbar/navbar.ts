import { Component, Output, EventEmitter } from '@angular/core';
import { NgIf } from '@angular/common';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.html',
})
export class NavbarComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  constructor(public auth: AuthService) {}

  get user(): any {
    return this.auth.getCurrentUser();
  }

  logout(): void {
    this.auth.logout();
  }
}
