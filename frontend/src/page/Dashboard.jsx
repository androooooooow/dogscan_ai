import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { FaDog } from "react-icons/fa";
import { IoIosQrScanner } from "react-icons/io";


function Dashboard({ user, setUser }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

const [totalScans, setTotalScans] = useState(0);

useEffect(() => {
  if (!user?.email) return;

  fetch(`http://127.0.0.1:5000/api/scan-count/${user.email}`)
    .then(res => res.json())
    .then(data => setTotalScans(data.total));
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
                  <p className="text-sm text-gray-500">Total Scan Breeds</p>
                     <h3 className="text-2xl font-bold">{totalScans}</h3>
                </div>

                
              </div>
            </div>

            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
                  <FaDog className="text-xl" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Breeds</p>
                 
                
                </div>

                
              </div>
            </div>
          </div>

          {/* MAP + ROUTES */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* MAP */}
            <div className="xl:col-span-2 bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Breed Analysis</h2>

              <div className="bg-gray-100 h-80 rounded-lg overflow-hidden">
                
              </div>
            </div>

            {/* ACTIVE ROUTES */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Most Love Breeds</h2>

              <div className="space-y-4">
                {[
               
                ].map((route, i) => (
                  <div key={i} className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      🚌
                    </div>
                    <p className="font-medium">{route}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

export default Dashboard;
