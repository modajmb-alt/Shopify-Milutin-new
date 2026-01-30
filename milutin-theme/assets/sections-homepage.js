/**
 * Homepage Sections JavaScript
 * Handles scroll animations, parallax, and interactive elements
 */

(function() {
  'use strict';

  /**
   * Scroll Animation Observer
   * Adds .is-visible class when elements enter viewport
   */
  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-animate], [data-animate-fade]');

    if (!animatedElements.length) return;

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    animatedElements.forEach((el) => {
      observer.observe(el);
    });
  }

  /**
   * Parallax Effect
   * Smooth parallax on scroll for elements with [data-parallax]
   */
  function initParallax() {
    const parallaxSections = document.querySelectorAll('[data-parallax]');

    if (!parallaxSections.length) return;

    let ticking = false;

    function updateParallax() {
      parallaxSections.forEach((section) => {
        const media = section.querySelector('.full-width-image__media');
        if (!media) return;

        const rect = section.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Only apply when section is in view
        if (rect.bottom < 0 || rect.top > windowHeight) return;

        // Calculate parallax offset
        const scrollProgress = (windowHeight - rect.top) / (windowHeight + rect.height);
        const translateY = (scrollProgress - 0.5) * 100; // -50 to 50

        media.style.transform = `translateY(${translateY}px)`;
      });

      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    updateParallax();
  }

  /**
   * Video Background Handler
   * Handles external video embeds (YouTube, etc.)
   */
  function initVideoBackgrounds() {
    const videoContainers = document.querySelectorAll('[data-video-background]');

    videoContainers.forEach((container) => {
      const videoUrl = container.dataset.videoUrl;
      if (!videoUrl) return;

      // Extract YouTube ID
      let videoId = null;
      if (videoUrl.includes('youtube.com')) {
        const match = videoUrl.match(/[?&]v=([^&]+)/);
        videoId = match ? match[1] : null;
      } else if (videoUrl.includes('youtu.be')) {
        const match = videoUrl.match(/youtu\.be\/([^?]+)/);
        videoId = match ? match[1] : null;
      }

      if (videoId) {
        // Create YouTube embed
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1`;
        iframe.allow = 'autoplay; encrypted-media';
        iframe.allowFullscreen = true;
        iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;pointer-events:none;';

        container.appendChild(iframe);
      }
    });
  }

  /**
   * Smooth Scroll for Anchor Links
   */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  /**
   * Hover Effects Enhancement
   * Add magnetic effect to buttons (subtle)
   */
  function initHoverEffects() {
    const buttons = document.querySelectorAll('.btn, .split-images__link, .collection-list__link');

    buttons.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        btn.style.setProperty('--mouse-x', `${x * 0.1}px`);
        btn.style.setProperty('--mouse-y', `${y * 0.1}px`);
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.setProperty('--mouse-x', '0px');
        btn.style.setProperty('--mouse-y', '0px');
      });
    });
  }

  /**
   * Lazy Load Videos
   * Only load videos when they're about to enter viewport
   */
  function initLazyVideos() {
    const videos = document.querySelectorAll('video[data-src]');

    if (!videos.length) return;

    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const video = entry.target;
          const source = video.querySelector('source');

          if (source && source.dataset.src) {
            source.src = source.dataset.src;
            video.load();
            video.play().catch(() => {});
          }

          videoObserver.unobserve(video);
        }
      });
    }, { rootMargin: '200px' });

    videos.forEach((video) => {
      videoObserver.observe(video);
    });
  }

  /**
   * Initialize all homepage functionality
   */
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onReady);
    } else {
      onReady();
    }
  }

  function onReady() {
    initScrollAnimations();
    initParallax();
    initVideoBackgrounds();
    initSmoothScroll();
    initHoverEffects();
    initLazyVideos();

    // Re-init on Shopify section events (for theme editor)
    document.addEventListener('shopify:section:load', () => {
      initScrollAnimations();
      initParallax();
      initVideoBackgrounds();
    });
  }

  init();

})();
