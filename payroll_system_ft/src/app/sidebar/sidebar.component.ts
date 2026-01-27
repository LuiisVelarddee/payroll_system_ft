import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  menuItems = [
    {
      title: 'Catálogo Roles',
      icon: 'shield',
      route: '/roles'
    },
    {
      title: 'Catálogo Empleados',
      icon: 'users',
      route: '/empleados'
    },
    {
      title: 'Catálogo Usuarios',
      icon: 'user',
      route: '/usuarios'
    }
  ];

  constructor(private router: Router) {}

  isActive(route: string): boolean {
    return this.router.url === route;
  }
}
