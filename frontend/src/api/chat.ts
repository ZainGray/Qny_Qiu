import request from "@/utils/request";

const api_name = '/qny'

export default {
  // 流式聊天接口
  chatStream(data: { memoryId: number; message: string }) {
    return request({
      url: `${api_name}/chat`,
      method: 'post',
      data: data
    });
  },

  // 非流式聊天接口
  chatSync(data: { memoryId: number; message: string }) {
    return request({
      url: `${api_name}/chat-sync`,
      method: 'post',
      data: data
    });
  }
}