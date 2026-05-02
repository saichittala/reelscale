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

  if (!modal || !wrapper) return; // 🛑 stop if modal not present

  document.querySelectorAll(".portfolio-item").forEach(item => {
    item.addEventListener("click", () => {
      const video = item.getAttribute("data-video");

      if (!video) return;

      wrapper.innerHTML = `
  <iframe 
    src="${video}?autoplay=1&rel=0&modestbranding=1&playsinline=1"
    title="YouTube video player"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerpolicy="strict-origin-when-cross-origin"
    allowfullscreen>
  </iframe>
`;

      modal.classList.add("active");
    });
  });

  function closeModal() {
    modal.classList.remove("active");
    wrapper.innerHTML = "";
  }

  // ✅ Safe bindings
  closeBtn?.addEventListener("click", closeModal);
  modal.querySelector(".video-backdrop")?.addEventListener("click", closeModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

});
