import { useState, useEffect } from "react";
import Analytics from "../tabs/Analytics";
import Employees from "../tabs/Employees";
import Activerepair from "../tabs/Activerepair";
import Pending from "../tabs/Pending";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("Analytics");
  const [activeRepairCount, setActiveRepairCount] = useState(0);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [loadingCounts, setLoadingCounts] = useState(true);

  // Fetch only the two required counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [vehiclesRes, inspectionsRes] = await Promise.all([
          fetch(`https://ipasystem.bymsystem.com/api/manager-analytics/vehicles-in-service`),
          fetch(`https://ipasystem.bymsystem.com/api/manager-analytics/pending-inspections`)
        ]);

        const vehiclesData = await vehiclesRes.json();
        const inspectionsData = await inspectionsRes.json();

        setActiveRepairCount(vehiclesData?.total || 0);
        setPendingRequestCount(inspectionsData?.total || 0);
      } catch (err) {
        console.error("Failed to fetch counts:", err);
        // Fallback to hardcoded values as per your note
        setActiveRepairCount(3);
        setPendingRequestCount(2);
      } finally {
        setLoadingCounts(false);
      }
    };

    fetchCounts();
  }, []);

  const tabs = [
    "Analytics",
    "Total Employees",
    {
      name: "Active Repair Requests",
      count: loadingCounts ? null : activeRepairCount // Will show 3
    },
    {
      name: "Pending request",
      count: loadingCounts ? null : pendingRequestCount // Will show 2
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "Analytics":
        return <Analytics />;
      case "Total Employees":
        return <Employees />;
      case "Active Repair Requests":
        return <Activerepair />;
      case "Pending request":
        return <Pending />;
      default:
        return <Analytics />;
    }
  };

  return (
    <div className="pb-1 mb-1 h-screen overflow-hidden">
      {/* Tab Buttons */}
      <div className="flex space-x-6 pt-2 ml-5 mt-10">
        {tabs.map((tab) => {
          const tabName = typeof tab === 'string' ? tab : tab.name;
          const count = typeof tab === 'object' ? tab.count : null;

          return (
            <button
              key={tabName}
              onClick={() => setActiveTab(tabName)}
              className={`relative pb-2 font-semibold transition hover:text-customBlue flex items-center gap-2 ${
                activeTab === tabName ? "text-customBlue" : "text-gray-700"
              }`}
            >
              <span>{tabName}</span>
              {/* Show count only if loaded and > 0 */}
              {count !== null && count > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] flex items-center justify-center">
                  {count}
                </span>
              )}
              {/* Optional: skeleton while loading */}
              {count === null && (
                <span className=" text-transparent rounded-full  py-0.5 min-w-[10px] animate-pulse">
                  0
                </span>
              )}
              {activeTab === tabName && (
                <span className="absolute left-0 right-0 -bottom-1 h-1 bg-customBlue rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Scrollable Content Area */}
      <div className="overflow-y-auto mt-4 px-4 pr-6" style={{ maxHeight: 'calc(100vh - 150px)' }}>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Dashboard;