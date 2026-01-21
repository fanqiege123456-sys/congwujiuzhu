import React, { useState, useEffect, useCallback } from 'react';
import { Pet, Coordinates } from './types';
import { getStoredPets, savePet, updatePet, seedDummyData, calculateDistance } from './services/storageService';
import MapView from './components/MapView';
import PetDetail from './components/PetDetail';
import ReportForm from './components/ReportForm';
import { Plus, List, Map as MapIcon, LocateFixed, Volume2 } from 'lucide-react';

const DEFAULT_LOCATION: Coordinates = { lat: 34.0522, lng: -118.2437 }; // Los Angeles fallback
const SEARCH_RADIUS_KM = 10;

const App: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [locationError, setLocationError] = useState<string | null>(null);

  // Initialize data and location
  useEffect(() => {
    // 1. Get Location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          seedDummyData(loc); // Seed data near real user location
          loadPets(loc);
        },
        (error) => {
          console.warn("Geolocation denied/failed. Using default.", error);
          setLocationError("无法获取定位，使用默认位置演示。");
          setUserLocation(DEFAULT_LOCATION);
          seedDummyData(DEFAULT_LOCATION);
          loadPets(DEFAULT_LOCATION);
        }
      );
    } else {
        setUserLocation(DEFAULT_LOCATION);
        seedDummyData(DEFAULT_LOCATION);
        loadPets(DEFAULT_LOCATION);
    }
  }, []);

  const loadPets = (center: Coordinates) => {
    const allPets = getStoredPets();
    setPets(allPets);
    filterPets(allPets, center);
  };

  const filterPets = (allPets: Pet[], center: Coordinates) => {
    const nearby = allPets.filter(pet => {
      const dist = calculateDistance(center, pet.location);
      return dist <= SEARCH_RADIUS_KM;
    });
    // Sort: Needs rescue first, then by timestamp
    nearby.sort((a, b) => {
        if (a.status !== b.status) {
            return a.status === 'NEEDS_RESCUE' ? -1 : 1;
        }
        return b.timestamp - a.timestamp;
    });
    setFilteredPets(nearby);
  };

  const handleReportSubmit = (newPet: Pet) => {
    const updatedList = savePet(newPet);
    setPets(updatedList);
    if (userLocation) filterPets(updatedList, userLocation);
    setIsReporting(false);
  };

  const handlePetUpdate = (updatedPet: Pet) => {
    const updatedList = updatePet(updatedPet);
    setPets(updatedList);
    if (userLocation) filterPets(updatedList, userLocation);
    // Update selected pet if it's the one open
    setSelectedPet(updatedPet); 
  };

  const refreshLocation = () => {
      if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition((pos) => {
              const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              setUserLocation(loc);
              filterPets(pets, loc);
          });
      }
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50 text-gray-900 font-sans overflow-hidden">
      
      {/* Top Bar */}
      <header className="bg-white shadow-sm z-20 shrink-0 relative">
        <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="bg-red-500 text-white p-1.5 rounded-lg">
                    <MapIcon size={20} />
                </div>
                <h1 className="text-lg font-bold tracking-tight text-slate-800">流浪萌宠救助</h1>
            </div>
            
            <div className="flex items-center gap-3">
                <button 
                    onClick={refreshLocation}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition"
                    title="刷新定位"
                >
                    <LocateFixed size={20} />
                </button>
                <button 
                    onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                >
                    {viewMode === 'map' ? <List size={18}/> : <MapIcon size={18}/>}
                    <span className="hidden sm:inline">{viewMode === 'map' ? '列表' : '地图'}</span>
                </button>
            </div>
        </div>

        {/* Scrolling Announcement */}
        <div className="bg-orange-50 text-orange-800 text-xs sm:text-sm py-2 overflow-hidden whitespace-nowrap border-b border-orange-100 flex items-center">
             <div className="bg-orange-50 px-2 z-10 shrink-0">
                <Volume2 size={16} className="text-orange-600"/>
             </div>
             <div className="animate-marquee font-medium">
                📢 最新公告：近日气温骤降，请大家留意车底或发动机舱内取暖的流浪小动物。感谢用户“爱心小王”刚刚上传了新的救助线索！若发现受伤动物请及时标记，紧急情况请联系当地救助站。
             </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 relative">
        
        {/* Map View */}
        <div className={`absolute inset-0 transition-opacity duration-300 ${viewMode === 'map' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            <MapView 
                userLocation={userLocation} 
                pets={filteredPets} 
                onPetClick={setSelectedPet}
            />
        </div>

        {/* List View (Overlay or Replacement) */}
        {viewMode === 'list' && (
            <div className="absolute inset-0 z-10 bg-gray-50 overflow-y-auto p-4 animate-fade-in">
                <div className="max-w-2xl mx-auto space-y-4">
                    <h2 className="text-lg font-bold text-gray-700 mb-4">附近待救助 ({filteredPets.length})</h2>
                    {filteredPets.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">{SEARCH_RADIUS_KM}公里内暂无救助信息。</div>
                    ) : (
                        filteredPets.map(pet => (
                            <div 
                                key={pet.id} 
                                onClick={() => setSelectedPet(pet)}
                                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 cursor-pointer hover:shadow-md transition"
                            >
                                <div className="w-24 h-24 bg-gray-200 rounded-lg shrink-0 overflow-hidden">
                                    {pet.images[0] && <img src={pet.images[0]} alt="" className="w-full h-full object-cover" />}
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-semibold text-gray-800 line-clamp-1">{pet.address || "未知位置"}</h3>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${pet.status === 'NEEDS_RESCUE' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                {pet.status === 'NEEDS_RESCUE' ? '待救助' : '已救助'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{pet.description}</p>
                                    </div>
                                    <div className="flex justify-between items-end mt-2">
                                        <span className="text-xs text-gray-400">{new Date(pet.timestamp).toLocaleDateString()}</span>
                                        {pet.aiAnalysis && <span className="text-xs text-purple-600 font-medium">AI 已分析</span>}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

        {/* Floating Action Button (FAB) */}
        <button 
            onClick={() => setIsReporting(true)}
            className="absolute bottom-6 right-6 z-20 bg-red-500 hover:bg-red-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            title="发布救助信息"
        >
            <Plus size={28} />
        </button>

        {/* Location Error Toast */}
        {locationError && (
             <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-black/75 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm pointer-events-none">
                {locationError}
             </div>
        )}
      </div>

      {/* Modals */}
      {selectedPet && (
        <PetDetail 
            pet={selectedPet} 
            onClose={() => setSelectedPet(null)} 
            onUpdate={handlePetUpdate}
            currentUserLocation={userLocation}
        />
      )}

      {isReporting && userLocation && (
        <ReportForm 
            currentLocation={userLocation} 
            onClose={() => setIsReporting(false)} 
            onSubmit={handleReportSubmit} 
        />
      )}
    </div>
  );
};

export default App;