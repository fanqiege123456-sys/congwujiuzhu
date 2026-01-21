export interface UserProfile {
    nickname: string;
    avatarUrl: string;
    openId?: string;
    displayId?: string;
}
export declare const loginOrRegister: (profile: UserProfile) => Promise<UserProfile>;
export declare const loginWithCode: () => Promise<any>;
