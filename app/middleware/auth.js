// 路由守卫中间件 - 保护需要登录的页面
export default defineNuxtRouteMiddleware((to, from) => {
  // 需要登录的页面
  const protectedRoutes = ['/api', '/settings', '/stats']

  // 检查是否是受保护的路由
  const isProtectedRoute = protectedRoutes.some(route => to.path.startsWith(route))

  if (!isProtectedRoute) {
    return
  }

  // 仅在客户端检查
  if (import.meta.client) {
    const token = localStorage.getItem('token')

    if (!token) {
      // 未登录，重定向到登录页
      return navigateTo('/login')
    }
  }
})