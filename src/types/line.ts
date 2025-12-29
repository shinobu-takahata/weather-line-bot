/**
 * LINEメッセージ
 */
export interface LineMessage {
  type: 'text';
  text: string;
}

/**
 * LINE Broadcast APIリクエスト
 */
export interface LineBroadcastRequest {
  messages: LineMessage[];
}

/**
 * LINE Broadcast APIレスポンス
 */
export interface LineBroadcastResponse {
  // 空オブジェクト（成功時は204 No Content）
}
