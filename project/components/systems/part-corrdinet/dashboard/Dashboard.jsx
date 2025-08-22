import { useState, useEffect } from "react";
import Analytics from "./tabs/Analytics";
import PartsReceivedToday from "./tabs/PartsReceivedToday";
import VehiclesInProgress from "./tabs/VehiclesInProgress";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("Analytics");
  const [partsReceivedCount, setPartsReceivedCount] = useState(0);
  const [vehiclesInProgressCount, setVehiclesInProgressCount] = useState(0);

  useEffect(() => {
    fetch("http://localhost:5001/api/part-cordinator-analytics/dashboard-counts")
      .then((res) => res.json())
      .then((data) => {
        setPartsReceivedCount(data.partsReceivedCount);
        setVehiclesInProgressCount(data.vehiclesInProgressCount);
      })
      .catch((err) => {
        console.error("Failed to load dashboard counts:", err);
      });
  }, []);

  const tabs = [
    "Analytics",
    {
      name: "Total parts received today",
      count: partsReceivedCount
    },
    {
      name: "Vehicles in progress",
      count: vehiclesInProgressCount
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "Analytics":
        return <Analytics />;
      case "Total parts received today":
        return <PartsReceivedToday />;
      case "Vehicles in progress":
        return <VehiclesInProgress />;
      default:
        return <Analytics />;
    }
  };

  return (
    <div className="pb-4 mb-6 h-screen overflow-hidden">
      {/* Tab Buttons */}
      <div className="flex space-x-6  ml-5 mt-5">
        {tabs.map((tab) => {
          const tabName = typeof tab === 'string' ? tab : tab.name;
          const count = typeof tab === 'object' ? tab.count : null;

          return (
            <button
              key={tabName}
              onClick={() => setActiveTab(tabName)}
              className={`relative pb-2 font-semibold transition hover:text-blue-600 flex items-center gap-2 ${
                activeTab === tabName ? "text-customBlue" : "text-gray-700"
              }`}
            >
              <span>{tabName}</span>
              {count !== null && count > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] flex items-center justify-center">
                  {count}
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
