import React, { useState, useRef } from 'react';
import { Pet, PetStatus } from '../types';
import { Camera, MapPin, X, Loader2, Video } from 'lucide-react';
import { analyzePetReport } from '../services/geminiService';

interface ReportFormProps {
  currentLocation: { lat: number, lng: number };
  onClose: () => void;
  onSubmit: (pet: Pet) => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ currentLocation, onClose, onSubmit }) => {
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const url = URL.createObjectURL(file);
          setVideoUrl(url);
      }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);

    // AI Analysis
    const aiAnalysis = await analyzePetReport(description, imagePreview || undefined);

    const newPet: Pet = {
      id: crypto.randomUUID(),
      description,
      location: currentLocation,
      address: `纬度: ${currentLocation.lat.toFixed(4)}, 经度: ${currentLocation.lng.toFixed(4)}`, // Mock reverse geo
      status: PetStatus.NEEDS_RESCUE,
      images: imagePreview ? [imagePreview] : [],
      videoUrl: videoUrl || undefined,
      timestamp: Date.now(),
      reporterName: '匿名用户',
      audits: [],
      aiAnalysis
    };

    onSubmit(newPet);
    setIsAnalyzing(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-md h-[90vh] sm:h-auto sm:rounded-2xl rounded-t-2xl flex flex-col shadow-2xl overflow-hidden">
        
        <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-bold text-lg text-gray-800">发布救助信息</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
            </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto space-y-6">
            
            {/* Location Display */}
            <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-3 text-blue-700 text-sm">
                <MapPin size={18} />
                <span>位置已标记为当前位置</span>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">现场照片（必填）</label>
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl h-48 flex flex-col items-center justify-center bg-gray-50 cursor-pointer hover:bg-gray-100 transition relative overflow-hidden"
                >
                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <>
                            <Camera className="text-gray-400 mb-2" size={32} />
                            <span className="text-gray-500 text-sm">点击上传照片</span>
                        </>
                    )}
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleImageChange} 
                    />
                </div>
            </div>

             {/* Video Upload */}
             <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">视频（可选）</label>
                <div className="flex items-center gap-3">
                    <button 
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition"
                    >
                        <Video size={16} /> 选择视频
                    </button>
                    {videoUrl && <span className="text-xs text-green-600 font-bold">已选择视频</span>}
                </div>
                <input 
                    type="file" 
                    accept="video/*" 
                    className="hidden" 
                    ref={videoInputRef} 
                    onChange={handleVideoChange} 
                />
            </div>

            {/* Description */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">详细描述</label>
                <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px]"
                    placeholder="请描述动物的特征（品种、颜色、体型）以及当前的状况..."
                    required
                />
            </div>

            <button 
                type="submit" 
                disabled={isAnalyzing || !description}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isAnalyzing ? (
                    <>
                        <Loader2 className="animate-spin" size={20} />
                        AI正在分析并提交...
                    </>
                ) : (
                    '提交救助信息'
                )}
            </button>
        </form>
      </div>
    </div>
  );
};

export default ReportForm;