import RecentShipmentsWidget from '@/components/dashboard/RecentShipmentsWidget';

export default function DashboardPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
                Welcome to Dashboard
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Technicians Card */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Technicians</h2>
                        <span className="text-2xl">👷</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">0</p>
                    <p className="text-sm text-gray-500 mt-1">Total technicians</p>
                </div>

                {/* Equipment Card */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Equipment</h2>
                        <span className="text-2xl">🔧</span>
                    </div>
                    <p className="text-3xl font-bold text-green-600">0</p>
                    <p className="text-sm text-gray-500 mt-1">Available items</p>
                </div>

                {/* Vehicles Card */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Vehicles</h2>
                        <span className="text-2xl">🚗</span>
                    </div>
                    <p className="text-3xl font-bold text-purple-600">0</p>
                    <p className="text-sm text-gray-500 mt-1">In fleet</p>
                </div>

                {/* Work Orders Card */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Work Orders</h2>
                        <span className="text-2xl">📋</span>
                    </div>
                    <p className="text-3xl font-bold text-orange-600">0</p>
                    <p className="text-sm text-gray-500 mt-1">Pending orders</p>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Shipments */}
                <div className="lg:col-span-1">
                    <RecentShipmentsWidget limit={5} />
                </div>

                {/* Quick Actions */}
                <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200 shadow-sm h-full">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                            <span>👷</span> Add Technician
                        </button>
                        <button className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                            <span>🔧</span> Add Equipment
                        </button>
                        <button className="px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                            <span>🚗</span> Add Vehicle
                        </button>
                        <button className="px-4 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center justify-center gap-2">
                            <span>📋</span> New Work Order
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
