class MobileMenu {
    constructor() {
      this.hamburger = document.querySelector('.hamburger');
      this.nav = document.querySelector('#main-nav');
      if (!this.hamburger || !this.nav) return;
      this.bindEvents();
    }
    bindEvents() {
      this.hamburger.addEventListener('click', () => this.toggle());
      this.nav.querySelectorAll('a').forEach(l => l.addEventListener('click', () => this.close()));
      window.addEventListener('resize', () => this.reset());
    }
    toggle() {
      const open = this.nav.classList.toggle('open');
      this.hamburger.classList.toggle('active', open);
      this.hamburger.setAttribute('aria-expanded', open);
    }
    close() {
      this.nav.classList.remove('open');
      this.hamburger.classList.remove('active');
      this.hamburger.setAttribute('aria-expanded', 'false');
    }
    reset() {
      if (window.innerWidth >= 768) this.close();
    }
  }
  document.addEventListener('DOMContentLoaded', () => new MobileMenu());