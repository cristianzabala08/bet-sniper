import { Component, Input, ElementRef, AfterViewInit, OnDestroy, HostListener, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import gsap from 'gsap';

interface DustParticle {
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
}

@Component({
  selector: 'app-hero-cinematic',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hero-cinematic.component.html',
  styleUrls: ['./hero-cinematic.component.scss']
})
export class HeroCinematicComponent implements AfterViewInit, OnDestroy {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() ctaText = 'Únete Ahora';
  @Input() ctaLink = '/auth/register';

  @ViewChild('heroRoot', { static: true }) heroRoot!: ElementRef<HTMLElement>;

  readonly hudTicks = Array.from({ length: 32 }, (_, i) => i * 11.25);
  readonly dust: DustParticle[] = Array.from({ length: 16 }, () => ({
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 2 + Math.random() * 3,
    delay: Math.random() * 8,
    duration: 6 + Math.random() * 6
  }));
  readonly sparks = Array.from({ length: 5 }, (_, i) => i);

  private quickX?: (value: number) => void;
  private quickY?: (value: number) => void;
  private entranceTl?: gsap.core.Timeline;
  private reduceMotion = false;

  ngAfterViewInit(): void {
    this.reduceMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const el = this.heroRoot.nativeElement;
    this.quickX = gsap.quickTo(el, '--mx', { duration: 0.6, ease: 'power3.out' });
    this.quickY = gsap.quickTo(el, '--my', { duration: 0.6, ease: 'power3.out' });

    if (this.reduceMotion) {
      return;
    }

    this.entranceTl = gsap.timeline({ defaults: { ease: 'power2.out' } })
      .from(el.querySelector('.shield-wrap'), { opacity: 0, scale: 0.7, duration: 1 }, 0.1)
      .from(el.querySelector('.energy-light'), { opacity: 0, duration: 0.5 }, 0.6)
      .from(el.querySelectorAll('.hero-text > *'), { opacity: 0, y: 24, stagger: 0.12, duration: 0.6 }, 0.7)
      .from(el.querySelector('.btn-cta-liquid'), { opacity: 0, y: 16, duration: 0.5 }, 1.15);
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(evt: MouseEvent): void {
    if (this.reduceMotion || !this.quickX || !this.quickY) {
      return;
    }
    const rect = this.heroRoot.nativeElement.getBoundingClientRect();
    const nx = ((evt.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((evt.clientY - rect.top) / rect.height - 0.5) * 2;
    this.quickX(nx * 10);
    this.quickY(ny * 10);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.quickX?.(0);
    this.quickY?.(0);
  }

  ngOnDestroy(): void {
    this.entranceTl?.kill();
  }
}
