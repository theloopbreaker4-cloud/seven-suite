/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: admin-layout.component.ts
 * Description: Main admin layout with sidebar and header
 * Created: 2025-11-03
 */

import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-admin-layout',
  standalone: false,
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.less']
})
export class AdminLayoutComponent implements OnInit {
  /**
   * Sidebar open/closed state
   */
  sidebarOpen = true;

  constructor() {}

  ngOnInit(): void {}

  /**
   * Toggle sidebar visibility
   */
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
