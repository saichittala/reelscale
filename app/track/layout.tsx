import "../../styles.css";
import "../../dashboard/dashboard.css";

export const metadata = {
  title: "Reel Delivery Portal | ReelScale",
  description: "Track monthly reel deliveries and download footage and project files.",
};

export default function TrackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
