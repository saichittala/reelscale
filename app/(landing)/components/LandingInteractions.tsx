"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    instgrm?: {
      Embeds?: {
        process?: () => void;
      };
    };
  }
}

declare const gsap: any;

/* ─── Card data for the Cover Flow ─── */
interface CoverFlowCard {
  videoSrc: string;
  client: string;
  stat: string;
  video?: string;
}

const COVERFLOW_CARDS: CoverFlowCard[] = [
  {
    videoSrc: "./assets/clients/avinash-salon.jpg",
    client: "Avinash Salon",
    stat: "2x Leads in 24hrs",
    video: "https://www.instagram.com/reels/DY3bF7xPJ5_/",
  },
  {
    videoSrc: "./assets/clients/maitrova.png",
    client: "Maitrova",
    stat: "2.4M Views",
    video: "https://www.instagram.com/p/DYhpQstRCBU/",
  },
  {
    videoSrc: "https://images.unsplash.com/photo-1776518411187-de29b9b1bcc1?q=80&w=600&auto=format&fit=crop",
    client: "StyleCo Fashion",
    stat: "1.2M Organic Reach",
    video: "https://www.youtube.com/embed/ziM_K-n6svk",
  },
  {
    videoSrc: "https://images.unsplash.com/photo-1776811798099-ff6d61bd6c7c?q=80&w=600&auto=format&fit=crop",
    client: "TechLaunch",
    stat: "4.2x Engagement Lift",
    video: "https://www.youtube.com/embed/ziM_K-n6svk",
  },
  {
    videoSrc: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600&auto=format&fit=crop",
    client: "Greenwood Interiors",
    stat: "4.2M Views Delivered",
    video: "https://www.youtube.com/embed/ziM_K-n6svk",
  },
  {
    videoSrc: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=600&auto=format&fit=crop",
    client: "Swift Education",
    stat: "850k Organic Views",
    video: "https://www.youtube.com/embed/ziM_K-n6svk",
  },
  {
    videoSrc: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=600&auto=format&fit=crop",
    client: "Luxe Studio",
    stat: "1.5M Views Delivered",
    video: "https://www.youtube.com/embed/ziM_K-n6svk",
  },
];


/* ─── 3D Curved Carousel configuration ─── */
const carouselConfig = {
  slideHeight: 700,         // Height of each slide in pixels
  slidesInRing: 13,         // Fewer slides in the ring makes each slide wider/larger!
  slideSpacing: 1.5,        // Spacing between slides in degrees
  
  radius: 1100,             // Radius of the carousel circle (px)
  initialRotation: 180,     // Initial rotation of the carousel (degrees)
  
  autoRotate: true,         // Set to false to disable auto-rotation
  rotationSpeed: 0.07,      // Target speed of rotation (degrees per frame)
  rotationDirection: 1,     // 1 for clockwise, -1 for counter-clockwise
  
  pauseOnHover: true,       // Pause rotation when hovering
  resumeDelay: 0,           // Delay before resuming rotation after hover (milliseconds)
  pauseEaseDuration: 0.5,   // Duration for easing in/out of pause (seconds)
  
  entranceAnimation: 'fadeIn',  // 'fadeIn', 'fadeUp', or 'none'
  entranceDuration: 1.5,        // Duration of entrance animation (seconds)
  entranceStagger: 0.08,        // Stagger time between slide animations (seconds)
  entranceDistance: 100         // Distance for fadeUp animation (pixels)
} as const;

export default function LandingInteractions() {
  const pathname = usePathname();

  useEffect(() => {
    /* ═══════════════════════════════════════════════════
       1. 3D CURVED CAROUSEL ENGINE (GSAP)
       ═══════════════════════════════════════════════════ */
    const carouselEl = document.querySelector(".ls-curved-carousel") as HTMLElement | null;
    const stageEl = document.querySelector(".ls-curved-carousel__stage") as HTMLElement | null;
    const ringEl = document.querySelector(".ls-curved-carousel__ring") as HTMLElement | null;

    // Event handler refs for cleanup
    const cleanupFns: Array<() => void> = [];

    /* ═══════════════════════════════════════════════════
       GENERIC VIDEO MODAL OPENER
       ═══════════════════════════════════════════════════ */
    const modal = document.getElementById("videoModal");
    const wrapper = document.getElementById("videoWrapper");
    const closeBtn = document.getElementById("closeVideo");

    const closeModal = () => {
      modal?.classList.remove("active");
      if (wrapper) wrapper.innerHTML = "";
    };

    const openVideo = (videoUrl: string, clientName: string, statText: string) => {
      if (!modal || !wrapper) return;
      if (videoUrl.includes("instagram.com") || videoUrl.includes("instagr.am")) {
        wrapper.innerHTML = `
          <div class="video-meta">
            <div class="video-client">${clientName}</div>
            <div class="video-stat">${statText}</div>
          </div>
          <blockquote class="instagram-media" data-instgrm-permalink="${videoUrl}" data-instgrm-version="14"
            style="width:100%; max-width:540px; margin:auto;"></blockquote>
        `;
        window.instgrm?.Embeds?.process?.();
      } else {
        wrapper.innerHTML = `
          <div class="video-meta">
            <div class="video-client">${clientName}</div>
            <div class="video-stat">${statText}</div>
          </div>
          <iframe src="${videoUrl}?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="Video player"
            frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        `;
      }
      modal.classList.add("active");
    };

    const runCarousel = () => {
      if (!carouselEl || !stageEl || !ringEl || typeof gsap === "undefined") return;
      const N = COVERFLOW_CARDS.length;

      // 1. Populate original slides dynamically
      ringEl.innerHTML = "";
      COVERFLOW_CARDS.forEach((data) => {
        const slide = document.createElement("div");
        slide.className = "ls-curved-carousel__slide";
        slide.setAttribute("data-video", data.video || "");
        slide.setAttribute("data-client", data.client);
        slide.setAttribute("data-stat", data.stat);

        const isVideo = data.videoSrc.toLowerCase().endsWith(".mp4");
        if (isVideo) {
          slide.innerHTML = `
            <video autoplay loop muted playsinline preload="metadata" class="ls-curved-carousel__media">
              <source src="${data.videoSrc}" type="video/mp4" />
            </video>
            <div class="ls-curved-carousel__label">
              <span class="ls-curved-carousel__client">${data.client}</span>
            </div>
          `;
        } else {
          slide.innerHTML = `
            <img src="${data.videoSrc}" alt="${data.client}" loading="lazy" draggable="false" class="ls-curved-carousel__media" />
            <div class="ls-curved-carousel__label">
              <span class="ls-curved-carousel__client">${data.client}</span>
            </div>
          `;
        }
        ringEl.appendChild(slide);
      });

      // 2. Duplicate slides if original count is less than slidesInRing
      const slidesInRing = carouselConfig.slidesInRing;
      let currentSlides = ringEl.querySelectorAll(".ls-curved-carousel__slide");
      let originalCount = currentSlides.length;

      if (originalCount < slidesInRing) {
        const countNeeded = slidesInRing - originalCount;
        for (let i = 0; i < countNeeded; i++) {
          const clone = currentSlides[i % originalCount].cloneNode(true) as HTMLElement;
          ringEl.appendChild(clone);
        }
      }

      // Re-fetch all slides after potential duplication
      const slides = ringEl.querySelectorAll(".ls-curved-carousel__slide") as NodeListOf<HTMLElement>;
      const slideCount = slides.length;

      // Calculate angle per slide for even distribution
      const anglePerSlide = 360 / slidesInRing;

      // Calculate ideal slide width based on arc length
      const arcLength = (anglePerSlide - carouselConfig.slideSpacing) * (Math.PI / 180) * carouselConfig.radius;
      const slideWidth = arcLength;

      // Set stage dimensions
      stageEl.style.width = `${slideWidth}px`;
      stageEl.style.height = `${carouselConfig.slideHeight}px`;

      // Set up auto-rotation state
      let autoRotate = carouselConfig.autoRotate;
      let targetRotationSpeed = carouselConfig.rotationSpeed;
      let currentRotationSpeed = 0;
      let rotationDirection = carouselConfig.rotationDirection;
      let autoRotateTimeout: any = null;
      let lastUpdateTime = Date.now();
      let updateRotationFunction: any = null;
      let speedTween: any = null;

      let speedController = { value: 0 };

      // Initialize the carousel timeline
      const timeline = gsap.timeline();
      timeline.set(ringEl, { rotationY: carouselConfig.initialRotation });

      // Apply calculated dimensions and position all slides in a circle
      slides.forEach((slide, index) => {
        slide.style.width = `${slideWidth}px`;
        slide.style.height = `${carouselConfig.slideHeight}px`;

        gsap.set(slide, {
          rotateY: index * -anglePerSlide,
          transformOrigin: `50% 50% ${carouselConfig.radius}px`,
          z: -carouselConfig.radius,
          backfaceVisibility: 'hidden'
        });

        // Add modal video opener event listener
        slide.addEventListener("click", () => {
          const video = slide.getAttribute("data-video");
          const client = slide.getAttribute("data-client") || "";
          const stat = slide.getAttribute("data-stat") || "";
          if (video) {
            openVideo(video, client, stat);
          }
        });
      });

      // Add entrance animation if enabled
      if ((carouselConfig.entranceAnimation as string) !== 'none') {
        let entranceAnimation: any = {};
        switch (carouselConfig.entranceAnimation as string) {
          case 'fadeIn':
            entranceAnimation = {
              opacity: 0,
              duration: carouselConfig.entranceDuration,
              stagger: carouselConfig.entranceStagger,
              ease: 'power2.out'
            };
            break;
          case 'fadeUp':
            entranceAnimation = {
              y: carouselConfig.entranceDistance,
              opacity: 0,
              duration: carouselConfig.entranceDuration,
              stagger: carouselConfig.entranceStagger,
              ease: 'power3.out'
            };
            break;
        }

        timeline.from(slides, entranceAnimation)
          .add(() => {
            startAutoRotation();
          });
      } else {
        startAutoRotation();
      }

      function updateRotation() {
        currentRotationSpeed = speedController.value;
        if (currentRotationSpeed === 0) return;

        const currentTime = Date.now();
        const deltaTime = currentTime - lastUpdateTime;
        lastUpdateTime = currentTime;

        const rotationAmount = (deltaTime / 16.67) * currentRotationSpeed * rotationDirection;

        gsap.to(ringEl, {
          rotationY: `+=${rotationAmount}`,
          duration: 0,
          overwrite: true
        });
      }

      function startAutoRotation() {
        if (!autoRotate) return;
        lastUpdateTime = Date.now();
        updateRotationFunction = updateRotation;
        gsap.ticker.add(updateRotationFunction);

        if (speedTween) {
          speedTween.kill();
        }
        speedTween = gsap.to(speedController, {
          value: targetRotationSpeed,
          duration: carouselConfig.pauseEaseDuration,
          ease: 'power1.out'
        });
      }

      function stopAutoRotation() {
        if (speedTween) {
          speedTween.kill();
        }
        speedTween = gsap.to(speedController, {
          value: 0,
          duration: carouselConfig.pauseEaseDuration,
          ease: 'power1.in',
          onComplete: () => {
            if (updateRotationFunction) {
              gsap.ticker.remove(updateRotationFunction);
              updateRotationFunction = null;
            }
          }
        });
      }

      function resumeAutoRotation() {
        if (autoRotateTimeout) clearTimeout(autoRotateTimeout);
        autoRotateTimeout = setTimeout(() => {
          if (carouselConfig.autoRotate) {
            startAutoRotation();
          }
        }, carouselConfig.resumeDelay);
      }

      // Add pause/resume functionality if enabled
      if (carouselConfig.pauseOnHover) {
        const onMouseEnter = () => {
          if (autoRotateTimeout) clearTimeout(autoRotateTimeout);
          stopAutoRotation();
        };

        const onMouseLeave = () => {
          resumeAutoRotation();
        };

        carouselEl.addEventListener("mouseenter", onMouseEnter);
        carouselEl.addEventListener("mouseleave", onMouseLeave);

        carouselEl.addEventListener("touchstart", onMouseEnter, { passive: true });
        carouselEl.addEventListener("touchend", onMouseLeave);

        cleanupFns.push(() => {
          carouselEl.removeEventListener("mouseenter", onMouseEnter);
          carouselEl.removeEventListener("mouseleave", onMouseLeave);
          carouselEl.removeEventListener("touchstart", onMouseEnter);
          carouselEl.removeEventListener("touchend", onMouseLeave);
        });
      }

      cleanupFns.push(() => {
        if (updateRotationFunction) {
          gsap.ticker.remove(updateRotationFunction);
        }
        if (autoRotateTimeout) clearTimeout(autoRotateTimeout);
        if (speedTween) speedTween.kill();
      });
    };

    if (typeof (window as any).gsap !== "undefined") {
      runCarousel();
    } else {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.6.1/gsap.min.js";
      script.onload = () => {
        runCarousel();
      };
      document.body.appendChild(script);
      cleanupFns.push(() => {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      });
    }

    /* ═══════════════════════════════════════════════════
       2. CUSTOM CURSOR
       ═══════════════════════════════════════════════════ */
    const cursor = document.getElementById("cursor");
    const ring = document.getElementById("cursorRing");
    const header = document.querySelector("header");
    let mx = 0;
    let my = 0;
    let rx = 0;
    let ry = 0;
    let frame = 0;

    const onCursorMove = (event: MouseEvent) => {
      mx = event.clientX;
      my = event.clientY;
      if (cursor) {
        cursor.style.left = `${mx}px`;
        cursor.style.top = `${my}px`;
      }
    };

    const animateRing = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      if (ring) {
        ring.style.left = `${rx}px`;
        ring.style.top = `${ry}px`;
      }
      frame = requestAnimationFrame(animateRing);
    };

    const onScroll = () => {
      header?.classList.toggle("scrolled", window.scrollY > 10);
    };

    document.addEventListener("mousemove", onCursorMove);
    window.addEventListener("scroll", onScroll);
    frame = requestAnimationFrame(animateRing);

    /* ═══════════════════════════════════════════════════
       3. SCROLL REVEAL
       ═══════════════════════════════════════════════════ */
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    });
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));



    const portfolioHandlers: Array<[Element, EventListener]> = [];
    document.querySelectorAll(".portfolio-item").forEach((item) => {
      const handler = (() => {
        const video = item.getAttribute("data-video");
        const client = item.getAttribute("data-client") || "";
        const stat = item.getAttribute("data-stat") || "";
        if (video) {
          openVideo(video, client, stat);
        }
      }) as EventListener;
      item.addEventListener("click", handler);
      portfolioHandlers.push([item, handler]);
    });

    /* ═══════════════════════════════════════════════════
       5. FAQ ACCORDION
       ═══════════════════════════════════════════════════ */
    const faqHandlers: Array<[Element, EventListener]> = [];
    document.querySelectorAll(".faq-question").forEach((btn) => {
      const handler = (() => {
        const item = btn.parentElement;
        if (!item) return;
        const answer = item.querySelector(".faq-answer") as HTMLElement;
        if (!answer) return;
        const isActive = item.classList.contains("active");

        // Close all other FAQ items
        document.querySelectorAll(".faq-item").forEach((otherItem) => {
          if (otherItem !== item) {
            otherItem.classList.remove("active");
            const otherAnswer = otherItem.querySelector(".faq-answer") as HTMLElement;
            if (otherAnswer) otherAnswer.style.maxHeight = "0px";
          }
        });

        if (isActive) {
          item.classList.remove("active");
          answer.style.maxHeight = "0px";
        } else {
          item.classList.add("active");
          answer.style.maxHeight = `${answer.scrollHeight}px`;
        }
      }) as EventListener;
      btn.addEventListener("click", handler);
      faqHandlers.push([btn, handler]);
    });

    const backdrop = modal?.querySelector(".video-backdrop");
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };

    closeBtn?.addEventListener("click", closeModal);
    backdrop?.addEventListener("click", closeModal);
    document.addEventListener("keydown", onEscape);

    /* ═══════════════════════════════════════════════════
       CLEANUP
       ═══════════════════════════════════════════════════ */
    return () => {
      cancelAnimationFrame(frame);
      cleanupFns.forEach((fn) => fn());
      observer.disconnect();
      document.removeEventListener("mousemove", onCursorMove);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("keydown", onEscape);
      closeBtn?.removeEventListener("click", closeModal);
      backdrop?.removeEventListener("click", closeModal);
      portfolioHandlers.forEach(([item, handler]) => item.removeEventListener("click", handler));
      faqHandlers.forEach(([btn, handler]) => btn.removeEventListener("click", handler));
    };
  }, [pathname]);

  return null;
}
