/**
 * Cart Page & Drawer JavaScript
 * Handles cart interactions, AJAX updates, and drawer functionality
 */

(function() {
  'use strict';

  /**
   * Cart Drawer
   */
  class CartDrawer {
    constructor() {
      this.drawer = document.querySelector('[data-cart-drawer]');
      if (!this.drawer) return;

      this.overlay = this.drawer.querySelector('[data-cart-drawer-overlay]');
      this.closeBtn = this.drawer.querySelector('[data-cart-drawer-close]');
      this.content = this.drawer.querySelector('[data-cart-drawer-content]');

      this.init();
    }

    init() {
      // Close button
      this.closeBtn?.addEventListener('click', () => this.close());

      // Overlay click
      this.overlay?.addEventListener('click', () => this.close());

      // Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen()) {
          this.close();
        }
      });

      // Listen for cart open event (from product page add to cart)
      document.addEventListener('milutin:cart:open', () => this.open());

      // Cart icon click
      document.querySelectorAll('[data-cart-toggle]').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.open();
        });
      });

      // Drawer quantity and remove buttons
      this.setupDrawerControls();
    }

    isOpen() {
      return this.drawer.getAttribute('aria-hidden') === 'false';
    }

    open() {
      this.drawer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('cart-drawer-open');

      // Focus close button
      this.closeBtn?.focus();

      // Refresh cart content
      this.refresh();
    }

    close() {
      this.drawer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('cart-drawer-open');
    }

    setupDrawerControls() {
      // Quantity minus
      this.drawer.addEventListener('click', async (e) => {
        const minusBtn = e.target.closest('[data-drawer-quantity-minus]');
        if (minusBtn) {
          const lineKey = minusBtn.getAttribute('data-line-key');
          const item = minusBtn.closest('[data-cart-drawer-item]');
          const valueEl = item?.querySelector('[data-drawer-quantity-value]');
          const currentQty = parseInt(valueEl?.textContent) || 1;

          if (currentQty > 1) {
            await this.updateItem(lineKey, currentQty - 1);
          } else {
            await this.removeItem(lineKey);
          }
        }
      });

      // Quantity plus
      this.drawer.addEventListener('click', async (e) => {
        const plusBtn = e.target.closest('[data-drawer-quantity-plus]');
        if (plusBtn) {
          const lineKey = plusBtn.getAttribute('data-line-key');
          const item = plusBtn.closest('[data-cart-drawer-item]');
          const valueEl = item?.querySelector('[data-drawer-quantity-value]');
          const currentQty = parseInt(valueEl?.textContent) || 1;

          await this.updateItem(lineKey, currentQty + 1);
        }
      });

      // Remove item
      this.drawer.addEventListener('click', async (e) => {
        const removeBtn = e.target.closest('[data-drawer-remove-item]');
        if (removeBtn) {
          const lineKey = removeBtn.getAttribute('data-line-key');
          await this.removeItem(lineKey);
        }
      });
    }

    async updateItem(lineKey, quantity) {
      this.setLoading(true);

      try {
        const response = await fetch('/cart/change.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: lineKey,
            quantity: quantity
          })
        });

        if (response.ok) {
          await this.refresh();
          this.updateHeaderCount();
        }
      } catch (error) {
        console.error('Error updating cart:', error);
      } finally {
        this.setLoading(false);
      }
    }

    async removeItem(lineKey) {
      await this.updateItem(lineKey, 0);
    }

    async refresh() {
      try {
        const response = await fetch('/?section_id=cart-drawer-content');
        const html = await response.text();

        // Parse and update content
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // For now, just refresh the whole page section or fetch cart data
        const cartResponse = await fetch('/cart.js');
        const cart = await cartResponse.json();

        this.updateDrawerContent(cart);
      } catch (error) {
        console.error('Error refreshing cart:', error);
      }
    }

    updateDrawerContent(cart) {
      // Update count
      const countEl = this.drawer.querySelector('[data-cart-count-drawer]');
      if (countEl) {
        countEl.textContent = `(${cart.item_count})`;
      }

      // Update subtotal
      const subtotalEl = this.drawer.querySelector('[data-cart-drawer-subtotal]');
      if (subtotalEl) {
        subtotalEl.textContent = this.formatMoney(cart.total_price);
      }

      // If cart is empty, refresh page to show empty state
      if (cart.item_count === 0) {
        location.reload();
      }
    }

    updateHeaderCount() {
      document.querySelectorAll('[data-cart-count]').forEach((el) => {
        fetch('/cart.js')
          .then(response => response.json())
          .then(cart => {
            el.textContent = cart.item_count;
            el.hidden = cart.item_count === 0;
          });
      });
    }

    formatMoney(cents) {
      const amount = (cents / 100).toFixed(2);
      return `${amount} RSD`;
    }

    setLoading(loading) {
      this.drawer.classList.toggle('cart-drawer--loading', loading);
    }
  }

  /**
   * Cart Page
   */
  class CartPage {
    constructor() {
      this.form = document.querySelector('[data-cart-form]');
      if (!this.form) return;

      this.init();
    }

    init() {
      // Quantity buttons
      this.form.querySelectorAll('[data-quantity-minus]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const item = btn.closest('[data-cart-item]');
          const input = item?.querySelector('[data-quantity-input]');
          if (input) {
            const currentValue = parseInt(input.value) || 1;
            if (currentValue > 1) {
              input.value = currentValue - 1;
              this.updateCart(input);
            }
          }
        });
      });

      this.form.querySelectorAll('[data-quantity-plus]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const item = btn.closest('[data-cart-item]');
          const input = item?.querySelector('[data-quantity-input]');
          if (input) {
            const currentValue = parseInt(input.value) || 1;
            input.value = currentValue + 1;
            this.updateCart(input);
          }
        });
      });

      // Quantity input change
      this.form.querySelectorAll('[data-quantity-input]').forEach((input) => {
        input.addEventListener('change', () => {
          const value = parseInt(input.value) || 0;
          input.value = Math.max(0, value);
          this.updateCart(input);
        });
      });

      // Remove buttons
      this.form.querySelectorAll('[data-remove-item]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const lineIndex = btn.getAttribute('data-line-index');
          this.removeItem(lineIndex);
        });
      });
    }

    async updateCart(input) {
      const lineIndex = input.getAttribute('data-line-index');
      const quantity = parseInt(input.value) || 0;

      try {
        const response = await fetch('/cart/change.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            line: lineIndex,
            quantity: quantity
          })
        });

        if (response.ok) {
          // Reload to show updated cart
          location.reload();
        }
      } catch (error) {
        console.error('Error updating cart:', error);
      }
    }

    async removeItem(lineIndex) {
      try {
        const response = await fetch('/cart/change.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            line: lineIndex,
            quantity: 0
          })
        });

        if (response.ok) {
          location.reload();
        }
      } catch (error) {
        console.error('Error removing item:', error);
      }
    }
  }

  /**
   * Initialize
   */
  function init() {
    new CartDrawer();
    new CartPage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
