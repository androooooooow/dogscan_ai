import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { FaDog } from "react-icons/fa";
import { IoIosQrScanner } from "react-icons/io";
// 1. Import your configured axios instance
import api from "../api/axios"; 

function Dashboard({ user, setUser }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [totalScans, setTotalScans] = useState(0);

  useEffect(() => {
    // 2. Critical: Only fetch if we have a user email.
    // This prevents the 404/401 errors when the app first loads.
    if (!user?.email) return;

    // 3. Use 'api' (Axios) instead of 'fetch'
    // This automatically uses http://192.168.100.240:5000
    api.get(`/api/scan-count/${encodeURIComponent(user.email)}`)
      .then(res => {
        // Axios stores the JSON response in .data
        setTotalScans(res.data.total);
      })
      .catch(err => {
        console.error("Dashboard fetch error:", err);
      });
  }, [user]);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar sidebarOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          user={user}
          setUser={setUser}
        />

        <main className="flex-1 overflow-auto p-6">
          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                  <FaDog className="text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Breeds</p>
                  <h3 className="text-2xl font-bold">121</h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                  <IoIosQrScanner className="text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Scans</p>
                  <h3 className="text-2xl font-bold">{totalScans}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Breed Analysis</h2>
              <div className="bg-gray-100 h-80 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Analysis Chart Placeholder</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Most Loved Breeds</h2>
              <div className="space-y-4 text-center py-10">
                 <p className="text-gray-400 italic">No scan data available yet.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;