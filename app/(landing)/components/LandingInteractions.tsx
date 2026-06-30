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


/* ─── Tuning constants — Premium Apple 3D Cover Flow ─── */
const CFG = {
  /* 3D Perspective & Layout */
  rotateYMax: 68,         // side cards tilt 60–75 degrees
  translateZBase: -350,    // depth push per card slot (px)
  scaleMin: 0.75,          // side cards scale down to 0.7–0.8
  opacityMin: 0.5,         // side cards opacity 0.4–0.6

  /* Spacing offsets (relative to card width) */
  centerOffsetMultiplier: 1.15, // center card spacing dominance
  sideSpacingMultiplier: 0.38,   // stack density for side cards
  curveYMultiplier: 12,          // parabolic horizontal arc vertical curve (px)

  /* Auto-scroll */
  autoSpeed: 0.002,        // auto-scroll speed (increment per frame)

  /* Drag physics */
  dragSensitivity: 0.0035, // drag responsiveness
  flickDecay: 0.94,        // inertia glide duration

  /* Real spring physics for organic bouncing snap */
  springStiffness: 0.05,   // spring k constant
  springDamping: 0.26,     // spring c damping
} as const;

export default function LandingInteractions() {
  const pathname = usePathname();

  useEffect(() => {
    /* ═══════════════════════════════════════════════════
       1. COVER FLOW ENGINE
       ═══════════════════════════════════════════════════ */
    const stage = document.getElementById("coverflowStage");
    const coverflowEl = document.querySelector(".coverflow") as HTMLElement | null;
    let coverflowFrame = 0;

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

    if (stage && coverflowEl) {
      const N = COVERFLOW_CARDS.length;
      const angleStep = (2 * Math.PI) / N;
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Cover Flow Physics State
      let position = 0;           // current float position index [0, N)
      let targetPosition = 0;     // snap target index
      let velocity = 0;           // speed of position sweep
      let isPaused = false;
      let isDragging = false;
      let isSnapping = false;
      let dragStartX = 0;
      let lastDragX = 0;
      let lastDragTime = 0;
      let wheelTimeout: NodeJS.Timeout | null = null;
      let autoScrollTimer: NodeJS.Timeout | null = null;

      // Create card DOM elements
      const cards: HTMLElement[] = [];
      stage.innerHTML = "";

      COVERFLOW_CARDS.forEach((data, i) => {
        const card = document.createElement("div");
        card.className = "coverflow__card";
        card.setAttribute("role", "group");
        card.setAttribute("aria-roledescription", "slide");
        card.setAttribute("aria-label", `${data.client} — ${data.stat}`);
        card.setAttribute("tabindex", "0");
        card.setAttribute("data-index", String(i));
        if (data.video) {
          card.setAttribute("data-video", data.video);
        }

        const isVideo = data.videoSrc.toLowerCase().endsWith(".mp4");
        if (isVideo) {
          card.innerHTML = `
            <video autoplay loop muted playsinline preload="metadata" style="width:100%; height:100%; object-fit:cover; display:block; border-radius:inherit; backface-visibility:hidden;">
              <source src="${data.videoSrc}" type="video/mp4" />
            </video>
            <div class="coverflow__label">
              <span class="coverflow__client">${data.client}</span>
              <span class="coverflow__stat">${data.stat}</span>
            </div>
          `;
        } else {
          card.innerHTML = `
            <img src="${data.videoSrc}" alt="${data.client}" loading="lazy" draggable="false" style="width:100%; height:100%; object-fit:cover; display:block; border-radius:inherit; backface-visibility:hidden;" />
            <div class="coverflow__label">
              <span class="coverflow__client">${data.client}</span>
              <span class="coverflow__stat">${data.stat}</span>
            </div>
          `;
        }

        stage.appendChild(card);
        cards.push(card);
      });

      // 1. Create pagination dots
      const paginationEl = document.getElementById("coverflowPagination");
      if (paginationEl) {
        paginationEl.innerHTML = "";
        for (let i = 0; i < N; i++) {
          const dot = document.createElement("button");
          dot.className = "coverflow__dot" + (i === 0 ? " active" : "");
          dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
          dot.addEventListener("click", () => {
            targetPosition = i;
            isSnapping = true;
            isPaused = true;
            stopAutoScroll();
          });
          paginationEl.appendChild(dot);
        }
      }

      const updatePagination = (activeIndex: number) => {
        if (!paginationEl) return;
        const dots = paginationEl.querySelectorAll(".coverflow__dot");
        dots.forEach((dot, idx) => {
          if (idx === activeIndex) {
            dot.classList.add("active");
          } else {
            dot.classList.remove("active");
          }
        });
      };

      // 2. Play/Pause Control
      const playPauseBtn = document.getElementById("coverflowPlayPause");
      const iconPause = playPauseBtn?.querySelector(".icon-pause") as HTMLElement;
      const iconPlay = playPauseBtn?.querySelector(".icon-play") as HTMLElement;
      let isPausedManually = false;

      const togglePlayPause = () => {
        isPausedManually = !isPausedManually;
        if (isPausedManually) {
          isPaused = true;
          stopAutoScroll();
          if (iconPause) iconPause.style.display = "none";
          if (iconPlay) iconPlay.style.display = "block";
        } else {
          isPaused = false;
          startAutoScroll();
          if (iconPause) iconPause.style.display = "block";
          if (iconPlay) iconPlay.style.display = "none";
        }
      };
      playPauseBtn?.addEventListener("click", togglePlayPause);
      cleanupFns.push(() => playPauseBtn?.removeEventListener("click", togglePlayPause));

      // 3. Mute/Unmute Control
      const muteBtn = document.getElementById("coverflowMute");
      const iconUnmute = muteBtn?.querySelector(".icon-unmute") as HTMLElement;
      const iconMute = muteBtn?.querySelector(".icon-mute") as HTMLElement;
      let isMuted = true;

      const toggleMute = () => {
        isMuted = !isMuted;
        const videoElements = stage.querySelectorAll("video");
        videoElements.forEach((vid) => {
          vid.muted = isMuted;
        });

        if (isMuted) {
          if (iconUnmute) iconUnmute.style.display = "none";
          if (iconMute) iconMute.style.display = "block";
        } else {
          if (iconUnmute) iconUnmute.style.display = "block";
          if (iconMute) iconMute.style.display = "none";
        }
      };
      muteBtn?.addEventListener("click", toggleMute);
      cleanupFns.push(() => muteBtn?.removeEventListener("click", toggleMute));

      // Keyframes precisely matching reference spec
      const keyframes = {
        absX:       [0,   1,    2,    3],
        rotateY:    [0,   65,   80,   85],
        translateX: [0,   220,  420,  550],
        translateZ: [180, -180, -420, -700],
        scale:      [1.0, 0.82, 0.62, 0.45],
        opacity:    [1.0, 0.75, 0.35, 0.08]
      };

      const interpolate = (key: 'rotateY' | 'translateX' | 'translateZ' | 'scale' | 'opacity', val: number): number => {
        const arrX = keyframes.absX;
        const arrY = keyframes[key];

        if (val <= arrX[0]) return arrY[0];
        if (val >= arrX[arrX.length - 1]) return arrY[arrY.length - 1];

        for (let i = 0; i < arrX.length - 1; i++) {
          if (val >= arrX[i] && val <= arrX[i + 1]) {
            const t = (val - arrX[i]) / (arrX[i + 1] - arrX[i]);
            // Smooth ease-in-out Hermite curve
            const ease = t * t * (3 - 2 * t);
            return arrY[i] + (arrY[i + 1] - arrY[i]) * ease;
          }
        }
        return arrY[0];
      };

      /* ─── Transform calculation per card — Keyframe Interpolator ─── */
      const layoutCards = () => {
        const vw = window.innerWidth;
        const scaleFactor = Math.min(1.6, Math.max(0.45, vw / 1200));

        for (let i = 0; i < N; i++) {
          let diff = i - position;
          // Wrap diff to [-N/2, N/2] for looping continuity
          diff = ((diff + N / 2) % N + N) % N - N / 2;

          const absX = Math.abs(diff);
          const sign = Math.sign(diff);

          // Get values from keyframes
          const rotateY = -sign * interpolate("rotateY", absX);
          const translateX = sign * interpolate("translateX", absX) * scaleFactor;
          const translateZ = interpolate("translateZ", absX);
          const scale = interpolate("scale", absX);
          const opacity = interpolate("opacity", absX);

          // Parabolic curve: visual wrapping arc around viewer
          const translateY = Math.pow(absX, 1.8) * CFG.curveYMultiplier * scaleFactor;

          // Blur: subtle blur on farther cards
          let blur = 0;
          if (absX > 1.2) {
            blur = Math.min((absX - 1.2) * 1.5, 4.0);
          }

          // Highest z-index for active card
          const zIndex = Math.round(100 - absX * 10);

          // Box shadow: active card gets premium dynamic floating shadow
          const t = Math.min(1.0, absX);
          const shadowOpacity = Math.max(0, (1 - t) - 0.2) * 0.6;
          const shadowBlur = 30 + (1 - t) * 30;
          const shadowY = 10 + (1 - t) * 20;
          const shadow = `0 ${shadowY}px ${shadowBlur}px -8px rgba(0,0,0,${shadowOpacity.toFixed(2)})`;

          const card = cards[i];

          if (prefersReducedMotion) {
            card.style.transform = `translateX(${translateX}px) scale(${scale})`;
            card.style.opacity = String(opacity);
            card.style.filter = "none";
            card.style.zIndex = String(zIndex);
            card.style.boxShadow = shadow;
          } else {
            card.style.transform = [
              `translate3d(${translateX}px, ${translateY}px, ${translateZ}px)`,
              `rotateY(${rotateY}deg)`,
              `scale(${scale})`,
            ].join(" ");
            card.style.opacity = `${opacity}`;
            card.style.filter = blur > 0.1 ? `blur(${blur}px)` : "none";
            card.style.zIndex = String(zIndex);
            card.style.boxShadow = shadow;
          }
        }
      };

      /* ─── Snap to nearest card ─── */
      const snapToNearest = () => {
        targetPosition = Math.round(position) % N;
        if (targetPosition < 0) targetPosition += N;
        isSnapping = true;
      };

      /* ─── Auto-scroll management ─── */
      const startAutoScroll = () => {
        if (prefersReducedMotion || isPausedManually) return;
        stopAutoScroll();
        autoScrollTimer = setInterval(() => {
          if (!isDragging) {
            targetPosition = (Math.round(position) + 1) % N;
            isSnapping = true;
          }
        }, 3000);
      };

      const stopAutoScroll = () => {
        if (autoScrollTimer) {
          clearInterval(autoScrollTimer);
          autoScrollTimer = null;
        }
      };

      /* ─── Main animation loop with Spring physics ─── */
      const tick = () => {
        if (isSnapping && !isDragging) {
          // Calculate looped distance to target
          let diff = targetPosition - position;
          diff = ((diff + N / 2) % N + N) % N - N / 2;

          // Spring force equations (F = -kx - cv)
          const force = diff * CFG.springStiffness - velocity * CFG.springDamping;
          velocity += force;
          position += velocity;

          // Keep within [0, N) range
          position = (position % N + N) % N;

          if (Math.abs(diff) < 0.001 && Math.abs(velocity) < 0.0001) {
            position = targetPosition;
            velocity = 0;
            isSnapping = false;
          }
        } else if (!isDragging && !isSnapping) {
          // Decay drag velocity
          if (Math.abs(velocity) > 0.0001) {
            position += velocity;
            velocity *= CFG.flickDecay;
            position = (position % N + N) % N;
          } else {
            velocity = 0;
          }
        }

        layoutCards();
        const activeIdx = (Math.round(position) % N + N) % N;
        updatePagination(activeIdx);
        coverflowFrame = requestAnimationFrame(tick);
      };

      coverflowFrame = requestAnimationFrame(tick);
      startAutoScroll();

      /* ─── Mouse events ─── */
      const onMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        isDragging = true;
        isSnapping = false;
        velocity = 0;
        dragStartX = e.clientX;
        lastDragX = e.clientX;
        lastDragTime = performance.now();
        stopAutoScroll();
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const dx = e.clientX - lastDragX;
        const now = performance.now();
        const dt = now - lastDragTime;
        if (dt > 0) {
          velocity = (-dx * CFG.dragSensitivity) * (16 / dt);
        }
        position = (position - dx * CFG.dragSensitivity + N) % N;
        lastDragX = e.clientX;
        lastDragTime = now;
      };

      const onMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;
        if (Math.abs(velocity) < 0.003) {
          snapToNearest();
        }
        startAutoScroll();
      };

      /* ─── Touch events ─── */
      const onTouchStart = (e: TouchEvent) => {
        isDragging = true;
        isSnapping = false;
        velocity = 0;
        dragStartX = e.touches[0].clientX;
        lastDragX = e.touches[0].clientX;
        lastDragTime = performance.now();
        stopAutoScroll();
      };

      const onTouchMove = (e: TouchEvent) => {
        if (!isDragging) return;
        const clientX = e.touches[0].clientX;
        const dx = clientX - lastDragX;
        const now = performance.now();
        const dt = now - lastDragTime;
        if (dt > 0) {
          velocity = (-dx * CFG.dragSensitivity) * (16 / dt);
        }
        position = (position - dx * CFG.dragSensitivity + N) % N;
        lastDragX = clientX;
        lastDragTime = now;
      };

      const onTouchEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        if (Math.abs(velocity) < 0.003) {
          snapToNearest();
        }
        startAutoScroll();
      };

      /* ─── Mouse Wheel support ─── */
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        isPaused = true;
        isSnapping = false;
        stopAutoScroll();

        const delta = Math.sign(e.deltaY) * 0.12;
        position = (position + delta + N) % N;
        velocity = 0;

        clearTimeout(wheelTimeout!);
        wheelTimeout = setTimeout(() => {
          snapToNearest();
          isPaused = false;
          startAutoScroll();
        }, 200);
      };

      /* ─── Active snap / click handlers ─── */
      cards.forEach((card, i) => {
        card.addEventListener("click", (e) => {
          const currentActive = Math.round(position);
          if (i !== currentActive) {
            e.preventDefault();
            e.stopPropagation();
            targetPosition = i;
            isSnapping = true;
            isPaused = true;
            stopAutoScroll();
          } else {
            const video = card.getAttribute("data-video");
            if (video) {
              openVideo(video, COVERFLOW_CARDS[i].client, COVERFLOW_CARDS[i].stat);
            }
          }
        });
      });

      /* ─── Hover pause ─── */
      const onEnter = () => {
        isPaused = true;
      };
      const onLeave = () => {
        isPaused = false;
      };

      /* ─── Keyboard navigation ─── */
      const onKeyDown = (e: KeyboardEvent) => {
        const activeEl = document.activeElement;
        if (!activeEl || !activeEl.classList.contains("coverflow__card")) return;

        if (e.key === "ArrowRight") {
          e.preventDefault();
          targetPosition = (Math.round(position) + 1) % N;
          isSnapping = true;
          isPaused = true;
          stopAutoScroll();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          targetPosition = (Math.round(position) - 1 + N) % N;
          isSnapping = true;
          isPaused = true;
          stopAutoScroll();
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          (activeEl as HTMLElement).click();
        }
      };

      // Bind events
      coverflowEl.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      coverflowEl.addEventListener("touchstart", onTouchStart, { passive: true });
      coverflowEl.addEventListener("touchmove", onTouchMove, { passive: true });
      coverflowEl.addEventListener("touchend", onTouchEnd);
      coverflowEl.addEventListener("wheel", onWheel, { passive: false });
      coverflowEl.addEventListener("mouseenter", onEnter);
      coverflowEl.addEventListener("mouseleave", onLeave);
      document.addEventListener("keydown", onKeyDown);

      // Spring-back velocity watcher
      const velocityWatcher = setInterval(() => {
        if (!isDragging && !isSnapping && Math.abs(velocity) > 0 && Math.abs(velocity) < 0.005) {
          velocity = 0;
          snapToNearest();
        }
      }, 100);

      cleanupFns.push(() => {
        cancelAnimationFrame(coverflowFrame);
        clearInterval(velocityWatcher);
        stopAutoScroll();
        if (wheelTimeout) clearTimeout(wheelTimeout);
        coverflowEl.removeEventListener("mousedown", onMouseDown);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        coverflowEl.removeEventListener("touchstart", onTouchStart);
        coverflowEl.removeEventListener("touchmove", onTouchMove);
        coverflowEl.removeEventListener("touchend", onTouchEnd);
        coverflowEl.removeEventListener("wheel", onWheel);
        coverflowEl.removeEventListener("mouseenter", onEnter);
        coverflowEl.removeEventListener("mouseleave", onLeave);
        document.removeEventListener("keydown", onKeyDown);
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
