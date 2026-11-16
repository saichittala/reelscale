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
  posterSrc?: string;
}

const COVERFLOW_CARDS: CoverFlowCard[] = [
  {
    videoSrc: "/assets/clients/avinash-salon.mp4",
    posterSrc: "/assets/clients/avinash-salon.webp",
    client: "Salons",
    stat: "2x Leads in 24hrs",
    video: "https://www.instagram.com/reels/DY3bF7xPJ5_/",
  },
  {
    videoSrc: "/assets/clients/maitrova.mp4",
    posterSrc: "/assets/clients/maitrova.webp",
    client: "CLOTHING",
    stat: "2.4M Views",
    video: "https://www.instagram.com/p/DYhpQstRCBU/",
  },
  {
    videoSrc: "/assets/clients/parthu.mp4",
    posterSrc: "/assets/clients/parthu.webp",
    client: "Interiors",
    stat: "1.2M Organic Reach",
    video: "https://drive.google.com/file/d/1yD3ofnBBHKVUkblmLgTm8qYk0A82hK61/view?usp=sharing",
  },
  {
    videoSrc: "/assets/clients/jak-interiors.mp4",
    posterSrc: "/assets/clients/jak-interiors.webp",
    client: "Interiors",
    stat: "4.2x Engagement Lift",
    video: "https://www.youtube.com/embed/ziM_K-n6svk",
  },
  {
    videoSrc: "/assets/clients/mk-fashions.mp4",
    posterSrc: "/assets/clients/mk-fashions.webp",
    client: "Clothing",
    stat: "3.8x Conversion",
    video: "/assets/clients/mk-fashion.mp4",
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

  pauseOnHover: false,       // Pause rotation when hovering
  resumeDelay: 0,           // Delay before resuming rotation after hover (milliseconds)
  pauseEaseDuration: 0.5,   // Duration for easing in/out of pause (seconds)

  entranceAnimation: 'fadeUp',  // 'fadeIn', 'fadeUp', or 'none'
  entranceDuration: 2.2,        // Duration of entrance animation (seconds)
  entranceStagger: 0.05,        // Stagger time between slide animations (seconds)
  entranceDistance: 160         // Distance for fadeUp animation (pixels)
} as const;

export default function LandingInteractions() {
  const pathname = usePathname();

  useEffect(() => {
    let isMounted = true;
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    const isMobileWidth = window.innerWidth <= 900 || window.matchMedia("(max-width: 900px)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = navigator as any;
    const isLowMemoryHardware = Boolean(
      (nav.deviceMemory && nav.deviceMemory <= 4) ||
      (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4)
    );
    const isDataSaver = Boolean(nav.connection?.saveData || nav.connection?.effectiveType === "2g" || nav.connection?.effectiveType === "3g");
    const isLowEndDevice = prefersReducedMotion || isLowMemoryHardware || isMobileWidth || isTouchDevice || isDataSaver;

    if (isLowEndDevice) {
      document.documentElement.classList.add("low-end-device");
    } else {
      document.documentElement.classList.remove("low-end-device");
    }

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
      } else if (videoUrl.toLowerCase().endsWith(".mp4")) {
        wrapper.innerHTML = `
          <div class="video-meta">
            <div class="video-client">${clientName}</div>
            <div class="video-stat">${statText}</div>
          </div>
          <video src="${videoUrl}" autoplay controls loop playsinline style="width:100%; max-height:80vh; border-radius:12px; outline:none; background:#000;"></video>
        `;
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
      if (!isMounted || !carouselEl || !stageEl || !ringEl) return;

      // ── Low-End / Mobile Mode: Ultra-smooth, zero-jank native horizontal snap-scroll ──
      if (isLowEndDevice) {
        ringEl.innerHTML = "";
        COVERFLOW_CARDS.forEach((data) => {
          const slide = document.createElement("div");
          slide.className = "ls-curved-carousel__slide";
          slide.setAttribute("data-video", data.video || "");
          slide.setAttribute("data-client", data.client);
          slide.setAttribute("data-stat", data.stat);
          slide.setAttribute("role", "button");
          slide.setAttribute("tabindex", "0");
          slide.setAttribute("aria-label", `Watch ${data.client} reel`);

          const imgSrc = data.posterSrc || data.videoSrc;
          slide.innerHTML = `
            <img src="${imgSrc}" alt="${data.client}" loading="lazy" draggable="false" class="ls-curved-carousel__media" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; border-radius:inherit; transform:translateZ(0);" />
            <div class="ls-curved-carousel__play-badge" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </div>
            <div class="ls-curved-carousel__label" style="z-index:2;">
              <span class="ls-curved-carousel__client">${data.client}</span>
            </div>
          `;
          ringEl.appendChild(slide);

          const handleOpen = () => {
            const video = slide.getAttribute("data-video");
            const client = slide.getAttribute("data-client") || "";
            const stat = slide.getAttribute("data-stat") || "";
            if (video) {
              openVideo(video, client, stat);
            }
          };

          slide.addEventListener("click", handleOpen);
          slide.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleOpen();
            }
          });
        });
        return;
      }

      if (typeof gsap === "undefined") return;

      // ── High-End Desktop 3D Cylinder Mode: Optimized single-video decoder pipeline ──
      const slidesInRing = carouselConfig.slidesInRing;
      const slideSpacing = carouselConfig.slideSpacing;
      const radius = carouselConfig.radius;
      const slideHeight = carouselConfig.slideHeight;

      // 1. Populate original slides with lightweight WebP posters
      ringEl.innerHTML = "";
      COVERFLOW_CARDS.forEach((data) => {
        const slide = document.createElement("div");
        slide.className = "ls-curved-carousel__slide";
        slide.setAttribute("data-video", data.video || "");
        slide.setAttribute("data-videosrc", data.videoSrc || "");
        slide.setAttribute("data-client", data.client);
        slide.setAttribute("data-stat", data.stat);
        slide.setAttribute("role", "button");
        slide.setAttribute("tabindex", "0");
        slide.setAttribute("aria-label", `Play video for ${data.client}`);

        const poster = data.posterSrc || "";
        slide.innerHTML = `
          <img src="${poster}" alt="${data.client}" draggable="false" class="ls-curved-carousel__media ls-curved-carousel__poster" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; border-radius:inherit; z-index:0; transform:translateZ(0);" />
          <div class="ls-curved-carousel__video-container" style="position:absolute; inset:0; width:100%; height:100%; border-radius:inherit; z-index:1; overflow:hidden;"></div>
          <div class="ls-curved-carousel__label" style="z-index:2;">
            <span class="ls-curved-carousel__client">${data.client}</span>
          </div>
        `;
        ringEl.appendChild(slide);
      });

      // 2. Duplicate slides to create full cylinder ring
      let currentSlides = ringEl.querySelectorAll(".ls-curved-carousel__slide");
      let originalCount = currentSlides.length;

      if (originalCount < slidesInRing) {
        const countNeeded = slidesInRing - originalCount;
        for (let i = 0; i < countNeeded; i++) {
          const clone = currentSlides[i % originalCount].cloneNode(true) as HTMLElement;
          ringEl.appendChild(clone);
        }
      }

      const slides = ringEl.querySelectorAll(".ls-curved-carousel__slide") as NodeListOf<HTMLElement>;

      // Calculate angle per slide for even circular distribution
      const anglePerSlide = 360 / slidesInRing;
      const arcLength = (anglePerSlide - slideSpacing) * (Math.PI / 180) * radius;
      const slideWidth = arcLength;

      stageEl.style.width = `${slideWidth}px`;
      stageEl.style.height = `${slideHeight}px`;

      // Set up auto-rotation state
      let autoRotate = carouselConfig.autoRotate;
      let targetRotationSpeed = carouselConfig.rotationSpeed;
      let currentRotationSpeed = 0;
      let rotationDirection = carouselConfig.rotationDirection;
      let autoRotateTimeout: any = null;
      let lastUpdateTime = performance.now();
      let lastVideoCheckTime = 0;
      let currentRotation = carouselConfig.initialRotation;
      let updateRotationFunction: any = null;
      let speedTween: any = null;
      let speedController = { value: 0 };
      let currentActiveVideoSlide: HTMLElement | null = null;

      // Position slides in cylinder
      gsap.set(ringEl, { rotationY: carouselConfig.initialRotation });

      slides.forEach((slide, index) => {
        slide.style.width = `${slideWidth}px`;
        slide.style.height = `${slideHeight}px`;

        gsap.set(slide, {
          rotateY: index * -anglePerSlide,
          transformOrigin: `50% 50% ${radius}px`,
          z: -radius,
          backfaceVisibility: "hidden"
        });

        const handleOpen = () => {
          const video = slide.getAttribute("data-video");
          const client = slide.getAttribute("data-client") || "";
          const stat = slide.getAttribute("data-stat") || "";
          if (video) {
            openVideo(video, client, stat);
          }
        };

        slide.addEventListener("click", handleOpen);
        slide.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleOpen();
          }
        });
      });

      // Video Manager: Decodes and plays ONLY the single front-facing card (drops GPU usage by 95%)
      function manageActiveVideo(ringRotation: number) {
        if (document.hidden) return;

        let bestSlide: HTMLElement | null = null;
        let minAngle = 999;

        slides.forEach((slide, index) => {
          const slideRotateY = index * -anglePerSlide;
          let angle = (ringRotation + slideRotateY) % 360;
          if (angle < -180) angle += 360;
          if (angle > 180) angle -= 360;

          const absAngle = Math.abs(angle);
          if (absAngle < minAngle) {
            minAngle = absAngle;
            bestSlide = slide;
          }
        });

        // Only activate video if slide is facing the user (within 35 degrees)
        if (minAngle > 35) {
          bestSlide = null;
        }

        if (bestSlide !== currentActiveVideoSlide) {
          // Pause previous active video
          if (currentActiveVideoSlide) {
            const prevVid = currentActiveVideoSlide.querySelector("video") as HTMLVideoElement | null;
            if (prevVid) {
              prevVid.pause();
              prevVid.style.opacity = "0";
            }
          }

          currentActiveVideoSlide = bestSlide;

          // Play new active front video
          if (bestSlide) {
            const targetSlide = bestSlide as HTMLElement;
            let vid = targetSlide.querySelector("video") as HTMLVideoElement | null;
            const videoSrc = targetSlide.getAttribute("data-videosrc");

            if (!vid && videoSrc) {
              const container = targetSlide.querySelector(".ls-curved-carousel__video-container");
              if (container) {
                vid = document.createElement("video");
                vid.src = videoSrc;
                vid.loop = true;
                vid.muted = true;
                vid.defaultMuted = true;
                vid.playsInline = true;
                vid.setAttribute("muted", "");
                vid.setAttribute("playsinline", "");
                vid.setAttribute("loop", "");
                vid.preload = "auto";
                vid.className = "ls-curved-carousel__media ls-curved-carousel__video";
                vid.style.cssText = "position:absolute; inset:0; width:100%; height:100%; object-fit:cover; border-radius:inherit; opacity:0; transition:opacity 0.4s ease; z-index:1; transform:translateZ(0); pointer-events:none;";
                container.appendChild(vid);
              }
            }

            if (vid) {
              vid.muted = true;
              const p = vid.play();
              if (p !== undefined) {
                p.then(() => {
                  if (vid) vid.style.opacity = "1";
                }).catch(() => {});
              }
            }
          }
        }
      }

      // Initial check for starting rotation
      manageActiveVideo(carouselConfig.initialRotation);

      // Entrance animation
      const gsapInstance = (window as any).gsap;
      const ScrollTriggerInstance = (window as any).ScrollTrigger;

      if (ScrollTriggerInstance && gsapInstance) {
        gsapInstance.registerPlugin(ScrollTriggerInstance);

        const triggerAnim = gsapInstance.fromTo(carouselEl,
          {
            y: 120,
            opacity: 0,
          },
          {
            y: 0,
            opacity: 1,
            duration: 2.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: carouselEl,
              start: "top 85%",
              toggleActions: "play none none none"
            }
          }
        );

        cleanupFns.push(() => {
          if (triggerAnim.scrollTrigger) {
            triggerAnim.scrollTrigger.kill();
          }
          triggerAnim.kill();
        });

        startAutoRotation();
      } else {
        startAutoRotation();
      }

      // High-performance rotation ticker (direct transform updates, throttled video checks)
      function updateRotation() {
        currentRotationSpeed = speedController.value;
        if (currentRotationSpeed === 0) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - lastUpdateTime;
        lastUpdateTime = currentTime;

        const rotationAmount = (deltaTime / 16.67) * currentRotationSpeed * rotationDirection;
        currentRotation += rotationAmount;

        // Direct matrix transform with zero tween allocation overhead
        gsap.set(ringEl, { rotationY: currentRotation });

        // Throttle front-video check to run every 250ms rather than every 16ms frame
        if (currentTime - lastVideoCheckTime > 250) {
          lastVideoCheckTime = currentTime;
          manageActiveVideo(currentRotation);
        }
      }

      function startAutoRotation() {
        if (!autoRotate) return;
        lastUpdateTime = performance.now();
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

        if (currentActiveVideoSlide) {
          const vid = currentActiveVideoSlide.querySelector("video") as HTMLVideoElement | null;
          if (vid && vid.paused) {
            vid.play().catch(() => {});
          }
        }
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
            if (currentActiveVideoSlide) {
              const vid = currentActiveVideoSlide.querySelector("video") as HTMLVideoElement | null;
              if (vid) vid.pause();
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

      // Viewport & visibility observers: Sleep ticker and active video when offscreen
      const carouselViewportObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) {
            stopAutoRotation();
          } else if (!document.hidden && carouselConfig.autoRotate) {
            startAutoRotation();
          }
        });
      }, { threshold: 0.05 });

      carouselViewportObserver.observe(carouselEl);

      const onVisibilityChange = () => {
        if (document.hidden) {
          stopAutoRotation();
        } else if (carouselConfig.autoRotate) {
          startAutoRotation();
        }
      };

      document.addEventListener("visibilitychange", onVisibilityChange);

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

        cleanupFns.push(() => {
          carouselEl.removeEventListener("mouseenter", onMouseEnter);
          carouselEl.removeEventListener("mouseleave", onMouseLeave);
        });
      }

      cleanupFns.push(() => {
        carouselViewportObserver.disconnect();
        document.removeEventListener("visibilitychange", onVisibilityChange);
        if (updateRotationFunction) {
          gsap.ticker.remove(updateRotationFunction);
        }
        if (autoRotateTimeout) clearTimeout(autoRotateTimeout);
        if (speedTween) speedTween.kill();
        if (currentActiveVideoSlide) {
          const vid = currentActiveVideoSlide.querySelector("video") as HTMLVideoElement | null;
          if (vid) vid.pause();
        }
      });
    };

    const loadScript = (src: string) => {
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject();
        document.body.appendChild(script);
        cleanupFns.push(() => {
          if (script.parentNode) {
            script.parentNode.removeChild(script);
          }
        });
      });
    };

    if (isLowEndDevice) {
      // Instant execution: bypass GSAP & ScrollTrigger dynamic CDN downloads entirely
      runCarousel();
    } else if (typeof (window as any).gsap !== "undefined") {
      if (typeof (window as any).ScrollTrigger !== "undefined") {
        runCarousel();
      } else {
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.6.1/ScrollTrigger.min.js")
          .then(() => {
            if (isMounted) runCarousel();
          })
          .catch((err) => {
            console.error("Error loading ScrollTrigger:", err);
            if (isMounted) runCarousel();
          });
      }
    } else {
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.6.1/gsap.min.js")
        .then(() => loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.6.1/ScrollTrigger.min.js"))
        .then(() => {
          if (isMounted) runCarousel();
        })
        .catch((err) => {
          console.error("Error loading GSAP scripts:", err);
          if (isMounted) runCarousel();
        });
    }

    /* ═══════════════════════════════════════════════════
       2. CUSTOM CURSOR (Active only on Desktop mouse devices)
       ═══════════════════════════════════════════════════ */
    const cursor = document.getElementById("cursor");
    const ring = document.getElementById("cursorRing");
    const header = document.querySelector("header");
    let mx = -100;
    let my = -100;
    let rx = -100;
    let ry = -100;
    let frame = 0;
    let cursorAnimating = false;

    const onCursorMove = (event: MouseEvent) => {
      mx = event.clientX;
      my = event.clientY;
      if (cursor) {
        cursor.style.left = `${mx}px`;
        cursor.style.top = `${my}px`;
      }
      if (!cursorAnimating && !document.hidden && ring && !isLowEndDevice) {
        cursorAnimating = true;
        frame = requestAnimationFrame(animateRing);
      }
    };

    const animateRing = () => {
      if (document.hidden) {
        cursorAnimating = false;
        return;
      }
      rx += (mx - rx) * 0.15;
      ry += (my - ry) * 0.15;
      if (ring) {
        ring.style.left = `${rx}px`;
        ring.style.top = `${ry}px`;
      }

      if (Math.abs(mx - rx) > 0.2 || Math.abs(my - ry) > 0.2) {
        frame = requestAnimationFrame(animateRing);
      } else {
        cursorAnimating = false;
      }
    };

    const onScroll = () => {
      header?.classList.toggle("scrolled", window.scrollY > 10);
    };

    onScroll();

    const isCursorVisible = Boolean(cursor && ring && window.getComputedStyle(cursor).display !== "none");
    if (!isTouchDevice && !isLowEndDevice && isCursorVisible) {
      document.addEventListener("mousemove", onCursorMove, { passive: true });
    } else if (cursor && ring) {
      cursor.style.display = "none";
      ring.style.display = "none";
    }

    window.addEventListener("scroll", onScroll, { passive: true });

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
            const otherBtn = otherItem.querySelector(".faq-question");
            if (otherBtn) otherBtn.setAttribute("aria-expanded", "false");
            const otherAnswer = otherItem.querySelector(".faq-answer") as HTMLElement;
            if (otherAnswer) otherAnswer.style.maxHeight = "0px";
          }
        });

        if (isActive) {
          item.classList.remove("active");
          btn.setAttribute("aria-expanded", "false");
          answer.style.maxHeight = "0px";
        } else {
          item.classList.add("active");
          btn.setAttribute("aria-expanded", "true");
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
       6. TESTIMONIALS EXPAND/COLLAPSE (Show More/Less)
       ═══════════════════════════════════════════════════ */
    const initTestimonials = () => {
      document.querySelectorAll(".testi-card").forEach((card) => {
        let quote = card.querySelector(".testi-quote") as HTMLElement | null;
        if (!quote) return;

        // Cache current expansion state
        const isExpanded = card.classList.contains("expanded");

        // Clean up previous toggle button if re-running
        card.querySelector(".testi-toggle-btn")?.remove();

        // Unwrap if previously wrapped, to get clean measurements
        const existingWrapper = card.querySelector(".testi-quote-wrapper");
        if (existingWrapper) {
          existingWrapper.parentNode?.insertBefore(quote, existingWrapper);
          existingWrapper.remove();
        }

        // Temporarily remove classes to measure original clamp height accurately
        card.classList.remove("expanded", "has-toggle");

        // Check if the content actually overflows 4 lines
        const hasOverflow = quote.scrollHeight > quote.clientHeight;

        if (hasOverflow) {
          card.classList.add("has-toggle");
          if (isExpanded) {
            card.classList.add("expanded");
          }

          // Create the wrapper
          const wrapper = document.createElement("div");
          wrapper.className = "testi-quote-wrapper";
          quote.parentNode?.insertBefore(wrapper, quote);
          wrapper.appendChild(quote);

          const btn = document.createElement("button");
          btn.className = "testi-toggle-btn";
          btn.setAttribute("aria-label", isExpanded ? "show less testimonial content" : "show more testimonial content");
          btn.innerHTML = `
            <span class="btn-text">${isExpanded ? "show less" : "show more"}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          `;

          wrapper.appendChild(btn);

          btn.addEventListener("click", () => {
            const nowExpanded = card.classList.toggle("expanded");
            const textEl = btn.querySelector(".btn-text");
            if (textEl) {
              textEl.textContent = nowExpanded ? "show less" : "show more";
            }
            btn.setAttribute("aria-label", nowExpanded ? "show less testimonial content" : "show more testimonial content");
          });
        } else {
          card.classList.remove("expanded");
        }
      });
    };

    // Defer initialization slightly to let styles render and layout compute
    const testimonialTimeout = setTimeout(initTestimonials, 200);

    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
    const onMobileMenuClick = () => {
      document.body.classList.toggle("mobile-menu-open");
    };
    mobileMenuBtn?.addEventListener("click", onMobileMenuClick);

    // Close mobile menu on link clicks
    const menuLinks = document.querySelectorAll("#nav-links a");
    const onMenuLinkClick = () => {
      document.body.classList.remove("mobile-menu-open");
    };
    menuLinks.forEach((link) => {
      link.addEventListener("click", onMenuLinkClick);
    });

    cleanupFns.push(() => {
      mobileMenuBtn?.removeEventListener("click", onMobileMenuClick);
      menuLinks.forEach((link) => {
        link.removeEventListener("click", onMenuLinkClick);
      });
    });

    // Re-evaluate on window resize
    window.addEventListener("resize", initTestimonials);

    // Highlight Active Nav & Footer Links
    const activePath = window.location.pathname;
    const navLinks = document.querySelectorAll("header nav a, footer nav a, .footer-nav a");
    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      const isHome = activePath === "/" || activePath === "";
      const isMatch = isHome
        ? (href === "/" || href === "")
        : (href && href !== "/" && activePath.startsWith(href));

      if (isMatch) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Push cleanups
    cleanupFns.push(() => {
      clearTimeout(testimonialTimeout);
      window.removeEventListener("resize", initTestimonials);
    });

    /* ═══════════════════════════════════════════════════
       CLEANUP
       ═══════════════════════════════════════════════════ */
    return () => {
      isMounted = false;
      if (frame) cancelAnimationFrame(frame);
      cleanupFns.forEach((fn) => fn());
      observer.disconnect();
      document.removeEventListener("mousemove", onCursorMove);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("keydown", onEscape);
      closeBtn?.removeEventListener("click", closeModal);
      backdrop?.removeEventListener("click", closeModal);
      faqHandlers.forEach(([btn, handler]) => btn.removeEventListener("click", handler));
    };
  }, [pathname]);

  return null;
}
