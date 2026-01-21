"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditRescueReport = exports.analyzePetReport = void 0;
const genai_1 = require("@google/genai");
const ai = new genai_1.GoogleGenAI({ apiKey: process.env.API_KEY });
const analyzePetReport = async (description, imageBase64) => {
    try {
        const model = 'gemini-3-flash-preview';
        const prompt = `
      你是一个流浪动物救助小程序的AI助手。
      请分析以下用户提交的动物描述，并提供一个非常简短、有帮助的中文摘要（不超过2句话）。
      如果可能，请识别品种和颜色，并评估紧急程度。
      格式："AI分析：[你的回复]"
      
      用户描述: ${description}
    `;
        const parts = [{ text: prompt }];
        if (imageBase64) {
            // Strip prefix if present (e.g. data:image/jpeg;base64,)
            const base64Data = imageBase64.split(',')[1] || imageBase64;
            parts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Data
                }
            });
        }
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: parts },
        });
        return response.text || "AI分析暂不可用。";
    }
    catch (error) {
        console.error("Gemini analysis failed:", error);
        return "AI分析服务暂时繁忙。";
    }
};
exports.analyzePetReport = analyzePetReport;
const auditRescueReport = async (pet) => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `
                请审核这条流浪动物救助报告。
                请检查提供的“救助详情”与原始的“求助描述”是否逻辑一致？
                
                原始描述: ${pet.description}
                救助详情更新: ${pet.rescueDetails}
                
                请回复 "看似合理" 或 "存在疑点"，并附带简短的中文理由。
            `
        });
        return response.text || "AI审核失败。";
    }
    catch (e) {
        return "AI审核服务暂不可用。";
    }
};
exports.auditRescueReport = auditRescueReport;
