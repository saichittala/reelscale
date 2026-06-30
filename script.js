// Custom cursor
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursorRing');

let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX;
  my = e.clientY;

  cursor.style.left = mx + 'px';
  cursor.style.top = my + 'px';
});

function animateRing() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;

  ring.style.left = rx + 'px';
  ring.style.top = ry + 'px';

  requestAnimationFrame(animateRing);
}

animateRing();

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
});

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
    // Duplicate 3 times (18 cards total) to enable infinite wrapping on drag/scroll
    const fullSet = [...initialCards, ...initialCards, ...initialCards];
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

    // Main animation loop
    function updateCarousel() {
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

        if (prefersReducedMotion) {
          // Flatten layouts for reduced motion settings
          card.style.transform = `translateX(${relativeCenter}px) scale(1)`;
          card.style.opacity = Math.abs(x) > 3 ? '0' : '1';
          card.style.filter = 'none';
          card.style.zIndex = '1';
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

      requestAnimationFrame(updateCarousel);
    }

    requestAnimationFrame(updateCarousel);
  }

});