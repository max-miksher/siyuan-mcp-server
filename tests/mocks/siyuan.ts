/**
 * Mock for SiYuan module
 */

export interface IWebSocketData {
  code: number;
  msg: string;
  data: any;
}

export const fetchSyncPost = jest.fn(async (url: string, data: any): Promise<IWebSocketData> => {
  return {
    code: 0,
    msg: 'success',
    data: {}
  };
});

export default {
  fetchSyncPost
}; 