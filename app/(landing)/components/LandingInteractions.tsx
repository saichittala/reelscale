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
    videoSrc: "./assets/clients/avinash-salon.mp4",
    posterSrc: "./assets/clients/avinash-salon.jpg",
    client: "Salons",
    stat: "2x Leads in 24hrs",
    video: "https://www.instagram.com/reels/DY3bF7xPJ5_/",
  },
  {
    videoSrc: "./assets/clients/maitrova.mp4",
    posterSrc: "./assets/clients/maitrova.png",
    client: "CLOTHING",
    stat: "2.4M Views",
    video: "https://www.instagram.com/p/DYhpQstRCBU/",
  },
  {
    videoSrc: "./assets/clients/parthu.mp4",
    posterSrc: "./assets/clients/parthu.png",
    client: "Interiors",
    stat: "1.2M Organic Reach",
    video: "https://drive.google.com/file/d/1yD3ofnBBHKVUkblmLgTm8qYk0A82hK61/view?usp=sharing",
  },
  {
    videoSrc: "./assets/clients/jak-interiors.mp4",
    posterSrc: "./assets/clients/jak-interiors.jpeg",
    client: "Interiors",
    stat: "4.2x Engagement Lift",
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

  entranceAnimation: 'fadeUp',  // 'fadeIn', 'fadeUp', or 'none'
  entranceDuration: 2.2,        // Duration of entrance animation (seconds)
  entranceStagger: 0.05,        // Stagger time between slide animations (seconds)
  entranceDistance: 160         // Distance for fadeUp animation (pixels)
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
            <div class="video-s    const runCarousel = () => {
      if (!carouselEl || !stageEl || !ringEl) return;

      // 1. Populate original slides dynamically
      ringEl.innerHTML = "";
      COVERFLOW_CARDS.forEach((data) => {
        const slide = document.createElement("div");
        slide.className = "ls-curved-carousel__slide";
        slide.setAttribute("data-video", data.video || "");
        slide.setAttribute("data-client", data.client);
        slide.setAttribute("data-stat", data.stat);

        const isVideo = data.videoSrc.toLowerCase().endsWith(".mp4");
        const poster = data.posterSrc || "";

        if (isVideo) {
          slide.innerHTML = `
          < img src = "${poster}" alt = "${data.client}" draggable = "false" class="ls-curved-carousel__media ls-curved-carousel__poster" style = "position:absolute; inset:0; width:100%; height:100%; object-fit:cover; border-radius:inherit; z-index:0;" />
            <video loop muted playsinline autoplay preload="metadata" poster="${poster}" class="ls-curved-carousel__media ls-curved-carousel__video" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; border-radius:inherit; opacity:0; transition:opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1); z-index:1;">
              <source src="${data.videoSrc}" type="video/mp4" />
            </video>
            <div class="ls-curved-carousel__label" style="z-index:2;">
              <span class="ls-curved-carousel__client">${data.client}</span>
            </div>
        `;
        } else {
          slide.innerHTML = `
          < img src = "${data.videoSrc}" alt = "${data.client}" loading = "lazy" draggable = "false" class="ls-curved-carousel__media" style = "position:absolute; inset:0; width:100%; height:100%; object-fit:cover; border-radius:inherit;" />
            <div class="ls-curved-carousel__label" style="z-index:2;">
              <span class="ls-curved-carousel__client">${data.client}</span>
            </div>
        `;
        }
        ringEl.appendChild(slide);
      });

      // 2. Duplicate slides for seamless 360deg ring distribution
      const isMobile = window.innerWidth <= 768;
      const slidesInRing = isMobile ? 11 : carouselConfig.slidesInRing;
      const slideSpacing = isMobile ? 1.5 : carouselConfig.slideSpacing;
      const radius = isMobile ? 380 : carouselConfig.radius;
      const slideHeight = isMobile ? 240 : carouselConfig.slideHeight;

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
      const anglePerSlide = 360 / slidesInRing;
      const arcLength = (anglePerSlide - slideSpacing) * (Math.PI / 180) * radius;
      const slideWidth = arcLength;

      stageEl.style.width = `${ slideWidth } px`;
      stageEl.style.height = `${ slideHeight } px`;

      interface CachedVideoItem {
        video: HTMLVideoElement;
        slideRotateY: number;
        isPlaying: boolean;
      }
      const cachedVideos: CachedVideoItem[] = [];

      slides.forEach((slide, index) => {
        slide.style.width = `${ slideWidth } px`;
        slide.style.height = `${ slideHeight } px`;
        const slideRotateY = index * -anglePerSlide;

        slide.style.transform = `rotateY(${ slideRotateY }deg) translateZ(${ radius }px)`;
        slide.style.transformOrigin = `50 % 50 % 0px`;
        (slide.style as any).backfaceVisibility = "hidden";
        (slide.style as any).webkitBackfaceVisibility = "hidden";

        const vidEl = slide.querySelector("video");
        if (vidEl) {
          vidEl.muted = true;
          vidEl.defaultMuted = true;
          vidEl.playsInline = true;

          const revealVideo = () => { vidEl.style.opacity = "1"; };
          if (vidEl.readyState >= 2) {
            revealVideo();
          } else {
            vidEl.addEventListener("canplay", revealVideo, { once: true });
            vidEl.addEventListener("playing", revealVideo, { once: true });
          }

          cachedVideos.push({
            video: vidEl,
            slideRotateY,
            isPlaying: false
          });
        }

        slide.addEventListener("click", () => {
          const video = slide.getAttribute("data-video");
          const client = slide.getAttribute("data-client") || "";
          const stat = slide.getAttribute("data-stat") || "";
          if (video) {
            openVideo(video, client, stat);
          }
        });
      });

      /* ═══════════════════════════════════════════════════
         3D ROTATION & GPU RAF ANIMATION ENGINE
         ═══════════════════════════════════════════════════ */
      let currentRotation: number = carouselConfig.initialRotation;
      let targetSpeed = carouselConfig.rotationSpeed;
      let isAutoRotating = carouselConfig.autoRotate;
      let isHovered = false;
      let isDragging = false;
      let startX = 0;
      let dragStartRotation = 0;
      let dragVelocity = 0;
      let lastDragX = 0;
      let lastDragTime = 0;
      let animFrameId: number | null = null;
      let lastFrameTime = performance.now();
      let lastVideoCheckRot = -999;
      let isIntersecting = true;

      ringEl.style.transform = `rotateY(${ currentRotation }deg)`;

      function updateVideos(rot: number) {
        cachedVideos.forEach((item) => {
          let angle = (rot + item.slideRotateY) % 360;
          if (angle < -180) angle += 360;
          if (angle > 180) angle -= 360;

          const isFacingFront = Math.abs(angle) < 55;
          if (isFacingFront && !item.isPlaying) {
            item.isPlaying = true;
            item.video.play().catch(() => {});
          } else if (!isFacingFront && item.isPlaying) {
            item.isPlaying = false;
            item.video.pause();
          }
        });
      }

      updateVideos(currentRotation);

      function renderLoop(time: number) {
        if (!isIntersecting || document.hidden) {
          animFrameId = null;
          return;
        }

        const dt = Math.min((time - lastFrameTime) / 1000, 0.05);
        lastFrameTime = time;

        if (isDragging) {
          currentRotation += dragVelocity;
          dragVelocity *= 0.92;
        } else if (isAutoRotating && (!isHovered || !carouselConfig.pauseOnHover)) {
          currentRotation += targetSpeed * carouselConfig.rotationDirection * (dt * 60);
        } else if (Math.abs(dragVelocity) > 0.01) {
          currentRotation += dragVelocity;
          dragVelocity *= 0.92;
        }

        // Direct GPU Transform write - zero DOM reads or layout reflows!
        ringEl!.style.transform = `rotateY(${ currentRotation }deg)`;

        if (Math.abs(currentRotation - lastVideoCheckRot) > 1.5) {
          lastVideoCheckRot = currentRotation;
          updateVideos(currentRotation);
        }

        animFrameId = requestAnimationFrame(renderLoop);
      }

      function startLoop() {
        if (animFrameId === null) {
          lastFrameTime = performance.now();
          animFrameId = requestAnimationFrame(renderLoop);
        }
      }

      function stopLoop() {
        if (animFrameId !== null) {
          cancelAnimationFrame(animFrameId);
          animFrameId = null;
        }
      }

      // Entrance animation setup
      const gsapInstance = (window as any).gsap;
      const ScrollTriggerInstance = (window as any).ScrollTrigger;

      if (ScrollTriggerInstance && gsapInstance) {
        gsapInstance.registerPlugin(ScrollTriggerInstance);

        const triggerAnim = gsapInstance.fromTo(carouselEl,
          {
            y: isMobile ? 80 : 150,
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
      }

      startLoop();

      /* ═══════════════════════════════════════════════════
         INTERACTIVE POINTER & TOUCH MOMENTUM DRAGGING
         ═══════════════════════════════════════════════════ */
      const onPointerDown = (e: PointerEvent) => {
        if (e.button !== 0 && e.pointerType === "mouse") return;
        isDragging = true;
        startX = e.clientX;
        lastDragX = e.clientX;
        lastDragTime = performance.now();
        dragStartRotation = currentRotation;
        dragVelocity = 0;
        carouselEl.style.cursor = "grabbing";
        carouselEl.setPointerCapture(e.pointerId);
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!isDragging) return;
        const now = performance.now();
        const deltaX = e.clientX - startX;
        const currentRot = dragStartRotation + deltaX * 0.25;

        const timeDiff = Math.max(now - lastDragTime, 8);
        dragVelocity = ((e.clientX - lastDragX) / timeDiff) * 3.5;

        lastDragX = e.clientX;
        lastDragTime = now;
        currentRotation = currentRot;

        ringEl.style.transform = `rotateY(${ currentRotation }deg)`;
      };

      const onPointerUp = (e: PointerEvent) => {
        if (!isDragging) return;
        isDragging = false;
        carouselEl.style.cursor = "grab";
        try {
          carouselEl.releasePointerCapture(e.pointerId);
        } catch (_) {}
      };

      carouselEl.style.cursor = "grab";
      carouselEl.addEventListener("pointerdown", onPointerDown, { passive: true });
      carouselEl.addEventListener("pointermove", onPointerMove, { passive: true });
      carouselEl.addEventListener("pointerup", onPointerUp, { passive: true });
      carouselEl.addEventListener("pointercancel", onPointerUp, { passive: true });

      const onMouseEnter = () => { isHovered = true; };
      const onMouseLeave = () => { isHovered = false; };
      carouselEl.addEventListener("mouseenter", onMouseEnter, { passive: true });
      carouselEl.addEventListener("mouseleave", onMouseLeave, { passive: true });

      const viewportObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          isIntersecting = entry.isIntersecting;
          if (isIntersecting) {
            startLoop();
          } else {
            stopLoop();
            cachedVideos.forEach((v) => {
              if (v.isPlaying) {
                v.isPlaying = false;
                v.video.pause();
              }
            });
          }
        });
      }, { threshold: 0.05 });

      viewportObserver.observe(carouselEl);

      const onVisibility = () => {
        if (document.hidden) {
          stopLoop();
          cachedVideos.forEach((v) => {
            if (v.isPlaying) {
              v.isPlaying = false;
              v.video.pause();
            }
          });
        } else if (isIntersecting) {
          startLoop();
        }
      };
      document.addEventListener("visibilitychange", onVisibility);

      cleanupFns.push(() => {
        stopLoop();
        viewportObserver.disconnect();
        document.removeEventListener("visibilitychange", onVisibility);
        carouselEl.removeEventListener("pointerdown", onPointerDown);
        carouselEl.removeEventListener("pointermove", onPointerMove);
        carouselEl.removeEventListener("pointerup", onPointerUp);
        carouselEl.removeEventListener("pointercancel", onPointerUp);
        carouselEl.removeEventListener("mouseenter", onMouseEnter);
        carouselEl.removeEventListener("mouseleave", onMouseLeave);
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

    if (typeof (window as any).gsap !== "undefined") {
      if (typeof (window as any).ScrollTrigger !== "undefined") {
        runCarousel();
      } else {
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.6.1/ScrollTrigger.min.js")
          .then(() => {
            runCarousel();
          })
          .catch((err) => {
            console.error("Error loading ScrollTrigger:", err);
            runCarousel();
          });
      }
    } else {
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.6.1/gsap.min.js")
        .then(() => loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.6.1/ScrollTrigger.min.js"))
        .then(() => {
          runCarousel();
        })
        .catch((err) => {
          console.error("Error loading GSAP scripts:", err);
          runCarousel();
        });
    }

    /* ═══════════════════════════════════════════════════
       2. CUSTOM CURSOR (Paused on Idle / Touch / Low Memory)
       ═══════════════════════════════════════════════════ */
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isLowMemoryHardware = Boolean(
      ((navigator as any).deviceMemory && (navigator as any).deviceMemory <= 2) ||
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
    );
    const isLowEndDevice = isTouchDevice || prefersReducedMotion || isLowMemoryHardware;

    if (isLowEndDevice) {
      document.documentElement.classList.add("low-end-device");
    }

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
        cursor.style.left = `${ mx } px`;
        cursor.style.top = `${ my } px`;
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
        ring.style.left = `${ rx } px`;
        ring.style.top = `${ ry } px`;
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

    if (!isLowEndDevice && cursor && ring) {
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
          answer.style.maxHeight = `${ answer.scrollHeight } px`;
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
      if (frame) cancelAnimationFrame(frame);
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
