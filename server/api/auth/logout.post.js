export default defineEventHandler(async (event) => {
  // JWT 是无状态的，登出只需要前端删除 token 即可
  // 这里返回成功响应
  return {
    success: true,
    message: '登出成功'
  }
})
