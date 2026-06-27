import { getDashboardScript } from "../../lib/dashboard";
import DashboardLegacy from "../DashboardLegacy";

export default function DashboardLoginPage() {
  return <DashboardLegacy scriptCode={getDashboardScript()} />;
}