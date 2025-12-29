import { EventBridgeEvent } from 'aws-lambda';

/**
 * Lambda関数のハンドラー
 * EventBridgeからのスケジュールイベントを受け取る
 */
export const handler = async (
  event: EventBridgeEvent<'Scheduled Event', never>
): Promise<void> => {
  console.log('Lambda function invoked');
  console.log('Event:', JSON.stringify(event, null, 2));

  // ダミー実装：メッセージをログ出力
  const message = {
    timestamp: new Date().toISOString(),
    source: event.source,
    time: event.time,
    message: 'Weather notification handler invoked successfully',
  };

  console.log('Output:', JSON.stringify(message, null, 2));

  // 正常終了
  console.log('Lambda function completed successfully');
};
