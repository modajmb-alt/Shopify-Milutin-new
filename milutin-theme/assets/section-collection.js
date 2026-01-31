/**
 * Collection Page JavaScript
 * Handles filtering, sorting, and drawer interactions
 */

(function() {
  'use strict';

  /**
   * Filter Drawer
   */
  class FiltersDrawer {
    constructor() {
      this.drawer = document.querySelector('[data-filters-drawer]');
      if (!this.drawer) return;

      this.overlay = this.drawer.querySelector('[data-filters-overlay]');
      this.closeBtn = this.drawer.querySelector('[data-filters-close]');
      this.toggleBtn = document.querySelector('[data-filter-toggle]');
      this.form = this.drawer.querySelector('[data-filters-form]');

      this.init();
    }

    init() {
      this.toggleBtn?.addEventListener('click', () => this.open());
      this.closeBtn?.addEventListener('click', () => this.close());
      this.overlay?.addEventListener('click', () => this.close());

      // Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen()) {
          this.close();
        }
      });

      // Form submit
      this.form?.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    isOpen() {
      return this.drawer.getAttribute('aria-hidden') === 'false';
    }

    open() {
      this.drawer.setAttribute('aria-hidden', 'false');
      this.toggleBtn?.setAttribute('aria-expanded', 'true');
      document.body.classList.add('filters-open');

      // Focus first focusable element
      const firstFocusable = this.drawer.querySelector('button, [href], input, select');
      firstFocusable?.focus();
    }

    close() {
      this.drawer.setAttribute('aria-hidden', 'true');
      this.toggleBtn?.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('filters-open');
      this.toggleBtn?.focus();
    }

    handleSubmit(e) {
      e.preventDefault();
      const formData = new FormData(this.form);
      const params = new URLSearchParams();

      for (const [key, value] of formData.entries()) {
        if (value) {
          params.append(key, value);
        }
      }

      // Keep sort parameter if present
      const currentUrl = new URL(window.location.href);
      const sortBy = currentUrl.searchParams.get('sort_by');
      if (sortBy) {
        params.set('sort_by', sortBy);
      }

      // Navigate with filters
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.location.href = newUrl;
    }
  }

  /**
   * Sidebar Filters (auto-submit on change)
   */
  class SidebarFilters {
    constructor() {
      this.form = document.querySelector('.filters-sidebar[data-filters-form]');
      if (!this.form) return;

      this.init();
    }

    init() {
      // Auto-submit on checkbox change
      this.form.querySelectorAll('[data-filter-checkbox]').forEach((checkbox) => {
        checkbox.addEventListener('change', () => this.submitForm());
      });

      // Submit on price input change (with debounce)
      let priceTimeout;
      this.form.querySelectorAll('[data-filter-price]').forEach((input) => {
        input.addEventListener('input', () => {
          clearTimeout(priceTimeout);
          priceTimeout = setTimeout(() => this.submitForm(), 500);
        });
      });
    }

    submitForm() {
      const formData = new FormData(this.form);
      const params = new URLSearchParams();

      for (const [key, value] of formData.entries()) {
        if (value) {
          params.append(key, value);
        }
      }

      // Keep sort parameter
      const currentUrl = new URL(window.location.href);
      const sortBy = currentUrl.searchParams.get('sort_by');
      if (sortBy) {
        params.set('sort_by', sortBy);
      }

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.location.href = newUrl;
    }
  }

  /**
   * Sort Select
   */
  class SortSelect {
    constructor() {
      this.select = document.querySelector('[data-sort-select]');
      if (!this.select) return;

      this.init();
    }

    init() {
      this.select.addEventListener('change', () => {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('sort_by', this.select.value);
        window.location.href = currentUrl.toString();
      });
    }
  }

  /**
   * Initialize
   */
  function init() {
    new FiltersDrawer();
    new SidebarFilters();
    new SortSelect();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
