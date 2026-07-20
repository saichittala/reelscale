// Hardware resource & low-memory detection (targeting <= 2GB devices & low-spec GPUs)
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isLowMemoryHardware = Boolean(
  (navigator.deviceMemory && navigator.deviceMemory <= 2) ||
  (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
);
const isLowEndDevice = isTouchDevice || prefersReducedMotion || isLowMemoryHardware;

if (isLowEndDevice) {
  document.documentElement.classList.add('low-end-device');
}

// Custom cursor (paused when idle or on low-end/touch devices to save RAM/CPU)
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');

if (cursor && ring && !isTouchDevice && !isLowEndDevice) {
  let mx = -100, my = -100, rx = -100, ry = -100;
  let cursorAnimating = false;

  function animateRing() {
    if (document.hidden) {
      cursorAnimating = false;
      return;
    }

    rx += (mx - rx) * 0.15;
    ry += (my - ry) * 0.15;

    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';

    // Sleep when position catches up with mouse to save CPU/GPU cycles
    if (Math.abs(mx - rx) > 0.2 || Math.abs(my - ry) > 0.2) {
      requestAnimationFrame(animateRing);
    } else {
      cursorAnimating = false;
    }
  }

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;

    cursor.style.left = mx + 'px';
    cursor.style.top = my + 'px';

    if (!cursorAnimating && !document.hidden) {
      cursorAnimating = true;
      requestAnimationFrame(animateRing);
    }
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && cursorAnimating) {
      requestAnimationFrame(animateRing);
    }
  });

  // Hover effects
  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => {
      ring.style.width = '0';
      ring.style.height = '0';
    });

    el.addEventListener('mouseleave', () => {
      ring.style.width = '0';
      ring.style.height = '0';
    });
  });
} else if (cursor && ring) {
  cursor.style.display = 'none';
  ring.style.display = 'none';
}

// Scroll reveal
const reveals = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
});

reveals.forEach(el => observer.observe(el));

const header = document.querySelector('header');

window.addEventListener('scroll', () => {
  if (window.scrollY > 10) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
}, { passive: true });

document.addEventListener("DOMContentLoaded", () => {

  const modal = document.getElementById("videoModal");
  const wrapper = document.getElementById("videoWrapper");
  const closeBtn = document.getElementById("closeVideo");

  if (!modal || !wrapper) return;

  // Dynamically populate the 3D Cover Flow Carousel Track
  const initialCards = [
    {
      video: "https://www.instagram.com/p/DYhpQstRCBU/",
      client: "Maitrova",
      stat: "2.4M Views",
      img: "./assets/clients/maitrova.png"
    },
    {
      video: "https://www.instagram.com/p/DFWphKux3dK/",
      client: "Avinash Salon",
      stat: "1.8M Views",
      img: "./assets/clients/avinash-salon.jpg"
    },
    {
      video: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600&auto=format&fit=crop",
      client: "Greenwood Interiors",
      stat: "4.2M Views",
      img: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600&auto=format&fit=crop"
    },
    {
      video: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=600&auto=format&fit=crop",
      client: "Swift Education",
      stat: "850K Views",
      img: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=600&auto=format&fit=crop"
    },
    {
      video: "https://images.unsplash.com/photo-1776518411187-de29b9b1bcc1?q=80&w=600&auto=format&fit=crop",
      client: "StyleCo Fashion",
      stat: "1.2M Views",
      img: "https://images.unsplash.com/photo-1776518411187-de29b9b1bcc1?q=80&w=600&auto=format&fit=crop"
    },
    {
      video: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=600&auto=format&fit=crop",
      client: "SR Interiors",
      stat: "3.1M Views",
      img: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=600&auto=format&fit=crop"
    }
  ];

  const carouselTrack = document.getElementById("carouselTrack");
  if (carouselTrack) {
    carouselTrack.innerHTML = "";
    // Duplicate cards only on high-performance hardware, single set on low-end 2GB devices to maximize speed
    const fullSet = isLowEndDevice ? initialCards : [...initialCards, ...initialCards, ...initialCards];
    fullSet.forEach((cardData, idx) => {
      const cardEl = document.createElement("div");
      cardEl.className = "portfolio-item carousel-card";
      cardEl.setAttribute("data-video", cardData.video);
      cardEl.setAttribute("data-client", cardData.client);
      cardEl.setAttribute("data-stat", cardData.stat);
      cardEl.setAttribute("role", "button");
      cardEl.setAttribute("aria-label", `Play video for ${cardData.client}`);
      cardEl.setAttribute("tabindex", "0");
      cardEl.style.backgroundImage = `url(${cardData.img})`;
      cardEl.innerHTML = `
        <div class="portfolio-play">▶</div>
        <div class="portfolio-overlay">
          <div class="portfolio-client">${cardData.client}</div>
          <div class="portfolio-stat">${cardData.stat}</div>
        </div>
      `;
      carouselTrack.appendChild(cardEl);
    });
  }

  document.querySelectorAll(".portfolio-item").forEach(item => {

    item.addEventListener("click", () => {

      const video = item.getAttribute("data-video");
      const client = item.getAttribute("data-client");
      const stat = item.getAttribute("data-stat");

      if (!video) return;

      // Instagram support
      if (
        video.includes("instagram.com") ||
        video.includes("instagr.am")
      ) {

        wrapper.innerHTML = `
          <div class="video-meta">
            <div class="video-client">${client || ""}</div>
            <div class="video-stat">${stat || ""}</div>
          </div>

          <blockquote
            class="instagram-media"
            data-instgrm-permalink="${video}"
            data-instgrm-version="14"
            style="width:100%; max-width:540px; margin:auto;">
          </blockquote>
        `;

        if (window.instgrm) {
          window.instgrm.Embeds.process();
        }

      } else {

        // YouTube support
        wrapper.innerHTML = `
          <div class="video-meta">
            <div class="video-client">${client || ""}</div>
            <div class="video-stat">${stat || ""}</div>
          </div>

          <iframe 
            src="${video}?autoplay=1&rel=0&modestbranding=1&playsinline=1"
            title="Video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen>
          </iframe>
        `;
      }

      modal.classList.add("active");

    });

  });

  function closeModal() {
    modal.classList.remove("active");
    wrapper.innerHTML = "";
  }

  closeBtn?.addEventListener("click", closeModal);

  modal.querySelector(".video-backdrop")
    ?.addEventListener("click", closeModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
    }
  });

  // 3D Cover Flow Carousel implementation
  const carouselContainer = document.querySelector('.carousel-container');
  if (carouselContainer && carouselTrack) {
    const cards = carouselTrack.querySelectorAll('.carousel-card');
    
    // Size metric helper functions
    const isMobile = () => window.innerWidth <= 768;
    const isTablet = () => window.innerWidth > 768 && window.innerWidth <= 1024;
    const getCardWidth = () => isMobile() ? 180 : isTablet() ? 220 : 280;
    const getGap = () => 32;

    const numCards = cards.length;
    const itemsPerSet = numCards / 3;

    // Scrolling states
    let scrollPos = 0;
    let autoScrollSpeed = 0.8;
    let isPaused = false;
    let isDragging = false;
    let isSnapping = false;
    
    // Drag tracking variables
    let startX = 0;
    let startScrollPos = 0;
    let lastX = 0;
    let dragVelocity = 0;
    let lastDragTime = 0;

    // Animation progress for snapping
    let snapProgress = 0;
    let snapStartPos = 0;
    let snapEndPos = 0;

    // Reduced motion checking
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      autoScrollSpeed = 0;
    }

    // Hover to pause auto-scroll
    carouselContainer.addEventListener('mouseenter', () => {
      if (!isDragging && !isSnapping) isPaused = true;
    });
    carouselContainer.addEventListener('mouseleave', () => {
      if (!isDragging && !isSnapping) isPaused = false;
    });

    // Touch support for pausing
    carouselContainer.addEventListener('touchstart', () => {
      if (!isDragging && !isSnapping) isPaused = true;
    }, { passive: true });

    // Drag / Swipe listeners
    const handleDragStart = (clientX) => {
      isDragging = true;
      isPaused = true;
      isSnapping = false;
      startX = clientX;
      startScrollPos = scrollPos;
      lastX = clientX;
      lastDragTime = Date.now();
      dragVelocity = 0;
    };

    const handleDragMove = (clientX) => {
      if (!isDragging) return;
      const dx = clientX - startX;
      scrollPos = startScrollPos - dx;

      // Track velocity for inertia
      const now = Date.now();
      const dt = now - lastDragTime;
      if (dt > 0) {
        dragVelocity = -(clientX - lastX) / dt;
      }
      lastX = clientX;
      lastDragTime = now;

      // Dynamic wrapping during dragging to prevent boundary jumps
      const cardWidth = getCardWidth();
      const gap = getGap();
      const interval = cardWidth + gap;
      const setWidth = itemsPerSet * interval;

      if (scrollPos < setWidth) {
        scrollPos += setWidth;
        startX -= setWidth;
      } else if (scrollPos >= setWidth * 2) {
        scrollPos -= setWidth;
        startX += setWidth;
      }
    };

    const handleDragEnd = () => {
      if (!isDragging) return;
      isDragging = false;

      // Snapping to closest card
      const cardWidth = getCardWidth();
      const gap = getGap();
      const interval = cardWidth + gap;

      // Apply drag inertia to snap target
      let targetPos = scrollPos + dragVelocity * 80;
      const nearestCardIndex = Math.round(targetPos / interval);
      
      snapStartPos = scrollPos;
      snapEndPos = nearestCardIndex * interval;
      snapProgress = 0;
      isSnapping = true;
      requestAnimationFrame(snapStep);
    };

    // Easing helper: quintic ease out for heavy, premium deceleration
    function easeOutQuint(t) {
      return 1 - Math.pow(1 - t, 5);
    }

    function snapStep() {
      if (!isSnapping) return;
      snapProgress += 0.04; // snap duration ~350ms
      if (snapProgress >= 1) {
        scrollPos = snapEndPos;
        isSnapping = false;
        isPaused = false;
      } else {
        const ease = easeOutQuint(snapProgress);
        scrollPos = snapStartPos + (snapEndPos - snapStartPos) * ease;
        requestAnimationFrame(snapStep);
      }
    }

    // Mouse events
    carouselContainer.addEventListener('mousedown', (e) => {
      e.preventDefault();
      handleDragStart(e.clientX);
    });
    window.addEventListener('mousemove', (e) => {
      handleDragMove(e.clientX);
    });
    window.addEventListener('mouseup', () => {
      handleDragEnd();
    });

    // Touch events
    carouselContainer.addEventListener('touchstart', (e) => {
      handleDragStart(e.touches[0].clientX);
    }, { passive: true });
    carouselContainer.addEventListener('touchmove', (e) => {
      handleDragMove(e.touches[0].clientX);
    }, { passive: true });
    carouselContainer.addEventListener('touchend', () => {
      handleDragEnd();
    });

    // Keyboard navigation (Arrow keys to snap to next/prev card)
    document.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      if (activeEl && activeEl.classList.contains('carousel-card')) {
        const cardWidth = getCardWidth();
        const gap = getGap();
        const interval = cardWidth + gap;
        let nextTarget = scrollPos;

        if (e.key === 'ArrowRight') {
          e.preventDefault();
          const nextIndex = Math.round(scrollPos / interval) + 1;
          nextTarget = nextIndex * interval;
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const prevIndex = Math.round(scrollPos / interval) - 1;
          nextTarget = prevIndex * interval;
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activeEl.click();
          return;
        }

        if (nextTarget !== scrollPos) {
          isSnapping = true;
          snapStartPos = scrollPos;
          snapEndPos = nextTarget;
          snapProgress = 0;
          isPaused = true;
          requestAnimationFrame(snapStep);
        }
      }
    });

    // Viewport & visibility tracking to pause loop when off-screen or tab is hidden
    let isCarouselInView = true;
    let isCarouselLoopRunning = false;

    const carouselObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isCarouselInView = entry.isIntersecting;
        if (isCarouselInView && !isCarouselLoopRunning && !document.hidden) {
          isCarouselLoopRunning = true;
          requestAnimationFrame(updateCarousel);
        }
      });
    }, { threshold: 0.05 });

    carouselObserver.observe(carouselContainer);

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && isCarouselInView && !isCarouselLoopRunning) {
        isCarouselLoopRunning = true;
        requestAnimationFrame(updateCarousel);
      }
    });

    // Main animation loop
    function updateCarousel() {
      if (!isCarouselInView || document.hidden) {
        isCarouselLoopRunning = false;
        return;
      }

      const cardWidth = getCardWidth();
      const gap = getGap();
      const interval = cardWidth + gap;
      const setWidth = itemsPerSet * interval;

      // Auto-scrolling calculation
      if (!isPaused && !isDragging && !isSnapping) {
        scrollPos += autoScrollSpeed;
        if (scrollPos >= setWidth * 2) {
          scrollPos -= setWidth;
        }
      }

      const containerWidth = window.innerWidth;
      const screenCenter = containerWidth / 2;

      // Positioning and 3D transforms
      cards.forEach((card, idx) => {
        const staticLeft = idx * interval;
        const cardCenter = staticLeft - scrollPos + cardWidth / 2;
        const relativeCenter = cardCenter - screenCenter;
        
        let x = relativeCenter / interval; // relative card offset index

        if (prefersReducedMotion || isLowEndDevice) {
          // Flatten layouts and disable expensive 3D filters for low-end / 2GB devices
          const rotateY = isLowEndDevice ? -Math.tanh(x) * 15 : 0;
          const scale = 1 - Math.abs(x) * 0.04;
          card.style.transform = `translateX(${relativeCenter}px) rotateY(${rotateY}deg) scale(${scale})`;
          card.style.opacity = Math.abs(x) > 3.8 ? '0' : '1';
          card.style.filter = 'none';
          card.style.zIndex = Math.round(100 - Math.abs(x) * 10);
          return;
        }

        // Bending Spoons cylindrical perspective math
        const rotateY = -Math.tanh(x) * 35; // smooth flat center and tilted sides
        const zTranslate = -Math.pow(Math.abs(x), 1.2) * 140; // exponential push-back
        const translateX = relativeCenter - Math.sign(x) * (1 - Math.exp(-Math.abs(x))) * 60; // card overlap
        const translateY = Math.pow(Math.abs(x), 1.8) * 16; // curved arc alignment
        const scale = 1 - Math.abs(x) * 0.04; // progressive scale down
        const opacity = 1 - Math.max(0, (Math.abs(x) - 3.8) * 0.25); // edge fading
        const blur = Math.max(0, (Math.abs(x) - 2.2) * 2.2); // edge blurring

        card.style.transform = `translateX(${translateX}px) translateY(${translateY}px) translateZ(${zTranslate}px) rotateY(${rotateY}deg) scale(${scale})`;
        card.style.opacity = opacity;
        card.style.filter = blur > 0.1 ? `blur(${blur}px)` : 'none';
        card.style.zIndex = Math.round(100 - Math.abs(x) * 10);
      });

      isCarouselLoopRunning = true;
      requestAnimationFrame(updateCarousel);
    }

    if (isCarouselInView && !document.hidden) {
      isCarouselLoopRunning = true;
      requestAnimationFrame(updateCarousel);
    }
  }

  // FAQ Accordion interaction & ARIA state management
  const faqQuestions = document.querySelectorAll(".faq-question");
  faqQuestions.forEach((btn) => {
    btn.setAttribute("aria-expanded", "false");
    btn.addEventListener("click", () => {
      const item = btn.parentElement;
      if (!item) return;
      const answer = item.querySelector(".faq-answer");
      if (!answer) return;
      const isActive = item.classList.contains("active");

      // Close all other FAQ items for a clean single-open accordion
      document.querySelectorAll(".faq-item").forEach((other) => {
        if (other !== item) {
          other.classList.remove("active");
          const otherBtn = other.querySelector(".faq-question");
          if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
          const otherAns = other.querySelector(".faq-answer");
          if (otherAns) otherAns.style.maxHeight = "0px";
        }
      });

      if (isActive) {
        item.classList.remove("active");
        btn.setAttribute("aria-expanded", "false");
        answer.style.maxHeight = "0px";
      } else {
        item.classList.add("active");
        btn.setAttribute("aria-expanded", "true");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });

});