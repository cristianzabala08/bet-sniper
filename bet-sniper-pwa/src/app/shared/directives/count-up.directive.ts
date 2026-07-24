import { Directive, ElementRef, Input, OnDestroy, OnInit, inject } from '@angular/core';

/**
 * Anima el número contenido en un string (preservando prefijo/sufijo,
 * separadores de miles y decimales) desde 0 hasta el valor real,
 * disparado cuando el elemento entra en el viewport.
 *
 * Soporta cualquier formato ya resuelto por el CMS: "47", "+$2,340.00",
 * "95%", "+500".
 */
@Directive({
  selector: '[appCountUp]',
  standalone: true
})
export class CountUpDirective implements OnInit, OnDestroy {
  @Input('appCountUp') target: string | number = '';
  @Input() countUpDuration = 1800;

  private readonly el = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;
  private hasAnimated = false;

  ngOnInit(): void {
    const raw = String(this.target ?? '');
    this.el.nativeElement.textContent = raw;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !this.hasAnimated) {
          this.hasAnimated = true;
          this.animate(raw);
          this.observer?.disconnect();
        }
      }
    }, { threshold: 0.4 });

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private animate(raw: string): void {
    const match = raw.match(/[\d.,]+/);
    if (!match || match.index === undefined) {
      return;
    }

    const numStr = match[0];
    const prefix = raw.slice(0, match.index);
    const suffix = raw.slice(match.index + numStr.length);
    const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0;
    const targetValue = parseFloat(numStr.replace(/,/g, ''));
    if (!isFinite(targetValue)) {
      return;
    }

    const el = this.el.nativeElement;
    const start = performance.now();
    const duration = this.countUpDuration;

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = targetValue * eased;
      el.textContent = prefix + current.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }) + suffix;

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }
}
