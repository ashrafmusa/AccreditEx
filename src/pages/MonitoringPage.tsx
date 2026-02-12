import React from "react";
import { NavigationState } from "@/types";
import MonitoringDashboard from "@/components/monitoring/MonitoringDashboard";

interface MonitoringPageProps {
  setNavigation: (state: NavigationState) => void;
}

const MonitoringPage: React.FC<MonitoringPageProps> = ({ setNavigation }) => {
  return <MonitoringDashboard />;
};

export default MonitoringPage;
