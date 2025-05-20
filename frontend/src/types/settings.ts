export interface UserSettingsData {
  apiKey: string; // バックエンドからは平文で取得し、UIでマスキングする想定
  fileUploadLimitMB: number;
  // 他の設定項目があればここに追加
}

export interface UserSettingsInputData {
  apiKey?: string; // APIキーは変更時のみ送信
  fileUploadLimitMB?: number;
  // 他の設定項目があればここに追加
}

export interface UpdateUserSettingsSuccessResponse {
  success: true;
  message: string;
  updatedSettings?: UserSettingsData;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string>;
}

export type UpdateUserSettingsResponse = UpdateUserSettingsSuccessResponse | ApiErrorResponse;
