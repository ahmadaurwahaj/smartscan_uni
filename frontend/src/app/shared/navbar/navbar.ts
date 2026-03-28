import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.html',
})
export class NavbarComponent {
  constructor(public auth: AuthService) {}

  get user(): any {
    return this.auth.getCurrentUser();
  }

  logout(): void {
    this.auth.logout();
  }
}
