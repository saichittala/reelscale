"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./DashboardLegacy.module.css";

declare global {
  interface Window {
    __reelscaleDashboardLoaded?: boolean;
    loadXLSXLibrary?: () => Promise<void>;
  }
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

function SkeletonLoader() {
  return (
    <div className={styles.skeletonContainer}>
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonSubtitle} />
      </div>
      <div className={styles.skeletonGrid}>
        <div className={styles.skeletonCard}>
          <div className={styles.skeletonLine} style={{ width: "40%" }} />
          <div className={styles.skeletonBlock} />
        </div>
        <div className={styles.skeletonCard}>
          <div className={styles.skeletonLine} style={{ width: "35%" }} />
          <div className={styles.skeletonBlock} />
        </div>
        <div className={styles.skeletonCard}>
          <div className={styles.skeletonLine} style={{ width: "45%" }} />
          <div className={styles.skeletonBlock} />
        </div>
        <div className={styles.skeletonCard}>
          <div className={styles.skeletonLine} style={{ width: "30%" }} />
          <div className={styles.skeletonBlock} />
        </div>
      </div>
      <div className={styles.skeletonChart}>
        <div className={styles.skeletonLine} style={{ width: "25%" }} />
        <div className={styles.skeletonBlockLarge} />
      </div>
    </div>
  );
}

export default function DashboardLegacy({ scriptCode }: { scriptCode: string }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    window.loadXLSXLibrary = async () => {
      if ("XLSX" in window) return;
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
    };

    const boot = async () => {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js");

      if (!mounted || window.__reelscaleDashboardLoaded) return;

      window.__reelscaleDashboardLoaded = true;

      const script = document.createElement("script");
      script.id = "reelscale-dashboard-runtime";
      script.text = `
        (function () {
          try {
            const loadXLSXLibrary = window.loadXLSXLibrary;
            ${scriptCode}
          } catch (e) {
            console.error("Dashboard script execution error:", e);
          }
        })();
      `;

      // Wait for the root element to be available
      const waitForRoot = () => {
        return new Promise<void>((resolve) => {
          const checkRoot = () => {
            const rootEl = document.getElementById("root");
            if (rootEl) {
              try {
                rootEl.appendChild(script);
              } catch (error) {
                console.error("Dashboard script append error:", error);
              }
              resolve();
            } else {
              setTimeout(checkRoot, 50);
            }
          };
          checkRoot();
        });
      };

      await waitForRoot();

      if (document.readyState === 'loading') {
        await new Promise<void>((resolve) => {
          document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
        });
      }

      if (mounted) setLoading(false);
    };

    boot().catch((error) => {
      console.error("Dashboard failed to start", error);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [scriptCode]);

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      <div id="root" />
      {loading && <SkeletonLoader />}
    </div>
  );
}
