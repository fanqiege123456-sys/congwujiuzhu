import React, { useState } from 'react';
import { Pet, PetStatus, AuditLog } from '../types';
import { X, MapPin, CheckCircle, AlertTriangle, ShieldCheck, Camera, Video, MessageSquare } from 'lucide-react';
import { analyzePetReport, auditRescueReport } from '../services/geminiService';

interface PetDetailProps {
  pet: Pet;
  onClose: () => void;
  onUpdate: (pet: Pet) => void;
  currentUserLocation: { lat: number, lng: number } | null;
}

const PetDetail: React.FC<PetDetailProps> = ({ pet, onClose, onUpdate, currentUserLocation }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'rescue' | 'audit'>('info');
  const [rescueDetails, setRescueDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAuditResult, setAiAuditResult] = useState<string | null>(null);

  const handleRescueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate updating
    const updatedPet: Pet = {
      ...pet,
      status: PetStatus.RESCUED,
      rescueDetails: rescueDetails,
      timestamp: Date.now() // Update timestamp to bump it up
    };

    onUpdate(updatedPet);
    setIsSubmitting(false);
    onClose();
  };

  const handleAudit = async (action: 'VERIFY' | 'FLAG_FAKE') => {
    setIsSubmitting(true);
    const newAudit: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId: 'current-user', // Mock ID
      action,
      comment: action === 'VERIFY' ? '社区认证真实' : '社区标记存疑',
      timestamp: Date.now()
    };

    const updatedPet = {
      ...pet,
      audits: [...pet.audits, newAudit]
    };

    onUpdate(updatedPet);
    setIsSubmitting(false);
  };

  const triggerAiAudit = async () => {
      setIsSubmitting(true);
      const result = await auditRescueReport(pet);
      setAiAuditResult(result);
      setIsSubmitting(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg h-[85vh] sm:h-auto sm:rounded-2xl rounded-t-2xl flex flex-col shadow-2xl overflow-hidden animate-slide-up">
        
        {/* Header Image */}
        <div className="relative h-56 bg-gray-100 shrink-0">
          {pet.images.length > 0 ? (
            <img src={pet.images[0]} alt="Pet" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">暂无图片</div>
          )}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition"
          >
            <X size={20} />
          </button>
          <div className={`absolute bottom-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${pet.status === PetStatus.NEEDS_RESCUE ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
            {pet.status === PetStatus.NEEDS_RESCUE ? '待救助' : '已救助'}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
            {/* Tabs */}
            <div className="flex border-b mb-4">
                <button onClick={() => setActiveTab('info')} className={`flex-1 py-2 text-sm font-medium border-b-2 ${activeTab === 'info' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>详细信息</button>
                <button onClick={() => setActiveTab('rescue')} className={`flex-1 py-2 text-sm font-medium border-b-2 ${activeTab === 'rescue' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>更新状态</button>
                <button onClick={() => setActiveTab('audit')} className={`flex-1 py-2 text-sm font-medium border-b-2 ${activeTab === 'audit' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>社区审核</button>
            </div>

            {activeTab === 'info' && (
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <MapPin className="text-gray-400 mt-1" size={18} />
                        <div>
                            <p className="text-sm text-gray-500">最后出现位置</p>
                            <p className="font-medium text-gray-800">{pet.address || "未知地址"}</p>
                            <p className="text-xs text-gray-400 mt-1">坐标: {pet.location.lat.toFixed(4)}, {pet.location.lng.toFixed(4)}</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">详细描述</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">{pet.description}</p>
                    </div>

                    {pet.aiAnalysis && (
                        <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 flex gap-3">
                            <div className="shrink-0 bg-purple-100 p-2 rounded-full h-8 w-8 flex items-center justify-center">
                                <span className="text-xs font-bold text-purple-600">AI</span>
                            </div>
                            <p className="text-xs text-purple-800 italic">{pet.aiAnalysis}</p>
                        </div>
                    )}

                    {pet.videoUrl && (
                        <div className="mt-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><Video size={16}/> 视频记录</h4>
                            <video src={pet.videoUrl} controls className="w-full rounded-lg bg-black max-h-48" />
                        </div>
                    )}

                    {pet.rescueDetails && (
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100 mt-4">
                            <h4 className="text-sm font-semibold text-green-800 mb-1 flex items-center gap-2">
                                <CheckCircle size={16} /> 救助进展
                            </h4>
                            <p className="text-green-700 text-sm">{pet.rescueDetails}</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'rescue' && (
                <div className="space-y-4">
                    {pet.status === PetStatus.RESCUED ? (
                         <div className="text-center py-8">
                            <CheckCircle className="mx-auto text-green-500 mb-2" size={48} />
                            <h3 className="text-lg font-bold text-gray-800">已成功救助！</h3>
                            <p className="text-gray-500 text-sm mt-1">感谢社区的帮助。</p>
                         </div>
                    ) : (
                        <form onSubmit={handleRescueSubmit}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                填写救助详情
                            </label>
                            <textarea
                                value={rescueDetails}
                                onChange={(e) => setRescueDetails(e.target.value)}
                                className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px]"
                                placeholder="动物被带去了哪里？谁参与了救助？如果方便请留下联系方式。"
                                required
                            />
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg mt-4 transition flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? '更新中...' : '标记为已救助'}
                            </button>
                        </form>
                    )}
                </div>
            )}

            {activeTab === 'audit' && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-500 mb-4">
                        帮助我们维护数据的准确性。如果您在附近确认了情况，或者怀疑是虚假信息，请反馈。
                    </p>

                    <div className="flex gap-3">
                        <button 
                            onClick={() => handleAudit('VERIFY')}
                            disabled={isSubmitting}
                            className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 py-3 rounded-lg text-sm font-medium flex flex-col items-center gap-1 transition"
                        >
                            <ShieldCheck size={20} />
                            确认真实
                        </button>
                        <button 
                            onClick={() => handleAudit('FLAG_FAKE')}
                            disabled={isSubmitting}
                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-3 rounded-lg text-sm font-medium flex flex-col items-center gap-1 transition"
                        >
                            <AlertTriangle size={20} />
                            标记存疑
                        </button>
                    </div>

                    {pet.status === PetStatus.RESCUED && (
                        <div className="mt-6 pt-6 border-t">
                            <button 
                                onClick={triggerAiAudit}
                                disabled={isSubmitting}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? '分析中...' : 'AI 智能审核救助报告'}
                            </button>
                            {aiAuditResult && (
                                <div className="mt-3 p-3 bg-gray-100 rounded-lg text-sm text-gray-800 border-l-4 border-purple-500">
                                    <strong>AI 评估结果:</strong> {aiAuditResult}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-6">
                        <h4 className="text-sm font-bold text-gray-800 mb-3">审核记录</h4>
                        {pet.audits.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">暂无记录。</p>
                        ) : (
                            <div className="space-y-2">
                                {pet.audits.map(audit => (
                                    <div key={audit.id} className="text-xs flex items-center justify-between bg-gray-50 p-2 rounded border">
                                        <span className={audit.action === 'VERIFY' ? 'text-blue-600 font-bold' : 'text-red-600 font-bold'}>
                                            {audit.action === 'VERIFY' ? '已认证' : '存疑'}
                                        </span>
                                        <span className="text-gray-400">{new Date(audit.timestamp).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PetDetail;