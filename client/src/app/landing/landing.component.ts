import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';

import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, AfterViewInit {

  @ViewChild('aboutVideo') aboutVideo!: ElementRef<HTMLVideoElement>;

  isLoggedIn = false;
  roleName: string | null = null;

  isMobileMenuOpen = false;

  heroImage = 'assets/nexus-warehouse.png';

  stats = [
    {
      icon: '📈',
      value: '18.5%',
      title: 'Profit Optimization',
      trend: '+6.2%',
      description:
        'Projected business efficiency gain through better stock visibility and connected trade flow.'
    },
    {
      icon: '🏭',
      value: '1,240+',
      title: 'Active Manufacturers',
      trend: '+12%',
      description:
        'Manufacturers can onboard, manage, and publish products faster in one platform.'
    },
    {
      icon: '📦',
      value: '9,800+',
      title: 'Wholesale Orders',
      trend: '+21%',
      description:
        'Bulk product movement becomes smoother with role-specific workflows and inventory control.'
    },
    {
      icon: '🛒',
      value: '3.2L+',
      title: 'Consumer Visits',
      trend: '+15%',
      description:
        'A modern UI increases trust, browsing engagement, and overall conversion potential.'
    }
  ];

  roles = [
    {
      icon: '🏭',
      badge: 'ROLE 01',
      title: 'Manufacturer',
      description:
        'Build and manage products, control supply, and publish inventory into the Nexus ecosystem.',
      points: [
        'Create and update products',
        'Manage inventory visibility',
        'Control production-side operations'
      ]
    },
    {
      icon: '🚚',
      badge: 'ROLE 02',
      title: 'Wholesaler',
      description:
        'Access bulk-ready inventory, place large orders, and manage stock movement efficiently.',
      points: [
        'Place and manage bulk orders',
        'Track stock and records',
        'Improve distribution flow'
      ]
    },
    {
      icon: '🛍️',
      badge: 'ROLE 03',
      title: 'Consumer',
      description:
        'Browse available products, compare details, and access a cleaner buying journey.',
      points: [
        'Explore product listings',
        'Access clear product details',
        'Enjoy better marketplace experience'
      ]
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private sessionService: SessionService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  ngAfterViewInit(): void {
    this.playAboutVideo();
  }

  loadUserData(): void {
    this.isLoggedIn = this.authService.getLoginStatus;
    this.roleName = this.authService.getRole;
  }

  playAboutVideo(): void {
    setTimeout(() => {
      const video = this.aboutVideo?.nativeElement;

      if (!video) {
        return;
      }

      video.muted = true;
      video.loop = true;
      video.autoplay = true;
      video.playsInline = true;

      const playPromise = video.play();

      if (playPromise !== undefined) {
        playPromise.catch(() => {
          video.muted = true;

          video.play().catch(() => {
            console.warn('About video autoplay was blocked by the browser.');
          });
        });
      }
    }, 300);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  logout(): void {
    this.closeMobileMenu();

    this.sessionService.logoutManually();

    this.isLoggedIn = false;
    this.roleName = null;

    this.router.navigateByUrl('/login');
  }

  getDashboardRoute(): string {
    const role = (this.roleName || '').toUpperCase();

    if (role === 'MANUFACTURER') {
      return '/manufacturer-dashboard';
    }

    if (role === 'WHOLESALER') {
      return '/wholesaler-dashboard';
    }

    if (role === 'CONSUMER') {
      return '/consumer-dashboard';
    }

    return '/dashboard';
  }

  scrollToSection(sectionId: string): void {
    this.closeMobileMenu();

    setTimeout(() => {
      const element = document.getElementById(sectionId);

      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 50);
  }

  scrollToTop(): void {
    this.closeMobileMenu();

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}