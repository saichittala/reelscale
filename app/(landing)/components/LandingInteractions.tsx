"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    instgrm?: {
      Embeds?: {
        process?: () => void;
      };
    };
  }
}

export default function LandingInteractions() {
  useEffect(() => {
    const cursor = document.getElementById("cursor");
    const ring = document.getElementById("cursorRing");
    const header = document.querySelector("header");
    let mx = 0;
    let my = 0;
    let rx = 0;
    let ry = 0;
    let frame = 0;

    const onMouseMove = (event: MouseEvent) => {
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

    document.addEventListener("mousemove", onMouseMove);
    window.addEventListener("scroll", onScroll);
    frame = requestAnimationFrame(animateRing);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    });

    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

    const modal = document.getElementById("videoModal");
    const wrapper = document.getElementById("videoWrapper");
    const closeBtn = document.getElementById("closeVideo");

    const closeModal = () => {
      modal?.classList.remove("active");
      if (wrapper) wrapper.innerHTML = "";
    };

    const portfolioHandlers: Array<[Element, EventListener]> = [];
    document.querySelectorAll(".portfolio-item").forEach((item) => {
      const handler = (() => {
        const video = item.getAttribute("data-video");
        const client = item.getAttribute("data-client") || "";
        const stat = item.getAttribute("data-stat") || "";

        if (!video || !modal || !wrapper) return;

        if (video.includes("instagram.com") || video.includes("instagr.am")) {
          wrapper.innerHTML = `
            <div class="video-meta">
              <div class="video-client">${client}</div>
              <div class="video-stat">${stat}</div>
            </div>
            <blockquote
              class="instagram-media"
              data-instgrm-permalink="${video}"
              data-instgrm-version="14"
              style="width:100%; max-width:540px; margin:auto;">
            </blockquote>
          `;

          window.instgrm?.Embeds?.process?.();
        } else {
          wrapper.innerHTML = `
            <div class="video-meta">
              <div class="video-client">${client}</div>
              <div class="video-stat">${stat}</div>
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
      }) as EventListener;

      item.addEventListener("click", handler);
      portfolioHandlers.push([item, handler]);
    });

    const backdrop = modal?.querySelector(".video-backdrop");
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };

    closeBtn?.addEventListener("click", closeModal);
    backdrop?.addEventListener("click", closeModal);
    document.addEventListener("keydown", onEscape);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("keydown", onEscape);
      closeBtn?.removeEventListener("click", closeModal);
      backdrop?.removeEventListener("click", closeModal);
      portfolioHandlers.forEach(([item, handler]) => item.removeEventListener("click", handler));
    };
  }, []);

  return null;
}
