export declare const apiRequest: (method: "GET" | "POST" | "PUT" | "DELETE", path: string, data?: any) => Promise<any>;
export declare const apiGet: (path: string) => Promise<any>;
export declare const apiPost: (path: string, data: any) => Promise<any>;
export declare const apiPut: (path: string, data: any) => Promise<any>;
export declare const uploadFile: (filePath: string) => Promise<string>;
