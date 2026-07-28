const scriptCache: Record<string, Promise<void> | undefined> = {};

export function loadScript(src: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (scriptCache[src]) {
    return scriptCache[src];
  }

  // Check if it's already fully loaded in the window
  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${src}"]`
  );
  if (existing && ((window as any).Chart || (window as any).XLSX)) {
    return Promise.resolve();
  }

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      delete scriptCache[src]; // Allow retry on failure
      reject(new Error(`Failed to load ${src}`));
    };
    document.head.appendChild(script);
  });

  scriptCache[src] = promise;
  return promise;
}

export async function loadChartJS(): Promise<any> {
  if (typeof window === "undefined") return null;
  if ((window as any).Chart) return (window as any).Chart;
  await loadScript(
    "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"
  );
  return (window as any).Chart;
}

export async function loadXLSX(): Promise<any> {
  if (typeof window === "undefined") return null;
  if ((window as any).XLSX) return (window as any).XLSX;
  await loadScript(
    "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
  );
  return (window as any).XLSX;
}
export async function loadChartJs(): Promise<any> {
  return loadChartJS();
}
