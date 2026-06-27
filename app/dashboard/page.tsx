import { getDashboardScript } from "../lib/dashboard";
import DashboardLegacy from "./DashboardLegacy";

export default function DashboardPage() {
  return <DashboardLegacy scriptCode={getDashboardScript()} />;
}
