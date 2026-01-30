/**
 * Search Modal Component
 * Handles search overlay and predictive search
 */

class SearchModal extends HTMLElement {
  constructor() {
    super();

    this.overlay = this.querySelector('[data-search-overlay]');
    this.input = this.querySelector('[data-search-input]');
    this.results = this.querySelector('[data-search-results]');
    this.closeBtn = this.querySelector('[data-search-close]');

    this.searchUrl = window.routes?.predictive_search_url || '/search/suggest.json';
    this.debounceTimer = null;
    this.abortController = null;
    this.minChars = 3;

    this.init();
  }

  init() {
    // Close handlers
    this.closeBtn?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click', () => this.close());

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });

    // Predictive search
    this.input?.addEventListener('input', () => this.onInput());

    // Form submit
    this.querySelector('form')?.addEventListener('submit', (e) => {
      if (!this.input.value.trim()) {
        e.preventDefault();
      }
    });

    // Listen for open events
    document.addEventListener('search:open', () => this.open());
  }

  isOpen() {
    return this.getAttribute('aria-hidden') === 'false';
  }

  open() {
    this.setAttribute('aria-hidden', 'false');
    document.body.classList.add('search-open');

    // Focus input
    setTimeout(() => {
      this.input?.focus();
    }, 100);

    // Trap focus
    this.trapFocus();
  }

  close() {
    this.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('search-open');

    // Clear results
    this.clearResults();

    // Remove focus trap
    this.removeFocusTrap();

    // Return focus to trigger
    document.querySelector('[data-search-trigger]')?.focus();
  }

  onInput() {
    const query = this.input.value.trim();

    // Clear existing timer
    clearTimeout(this.debounceTimer);

    // Abort any pending request
    this.abortController?.abort();

    if (query.length < this.minChars) {
      this.clearResults();
      return;
    }

    // Debounce the search
    this.debounceTimer = setTimeout(() => {
      this.fetchResults(query);
    }, 300);
  }

  async fetchResults(query) {
    this.results.classList.add('is-loading');

    // Create new abort controller
    this.abortController = new AbortController();

    try {
      const response = await fetch(
        `${this.searchUrl}?q=${encodeURIComponent(query)}&resources[type]=product,collection&resources[limit]=6&section_id=predictive-search`,
        { signal: this.abortController.signal }
      );

      if (!response.ok) throw new Error('Search failed');

      const text = await response.text();

      // Parse the HTML response
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const resultsHTML = doc.querySelector('[data-predictive-search]');

      if (resultsHTML) {
        this.results.innerHTML = resultsHTML.outerHTML;
      } else {
        this.showNoResults(query);
      }

    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Search error:', error);
        this.showNoResults(query);
      }
    } finally {
      this.results.classList.remove('is-loading');
    }
  }

  clearResults() {
    this.results.innerHTML = `
      <div class="search-modal__placeholder">
        <p class="search-modal__hint">${window.translations?.searchPlaceholder || 'What are you looking for?'}</p>
      </div>
    `;
  }

  showNoResults(query) {
    const noResultsText = window.translations?.searchNoResults || 'No results for';
    this.results.innerHTML = `
      <div class="predictive-search__no-results">
        <p>${noResultsText} "${query}"</p>
      </div>
    `;
  }

  trapFocus() {
    const focusableElements = this.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    this.focusTrapHandler = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    };

    this.addEventListener('keydown', this.focusTrapHandler);
  }

  removeFocusTrap() {
    if (this.focusTrapHandler) {
      this.removeEventListener('keydown', this.focusTrapHandler);
    }
  }
}

// Register custom element
customElements.define('search-modal', SearchModal);

/**
 * Search trigger handler
 * Bind to elements with data-search-trigger
 */
document.addEventListener('DOMContentLoaded', () => {
  const triggers = document.querySelectorAll('[data-search-trigger]');

  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('search:open'));
    });
  });
});
