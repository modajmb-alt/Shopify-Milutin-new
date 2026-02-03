/**
 * Product Page JavaScript
 * Handles gallery, variants, quantity, and cart functionality
 */

(function() {
  'use strict';

  /**
   * Product Gallery
   */
  class ProductGallery {
    constructor(container) {
      this.container = container;
      if (!this.container) return;

      this.mainGallery = this.container.querySelector('[data-gallery-main]');
      this.thumbs = this.container.querySelector('[data-gallery-thumbs]');
      this.mediaItems = this.container.querySelectorAll('[data-media-id]');
      this.thumbButtons = this.container.querySelectorAll('[data-thumb-id]');

      this.init();
    }

    init() {
      // Thumbnail click
      this.thumbButtons.forEach((thumb) => {
        thumb.addEventListener('click', () => {
          const mediaId = thumb.getAttribute('data-thumb-id');
          this.switchMedia(mediaId);
        });
      });

      // Touch/swipe support for mobile
      this.setupSwipe();
    }

    switchMedia(mediaId) {
      // Update main media
      this.mediaItems.forEach((item) => {
        const isTarget = item.getAttribute('data-media-id') === mediaId;
        item.classList.toggle('is-active', isTarget);
        item.hidden = !isTarget;
      });

      // Update thumbnails
      this.thumbButtons.forEach((thumb) => {
        const isTarget = thumb.getAttribute('data-thumb-id') === mediaId;
        thumb.classList.toggle('is-active', isTarget);
        thumb.setAttribute('aria-current', isTarget ? 'true' : 'false');
      });

      // Scroll active thumb into view
      const activeThumb = this.container.querySelector('.product__media-thumb.is-active');
      if (activeThumb && this.thumbs) {
        activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }

    setupSwipe() {
      if (!this.mainGallery) return;

      let touchStartX = 0;
      let touchEndX = 0;

      this.mainGallery.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      this.mainGallery.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        this.handleSwipe(touchStartX, touchEndX);
      }, { passive: true });
    }

    handleSwipe(startX, endX) {
      const threshold = 50;
      const diff = startX - endX;

      if (Math.abs(diff) < threshold) return;

      const mediaIds = Array.from(this.mediaItems).map(item => item.getAttribute('data-media-id'));
      const activeItem = this.container.querySelector('.product__media-item.is-active');
      const currentIndex = mediaIds.indexOf(activeItem?.getAttribute('data-media-id'));

      if (currentIndex === -1) return;

      let newIndex;
      if (diff > 0) {
        // Swipe left - next
        newIndex = currentIndex + 1 < mediaIds.length ? currentIndex + 1 : 0;
      } else {
        // Swipe right - previous
        newIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : mediaIds.length - 1;
      }

      this.switchMedia(mediaIds[newIndex]);
    }

    // Called when variant changes to show variant-specific media
    updateMedia(variantId, product) {
      if (!product) return;

      const variant = product.variants.find(v => v.id === variantId);
      if (variant && variant.featured_media) {
        this.switchMedia(String(variant.featured_media.id));
      }
    }
  }

  /**
   * Product Form
   */
  class ProductForm {
    constructor(section) {
      this.section = section;
      this.form = section.querySelector('[data-product-form]');
      if (!this.form) return;

      this.productJson = section.querySelector('[data-product-json]');
      this.product = this.productJson ? JSON.parse(this.productJson.textContent) : null;

      this.variantIdInput = this.form.querySelector('[data-variant-id]');
      this.optionInputs = this.form.querySelectorAll('[data-option-input]');
      this.priceContainer = section.querySelector('[data-product-price]');
      this.addToCartBtn = this.form.querySelector('[data-add-to-cart]');
      this.skuContainer = section.querySelector('[data-product-sku]');

      this.gallery = new ProductGallery(section.querySelector('[data-product-gallery]'));

      this.init();
    }

    init() {
      // Option change
      this.optionInputs.forEach((input) => {
        input.addEventListener('change', () => this.onOptionChange());
      });

      // Quantity buttons
      this.setupQuantity();

      // Form submit
      this.form.addEventListener('submit', (e) => this.onSubmit(e));
    }

    onOptionChange() {
      const selectedOptions = this.getSelectedOptions();
      const variant = this.getVariantFromOptions(selectedOptions);

      this.updateVariantId(variant);
      this.updatePrice(variant);
      this.updateAddToCartButton(variant);
      this.updateOptionLabels(selectedOptions);
      this.updateSku(variant);
      this.updateUrl(variant);
      this.updateOptionAvailability(selectedOptions);

      // Update gallery to show variant image
      if (this.gallery && variant) {
        this.gallery.updateMedia(variant.id, this.product);
      }
    }

    getSelectedOptions() {
      const options = [];
      const optionGroups = this.form.querySelectorAll('[data-option-index]');

      optionGroups.forEach((group) => {
        const checked = group.querySelector('input:checked');
        if (checked) {
          options.push(checked.value);
        }
      });

      return options;
    }

    getVariantFromOptions(options) {
      if (!this.product) return null;

      return this.product.variants.find((variant) => {
        return options.every((option, index) => {
          return variant[`option${index + 1}`] === option;
        });
      });
    }

    updateVariantId(variant) {
      if (variant && this.variantIdInput) {
        this.variantIdInput.value = variant.id;
      }
    }

    updatePrice(variant) {
      if (!this.priceContainer || !variant) return;

      let priceHtml = '';

      if (variant.compare_at_price && variant.compare_at_price > variant.price) {
        priceHtml = `
          <span class="product__price-sale">${this.formatMoney(variant.price)}</span>
          <s class="product__price-compare">${this.formatMoney(variant.compare_at_price)}</s>
          <span class="product__price-badge">${window.translations?.sale || 'Sale'}</span>
        `;
      } else {
        priceHtml = `<span class="product__price-regular">${this.formatMoney(variant.price)}</span>`;
      }

      this.priceContainer.innerHTML = priceHtml;
    }

    formatMoney(cents) {
      // Use Shopify's currency format if available, fallback to shop currency
      const amount = (cents / 100).toFixed(2);
      const currency = window.Shopify?.currency?.active || window.shopCurrency || 'RSD';
      return `${amount} ${currency}`;
    }

    updateAddToCartButton(variant) {
      if (!this.addToCartBtn) return;

      if (!variant) {
        this.addToCartBtn.disabled = true;
        this.addToCartBtn.textContent = window.translations?.unavailable || 'Unavailable';
      } else if (!variant.available) {
        this.addToCartBtn.disabled = true;
        this.addToCartBtn.textContent = window.translations?.soldOut || 'Sold Out';
      } else {
        this.addToCartBtn.disabled = false;
        this.addToCartBtn.textContent = window.translations?.addToCart || 'Add to Cart';
      }
    }

    updateOptionLabels(selectedOptions) {
      const optionGroups = this.form.querySelectorAll('[data-option-index]');

      optionGroups.forEach((group, index) => {
        const valueSpan = group.querySelector('[data-option-value]');
        if (valueSpan && selectedOptions[index]) {
          valueSpan.textContent = selectedOptions[index];
        }
      });
    }

    updateSku(variant) {
      if (!this.skuContainer) return;

      if (variant && variant.sku) {
        this.skuContainer.textContent = `SKU: ${variant.sku}`;
        this.skuContainer.hidden = false;
      } else {
        this.skuContainer.hidden = true;
      }
    }

    updateUrl(variant) {
      if (!variant) return;

      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url.toString());
    }

    updateOptionAvailability(selectedOptions) {
      if (!this.product || this.product.options.length < 2) return;

      // For multi-option products, update which options are available
      // based on current selections
      const optionGroups = this.form.querySelectorAll('[data-option-index]');

      optionGroups.forEach((group, groupIndex) => {
        const buttons = group.querySelectorAll('.product__option-button');

        buttons.forEach((button) => {
          const input = button.querySelector('input');
          const value = input.value;

          // Check if this option value results in an available variant
          const testOptions = [...selectedOptions];
          testOptions[groupIndex] = value;

          const matchingVariant = this.product.variants.find((variant) => {
            return testOptions.every((opt, idx) => {
              if (idx === groupIndex) return variant[`option${idx + 1}`] === opt;
              if (idx < groupIndex) return variant[`option${idx + 1}`] === selectedOptions[idx];
              return true;
            });
          });

          const isAvailable = matchingVariant && matchingVariant.available;
          button.classList.toggle('product__option-button--unavailable', !isAvailable);
          input.disabled = !matchingVariant;
        });
      });
    }

    setupQuantity() {
      const minusBtn = this.form.querySelector('[data-quantity-minus]');
      const plusBtn = this.form.querySelector('[data-quantity-plus]');
      const input = this.form.querySelector('[data-quantity-input]');

      if (!minusBtn || !plusBtn || !input) return;

      minusBtn.addEventListener('click', () => {
        const currentValue = parseInt(input.value) || 1;
        if (currentValue > 1) {
          input.value = currentValue - 1;
        }
      });

      plusBtn.addEventListener('click', () => {
        const currentValue = parseInt(input.value) || 1;
        input.value = currentValue + 1;
      });

      input.addEventListener('change', () => {
        const value = parseInt(input.value) || 1;
        input.value = Math.max(1, value);
      });
    }

    async onSubmit(e) {
      e.preventDefault();

      const formData = new FormData(this.form);

      this.addToCartBtn.disabled = true;
      this.addToCartBtn.textContent = window.translations?.adding || 'Adding...';

      try {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (response.ok) {
          // Update cart count in header
          this.updateCartCount();

          // Show success feedback
          this.addToCartBtn.textContent = window.translations?.added || 'Added!';

          // Open cart drawer if available
          document.dispatchEvent(new CustomEvent('milutin:cart:open'));

          setTimeout(() => {
            this.addToCartBtn.disabled = false;
            this.addToCartBtn.textContent = window.translations?.addToCart || 'Add to Cart';
          }, 2000);
        } else {
          throw new Error(data.description || 'Error adding to cart');
        }
      } catch (error) {
        console.error('Add to cart error:', error);
        this.addToCartBtn.textContent = error.message;

        setTimeout(() => {
          this.addToCartBtn.disabled = false;
          this.addToCartBtn.textContent = window.translations?.addToCart || 'Add to Cart';
        }, 3000);
      }
    }

    async updateCartCount() {
      try {
        const response = await fetch('/cart.js');
        const cart = await response.json();

        document.querySelectorAll('[data-cart-count]').forEach((el) => {
          el.textContent = cart.item_count;
          el.hidden = cart.item_count === 0;
        });
      } catch (error) {
        console.error('Error updating cart count:', error);
      }
    }
  }

  /**
   * Image Zoom (on hover)
   */
  class ImageZoom {
    constructor() {
      this.zoomContainers = document.querySelectorAll('[data-zoom-container]');
      this.init();
    }

    init() {
      this.zoomContainers.forEach((container) => {
        const image = container.querySelector('[data-zoom-image]');
        if (!image) return;

        container.addEventListener('mousemove', (e) => this.handleZoom(e, container, image));
        container.addEventListener('mouseleave', () => this.resetZoom(image));
      });
    }

    handleZoom(e, container, image) {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      image.style.transformOrigin = `${x}% ${y}%`;
    }

    resetZoom(image) {
      image.style.transformOrigin = 'center center';
    }
  }

  /**
   * Initialize
   */
  function init() {
    const productSection = document.querySelector('[data-section-id]');
    if (productSection) {
      new ProductForm(productSection);
    }

    new ImageZoom();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
