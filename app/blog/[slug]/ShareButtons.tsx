"use client";

interface ShareProps {
  title: string;
  slug: string;
}

export default function ShareButtons({ title, slug }: ShareProps) {
  const handleTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(title)}`, '_blank');
  };

  const handleLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="blog-share-panel">
      <span className="blog-share-label">
        Share Article:
      </span>
      <button className="share-btn" onClick={handleTwitter}>
        Twitter
      </button>
      <button className="share-btn" onClick={handleLinkedIn}>
        LinkedIn
      </button>
      <button className="share-btn" onClick={handleCopy}>
        Copy Link
      </button>
    </div>
  );
}
