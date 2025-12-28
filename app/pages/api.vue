<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-8">API 管理</h1>

    <!-- 标签页 -->
    <div class="flex border-b border-gray-200 dark:border-gray-700 mb-6">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors"
        :class="activeTab === tab.id
          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 公共配置 -->
    <div v-show="activeTab === 'public'" class="space-y-6">
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">公共 API 配置 <span class="text-sm font-normal text-gray-500 dark:text-gray-400">- 访客上传使用</span></h2>

        <form @submit.prevent="savePublicConfig" class="space-y-4">
          <!-- 启用开关 -->
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">启用公共 API</label>
              <p class="text-xs text-gray-500 dark:text-gray-400">允许未登录用户上传图片</p>
            </div>
            <button
              type="button"
              @click="publicConfig.enabled = !publicConfig.enabled"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="publicConfig.enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="publicConfig.enabled ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>

          <!-- 允许的格式 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              允许的图片格式
            </label>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="format in availableFormats"
                :key="format"
                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors"
                :class="publicConfig.allowedFormats.includes(format)
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'"
              >
                <input
                  type="checkbox"
                  :value="format"
                  v-model="publicConfig.allowedFormats"
                  class="sr-only"
                />
                <span class="text-sm uppercase">{{ format }}</span>
              </label>
            </div>
          </div>

          <!-- 最大文件大小 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              最大文件大小 (MB)
            </label>
            <input
              type="number"
              v-model.number="publicConfigMaxSizeMB"
              min="1"
              max="100"
              class="input w-32"
            />
          </div>

          <!-- 压缩并转换为 WebP -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">压缩并转换为 WebP</label>
                <p class="text-xs text-gray-500 dark:text-gray-400">自动将上传的图片压缩并转换为 WebP 格式</p>
              </div>
              <button
                type="button"
                @click="publicConfig.compressToWebp = !publicConfig.compressToWebp"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="publicConfig.compressToWebp ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="publicConfig.compressToWebp ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </div>

            <div v-if="publicConfig.compressToWebp" class="ml-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                压缩质量 ({{ publicConfig.webpQuality }}%)
              </label>
              <input
                type="range"
                v-model.number="publicConfig.webpQuality"
                min="10"
                max="100"
                step="5"
                class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <!-- 频率限制 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              请求频率限制 (同一IP每分钟请求数)
            </label>
            <input
              type="number"
              v-model.number="publicConfig.rateLimit"
              min="1"
              max="1000"
              class="input w-32"
            />
          </div>

          <!-- 并发限制 -->
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">允许并发上传</label>
              <p class="text-xs text-gray-500 dark:text-gray-400">关闭后同一 IP 只能串行上传</p>
            </div>
            <button
              type="button"
              @click="publicConfig.allowConcurrent = !publicConfig.allowConcurrent"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="publicConfig.allowConcurrent ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="publicConfig.allowConcurrent ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>

          <div class="pt-4">
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? '保存中...' : '保存配置' }}
            </button>
          </div>
        </form>
      </div>

      <!-- 内容安全配置 -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Icon name="heroicons:exclamation-triangle" class="w-5 h-5 text-orange-500" />
            内容安全
          </h2>
          <button
            type="button"
            @click="toggleContentSafety"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            :class="publicConfig.contentSafety.enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
              :class="publicConfig.contentSafety.enabled ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">自动检测访客上传图片是否包含违规内容</p>

        <!-- 内容安全详细配置 -->
        <div v-if="publicConfig.contentSafety.enabled" class="space-y-4">
          <!-- 检测服务选择 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              检测服务
            </label>
            <select
              v-model="publicConfig.contentSafety.provider"
              class="input w-full max-w-xs"
            >
              <option value="nsfwdet">nsfwdet.com(公益) - 20张/ip/分钟</option>
              <option value="elysiatools">elysiatools.com(公益) - 未说明限制</option>
              <option value="nsfw_detector">nsfw_detector(开源) - 自建</option>
            </select>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">选择用于检测违规内容的API服务</p>
          </div>

          <!-- nsfwdet 配置 -->
          <div v-if="publicConfig.contentSafety.provider === 'nsfwdet'" class="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API 地址
              </label>
              <input
                type="text"
                v-model="publicConfig.contentSafety.providers.nsfwdet.apiUrl"
                class="input w-full"
                placeholder="https://nsfwdet.com/api/v1/detect-nsfw"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key
              </label>
              <input
                type="text"
                v-model="publicConfig.contentSafety.providers.nsfwdet.apiKey"
                class="input w-full"
                placeholder="nsfw_xxxxxxxx"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                用于API请求认证的密钥（默认使用厂商开放的公共密钥）
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                违规阈值 ({{ (publicConfig.contentSafety.providers.nsfwdet.threshold * 100).toFixed(0) }}%)
              </label>
              <input
                type="range"
                v-model.number="publicConfig.contentSafety.providers.nsfwdet.threshold"
                min="0.1"
                max="0.9"
                step="0.05"
                class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                当检测结果超过此阈值时，图片将被标记为违规并自动软删除
              </p>
            </div>
          </div>

          <!-- nsfw_detector 配置 -->
          <div v-if="publicConfig.contentSafety.provider === 'nsfw_detector'" class="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div class="flex items-center gap-2 mb-2">
              <Icon name="heroicons:server" class="w-4 h-4 text-blue-500" />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">自建服务配置 <a href="https://github.com/chaos-zhu/nsfw_detector" class="text-blue-500" target="_blank">开源地址</a></span>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API 地址 <span class="text-red-500">*</span>
              </label>
              <input
                type="text"
                v-model="publicConfig.contentSafety.providers['nsfw_detector'].apiUrl"
                class="input w-full"
                placeholder="http://your-server:port/check"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                自建 NSFW 检测服务的 API 地址（必填）
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key（Bearer Token）
              </label>
              <input
                type="text"
                v-model="publicConfig.contentSafety.providers['nsfw_detector'].apiKey"
                class="input w-full"
                placeholder="如需认证请填写，否则留空"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                用于 Authorization: Bearer 认证的密钥（可选）
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                违规阈值 ({{ (publicConfig.contentSafety.providers['nsfw_detector'].threshold * 100).toFixed(0) }}%)
              </label>
              <input
                type="range"
                v-model.number="publicConfig.contentSafety.providers['nsfw_detector'].threshold"
                min="0.1"
                max="0.99"
                step="0.01"
                class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                当检测结果的 nsfw 值超过此阈值时，图片将被标记为违规
              </p>
            </div>
          </div>

          <!-- 自动拉黑 IP -->
          <div class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">自动拉黑违规 IP</label>
              <p class="text-xs text-gray-500 dark:text-gray-400">检测到违规图片时，自动将上传者 IP 加入黑名单</p>
            </div>
            <button
              type="button"
              @click="publicConfig.contentSafety.autoBlacklistIp = !publicConfig.contentSafety.autoBlacklistIp"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="publicConfig.contentSafety.autoBlacklistIp ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="publicConfig.contentSafety.autoBlacklistIp ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>

          <div class="pt-4">
            <button @click="savePublicConfig" class="btn-primary" :disabled="saving">
              {{ saving ? '保存中...' : '保存配置' }}
            </button>
          </div>
        </div>
      </div>

      <!-- IP 黑名单 -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">IP 黑名单</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">被加入黑名单的访客IP将无法使用公共API上传图片</p>
          </div>
          <button
            @click="fetchBlacklist()"
            class="btn-secondary text-sm flex items-center justify-center gap-1 min-w-[90px]"
            :disabled="loadingBlacklist"
          >
            <Icon v-if="loadingBlacklist" name="heroicons:arrow-path" class="animate-spin h-4 w-4 shrink-0" />
            <span>{{ loadingBlacklist ? '刷新中' : '刷新列表' }}</span>
          </button>
        </div>

        <!-- 手动添加 IP -->
        <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">手动添加 IP</h3>
          <div class="flex gap-3">
            <input
              v-model="newBlacklistIp"
              type="text"
              class="input flex-1"
              placeholder="输入 IP 地址，如 192.168.1.1"
              @keyup.enter="addToBlacklistManual"
            />
            <input
              v-model="newBlacklistReason"
              type="text"
              class="input flex-1"
              placeholder="原因（可选）"
              @keyup.enter="addToBlacklistManual"
            />
            <button
              @click="addToBlacklistManual"
              class="btn-primary text-sm whitespace-nowrap"
              :disabled="!newBlacklistIp.trim() || addingToBlacklist"
            >
              {{ addingToBlacklist ? '添加中...' : '添加' }}
            </button>
          </div>
        </div>

        <!-- 列表容器 - 设置最小高度避免抖动 -->
        <div class="min-h-[200px]">
          <!-- 空状态 -->
          <div v-if="blacklist.length === 0 && !loadingBlacklist" class="text-center py-12">
            <Icon name="heroicons:shield-check" class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">黑名单为空</h3>
            <p class="text-gray-500 dark:text-gray-400">当前没有被禁止的 IP 地址</p>
          </div>

          <!-- 加载中（首次加载） -->
          <div v-else-if="loadingBlacklist && blacklist.length === 0" class="flex justify-center py-12">
            <Loading size="lg" />
          </div>

          <!-- 黑名单列表 -->
          <div v-else class="space-y-3 relative">
            <!-- 刷新时的遮罩层 -->
            <div v-if="loadingBlacklist" class="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10 rounded-lg">
              <Loading size="md" />
            </div>
          <div
            v-for="item in blacklist"
            :key="item._id"
            class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-mono font-medium text-gray-900 dark:text-white">{{ item.ip }}</span>
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                {{ item.reason || '未指定原因' }}
              </div>
              <div class="text-xs text-gray-400 mt-1">
                添加于 {{ formatDate(item.createdAt) }}
              </div>
            </div>
            <button
              @click="removeFromBlacklist(item)"
              class="btn-secondary text-sm ml-4"
            >
              移除
            </button>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="blacklistPagination.totalPages > 1" class="flex justify-center items-center gap-2 mt-6">
          <button
            @click="fetchBlacklist(blacklistPagination.page - 1)"
            :disabled="blacklistPagination.page <= 1"
            class="btn-secondary text-sm"
          >
            上一页
          </button>
          <span class="text-sm text-gray-600 dark:text-gray-400">
            {{ blacklistPagination.page }} / {{ blacklistPagination.totalPages }}
          </span>
          <button
            @click="fetchBlacklist(blacklistPagination.page + 1)"
            :disabled="blacklistPagination.page >= blacklistPagination.totalPages"
            class="btn-secondary text-sm"
          >
            下一页
          </button>
        </div>
      </div>
    </div>

    <!-- 私有 API 配置 -->
    <div v-show="activeTab === 'private'" class="space-y-6">
      <div class="card p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">私有 API 配置 <span class="text-sm font-normal text-gray-500 dark:text-gray-400">- 登录后使用</span></h2>

        <form @submit.prevent="savePrivateConfig" class="space-y-4">
          <!-- 最大文件大小 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              最大文件大小 (MB)
            </label>
            <input
              type="number"
              v-model.number="privateConfigMaxSizeMB"
              min="1"
              max="500"
              class="input w-32"
            />
          </div>

          <!-- 转换为 WebP -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">转换为 WebP</label>
                <p class="text-xs text-gray-500 dark:text-gray-400">将上传的图片转换为 WebP 格式</p>
              </div>
              <button
                type="button"
                @click="privateConfig.convertToWebp = !privateConfig.convertToWebp"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="privateConfig.convertToWebp ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="privateConfig.convertToWebp ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
            </div>

            <div v-if="privateConfig.convertToWebp" class="ml-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                压缩质量 ({{ privateConfig.webpQuality }}%)
              </label>
              <input
                type="range"
                v-model.number="privateConfig.webpQuality"
                min="10"
                max="100"
                step="5"
                class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          <!-- 首页展示 -->
          <div class="flex items-center justify-between">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">首页展示</label>
              <p class="text-xs text-gray-500 dark:text-gray-400">是否在首页展示私有上传的图片</p>
            </div>
            <button
              type="button"
              @click="privateConfig.showOnHomepage = !privateConfig.showOnHomepage"
              class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              :class="privateConfig.showOnHomepage ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'"
            >
              <span
                class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                :class="privateConfig.showOnHomepage ? 'translate-x-6' : 'translate-x-1'"
              />
            </button>
          </div>

          <div class="pt-4">
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? '保存中...' : '保存配置' }}
            </button>
          </div>
        </form>
      </div>

      <!-- ApiKey 管理 -->
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">ApiKey 管理</h2>
          <button @click="showAddKeyModal = true" class="btn-primary text-sm">
            添加 ApiKey
          </button>
        </div>

        <div class="space-y-3">
          <div
            v-for="key in apiKeys"
            :key="key.id"
            class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900 dark:text-white">{{ key.name }}</span>
                <span
                  v-if="key.isDefault"
                  class="px-2 py-0.5 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded"
                >
                  默认
                </span>
              </div>
              <div class="flex items-center gap-2 mt-1">
                <code class="text-sm text-gray-500 dark:text-gray-400 font-mono truncate">
                  {{ showKeyId === key.id ? key.key : maskKey(key.key) }}
                </code>
                <button
                  @click="toggleShowKey(key.id)"
                  class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Icon v-if="showKeyId === key.id" name="heroicons:eye-slash" class="w-4 h-4" />
                  <Icon v-else name="heroicons:eye" class="w-4 h-4" />
                </button>
                <button
                  @click="copyApiKey(key.key)"
                  class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="复制"
                >
                  <Icon name="heroicons:clipboard-document" class="w-4 h-4" />
                </button>
              </div>
              <div class="text-xs text-gray-400 mt-1">
                创建于 {{ formatDate(key.createdAt) }}
              </div>
            </div>
            <div class="flex items-center gap-2 ml-4">
              <button
                v-if="key.isDefault"
                @click="regenerateKey(key)"
                class="btn-secondary text-sm"
                title="重新生成"
              >
                刷新
              </button>
              <button
                v-if="!key.isDefault"
                @click="confirmDeleteKey(key)"
                class="btn-danger text-sm"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- API 文档 -->
    <div v-show="activeTab === 'docs'" class="space-y-4">
      <!-- 上传 API -->
      <div class="card p-5">
        <div class="flex items-center gap-3 mb-4">
          <div class="p-1.5 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <Icon name="heroicons:cloud-arrow-up" class="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">上传 API</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">支持公共和私有两种上传方式</p>
          </div>
        </div>

        <!-- API 端点列表 -->
        <div class="space-y-2 mb-4">
          <div class="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Icon name="heroicons:globe-alt" class="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-1.5 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">POST</span>
                <code class="text-sm text-gray-700 dark:text-gray-300 font-mono truncate">{{ baseUrl }}/api/upload/public</code>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">公共上传 - 无需认证</p>
            </div>
          </div>
          <div class="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <Icon name="heroicons:lock-closed" class="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="px-1.5 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">POST</span>
                <code class="text-sm text-gray-700 dark:text-gray-300 font-mono truncate">{{ baseUrl }}/api/upload/private</code>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">私有上传 - 需要 <code class="text-purple-600 dark:text-purple-400">X-API-Key</code> 请求头</p>
            </div>
          </div>
        </div>

        <!-- 请求参数 -->
        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">请求参数</h4>
          <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <code class="text-sm text-gray-700 dark:text-gray-300">Content-Type: multipart/form-data</code><br/>
            <code class="text-sm text-gray-700 dark:text-gray-300">file: 图片文件</code>
          </div>
        </div>

        <!-- cURL 示例 -->
        <div class="mb-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">cURL 示例</h4>
          <div class="relative">
            <pre class="bg-gray-900 text-gray-100 rounded-lg p-3 text-sm overflow-x-auto"><code><span class="text-gray-500"># 公共上传</span>
curl -X POST "{{ baseUrl }}/api/upload/public" -F "file=@image.jpg"

<span class="text-gray-500"># 私有上传</span>
curl -X POST "{{ baseUrl }}/api/upload/private" -H "X-API-Key: your-key" -F "file=@image.jpg"</code></pre>
            <button
              @click="copyCode('curl-all')"
              class="absolute top-1.5 right-1.5 p-1.5 text-gray-400 hover:text-white transition-colors"
              title="复制代码"
            >
              <Icon name="heroicons:clipboard-document" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- JavaScript 示例 -->
        <div>
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">JavaScript 示例</h4>
          <div class="relative">
            <pre class="bg-gray-900 text-gray-100 rounded-lg p-3 text-sm overflow-x-auto"><code>const formData = new FormData();
formData.append('file', fileInput.files[0]);

<span class="text-gray-500">// 公共上传</span>
fetch('{{ baseUrl }}/api/upload/public', { method: 'POST', body: formData });

<span class="text-gray-500">// 私有上传</span>
fetch('{{ baseUrl }}/api/upload/private', {
  method: 'POST',
  headers: { 'X-API-Key': 'your-key' },
  body: formData
});</code></pre>
            <button
              @click="copyCode('js-all')"
              class="absolute top-1.5 right-1.5 p-1.5 text-gray-400 hover:text-white transition-colors"
              title="复制代码"
            >
              <Icon name="heroicons:clipboard-document" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- 响应格式 -->
      <div class="card p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Icon name="heroicons:arrow-down-tray" class="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">响应格式</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">上传成功后的返回数据结构</p>
          </div>
        </div>

        <div class="relative">
          <pre class="bg-gray-900 text-gray-100 rounded-lg p-3 text-sm overflow-x-auto"><code>{
  "success": true,
  "data": {
    "id": "image-uuid",
    "url": "{{ baseUrl }}/i/image-uuid.webp",
    "filename": "original-filename.jpg",
    "size": 123456,
    "width": 1920,
    "height": 1080,
    "format": "webp",
    "isWebp": true
  }
}</code></pre>
          <button
            @click="copyCode('response')"
            class="absolute top-1.5 right-1.5 p-1.5 text-gray-400 hover:text-white transition-colors"
            title="复制代码"
          >
            <Icon name="heroicons:clipboard-document" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- 添加 ApiKey 弹窗 -->
    <Modal
      :visible="showAddKeyModal"
      title="添加 ApiKey"
      @close="showAddKeyModal = false"
      @confirm="addApiKey"
    >
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          名称
        </label>
        <input
          v-model="newKeyName"
          type="text"
          class="input"
          placeholder="请输入 ApiKey 名称"
        />
      </div>
    </Modal>

    <!-- 删除 ApiKey 确认弹窗 -->
    <Modal
      :visible="showDeleteKeyModal"
      title="确认删除"
      confirm-text="删除"
      confirm-type="danger"
      @close="showDeleteKeyModal = false"
      @confirm="deleteApiKey"
    >
      <p class="text-gray-600 dark:text-gray-400">
        确定要删除 ApiKey "{{ keyToDelete?.name }}" 吗？此操作不可恢复。
      </p>
    </Modal>

    <!-- 刷新 ApiKey 确认弹窗 -->
    <Modal
      :visible="showRegenerateKeyModal"
      title="确认刷新"
      confirm-text="刷新"
      confirm-type="danger"
      @close="showRegenerateKeyModal = false"
      @confirm="doRegenerateKey"
    >
      <p class="text-gray-600 dark:text-gray-400">
        确定要刷新 "{{ keyToRegenerate?.name }}" 吗？
      </p>
      <p class="text-red-500 dark:text-red-400 mt-2 font-medium">
        ⚠️ 刷新后原来的 Key 将立即失效
      </p>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useSettingsStore } from '~/stores/settings'
import { useToastStore } from '~/stores/toast'
import { copyToClipboard } from '../utils/clipboard'

// 使用认证中间件
definePageMeta({
  middleware: 'auth'
})

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const toastStore = useToastStore()

// 标签页
const tabs = [
  { id: 'public', label: '公共配置' },
  { id: 'private', label: '私有配置' },
  { id: 'docs', label: 'API文档' }
]
const activeTab = ref('public')

// 可用格式
const availableFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'avif', 'svg', 'bmp', 'ico', 'apng', 'tiff', 'tif']

// 基础 URL
const baseUrl = computed(() => {
  if (import.meta.client) {
    return window.location.origin
  }
  return ''
})

// 状态
const saving = ref(false)
const showKeyId = ref(null)
const showAddKeyModal = ref(false)
const showDeleteKeyModal = ref(false)
const showRegenerateKeyModal = ref(false)
const newKeyName = ref('')
const keyToDelete = ref(null)
const keyToRegenerate = ref(null)

// IP 黑名单相关
const blacklist = ref([])
const blacklistPagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 })
const loadingBlacklist = ref(false)
const newBlacklistIp = ref('')
const newBlacklistReason = ref('')
const addingToBlacklist = ref(false)

// 默认的内容安全配置（与后端 moderation.js 保持一致）
const defaultContentSafetyConfig = {
  enabled: false,
  provider: 'elysiatools',  // 默认使用免费的 elysiatools
  autoBlacklistIp: false,  // 自动拉黑违规 IP
  providers: {
    nsfwdet: {
      name: 'NSFW Detector',
      apiUrl: 'https://nsfwdet.com/api/v1/detect-nsfw',
      apiKey: 'nsfw_2f7ab4f1d743d69ee242eec932b19671',  // 厂商开放的默认 API Key
      threshold: 0.5
    },
    elysiatools: {
      name: 'Elysia Tools',
      apiUrl: 'https://elysiatools.com/zh/api/tools/nsfw-image-detector'
    },
    'nsfw_detector': {
      name: 'nsfw_detector',
      apiUrl: '',  // 需在设置中自行配置
      apiKey: '',  // 如需认证需自行配置
      threshold: 0.8  // 违规阈值，默认80%
    }
  }
}

// 公共 API 配置
const publicConfig = reactive({
  enabled: true,
  allowedFormats: ['jpeg', 'jpg', 'png', 'gif', 'webp', 'avif', 'svg', 'bmp', 'ico', 'apng', 'tiff', 'tif'],
  maxFileSize: 10 * 1024 * 1024,
  compressToWebp: true,
  webpQuality: 80,
  rateLimit: 10,
  allowConcurrent: false,
  contentSafety: { ...defaultContentSafetyConfig }
})

// 私有 API 配置
const privateConfig = reactive({
  maxFileSize: 100 * 1024 * 1024,
  convertToWebp: false,
  webpQuality: 80,
  showOnHomepage: false
})

// ApiKey 列表
const apiKeys = computed(() => settingsStore.apiKeys)

// 文件大小转换（MB）
const publicConfigMaxSizeMB = computed({
  get: () => Math.round(publicConfig.maxFileSize / (1024 * 1024)),
  set: (val) => { publicConfig.maxFileSize = val * 1024 * 1024 }
})

const privateConfigMaxSizeMB = computed({
  get: () => Math.round(privateConfig.maxFileSize / (1024 * 1024)),
  set: (val) => { privateConfig.maxFileSize = val * 1024 * 1024 }
})

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 遮蔽 ApiKey
function maskKey(key) {
  if (!key || key.length < 8) return key
  return key.slice(0, 4) + '****' + key.slice(-4)
}

// 切换显示 ApiKey
function toggleShowKey(id) {
  showKeyId.value = showKeyId.value === id ? null : id
}

// 复制 ApiKey
function copyApiKey(key) {
  copyToClipboard(key).then(() => {
    toastStore.success('ApiKey 已复制到剪贴板')
  }).catch(() => {
    toastStore.error('复制失败')
  })
}

// 复制代码
function copyCode(type) {
  let code = ''
  switch (type) {
    case 'curl-all':
      code = `# 公共上传
curl -X POST "${baseUrl.value}/api/upload/public" -F "file=@image.jpg"

# 私有上传
curl -X POST "${baseUrl.value}/api/upload/private" -H "X-API-Key: your-key" -F "file=@image.jpg"`
      break
    case 'js-all':
      code = `const formData = new FormData();
formData.append('file', fileInput.files[0]);

// 公共上传
fetch('${baseUrl.value}/api/upload/public', { method: 'POST', body: formData });

// 私有上传
fetch('${baseUrl.value}/api/upload/private', {
  method: 'POST',
  headers: { 'X-API-Key': 'your-key' },
  body: formData
});`
      break
    case 'response':
      code = `{
  "success": true,
  "data": {
    "id": "image-uuid",
    "url": "${baseUrl.value}/i/image-uuid.webp",
    "filename": "original-filename.jpg",
    "size": 123456,
    "width": 1920,
    "height": 1080,
    "format": "webp",
    "isWebp": true
  }
}`
      break
  }

  copyToClipboard(code).then(() => {
    toastStore.success('代码已复制到剪贴板')
  }).catch(() => {
    toastStore.error('复制失败')
  })
}

// 切换内容安全开关（关闭时自动保存）
async function toggleContentSafety() {
  publicConfig.contentSafety.enabled = !publicConfig.contentSafety.enabled

  // 如果是关闭操作，自动保存配置
  if (!publicConfig.contentSafety.enabled) {
    await savePublicConfig()
  }
}

// 保存公共 API 配置
async function savePublicConfig() {
  saving.value = true
  try {
    const result = await settingsStore.savePublicApiConfig({
      enabled: publicConfig.enabled,
      allowedFormats: publicConfig.allowedFormats,
      maxFileSize: publicConfig.maxFileSize,
      compressToWebp: publicConfig.compressToWebp,
      webpQuality: publicConfig.webpQuality,
      rateLimit: publicConfig.rateLimit,
      allowConcurrent: publicConfig.allowConcurrent,
      contentSafety: publicConfig.contentSafety
    })

    if (result.success) {
      toastStore.success('配置已保存')
    } else {
      toastStore.error(result.message || '保存失败')
    }
  } catch (error) {
    toastStore.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 保存私有 API 配置
async function savePrivateConfig() {
  saving.value = true
  try {
    const result = await settingsStore.savePrivateApiConfig({
      maxFileSize: privateConfig.maxFileSize,
      convertToWebp: privateConfig.convertToWebp,
      webpQuality: privateConfig.webpQuality,
      showOnHomepage: privateConfig.showOnHomepage
    })

    if (result.success) {
      toastStore.success('配置已保存')
    } else {
      toastStore.error(result.message || '保存失败')
    }
  } catch (error) {
    toastStore.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 添加 ApiKey
async function addApiKey() {
  if (!newKeyName.value.trim()) {
    toastStore.error('请输入 ApiKey 名称')
    return
  }

  const result = await settingsStore.createApiKey(newKeyName.value.trim())
  if (result.success) {
    toastStore.success('ApiKey 已创建')
    showAddKeyModal.value = false
    newKeyName.value = ''
  } else {
    toastStore.error(result.message || '创建失败')
  }
}

// 确认重新生成 ApiKey
function regenerateKey(key) {
  keyToRegenerate.value = key
  showRegenerateKeyModal.value = true
}

// 执行重新生成 ApiKey
async function doRegenerateKey() {
  if (!keyToRegenerate.value) return

  const result = await settingsStore.updateApiKey(keyToRegenerate.value.id, { regenerate: true })
  if (result.success) {
    toastStore.success('ApiKey 已更新，旧 Key 已失效')
  } else {
    toastStore.error(result.message || '更新失败')
  }

  showRegenerateKeyModal.value = false
  keyToRegenerate.value = null
}

// 确认删除 ApiKey
function confirmDeleteKey(key) {
  keyToDelete.value = key
  showDeleteKeyModal.value = true
}

// 删除 ApiKey
async function deleteApiKey() {
  if (!keyToDelete.value) return

  const result = await settingsStore.deleteApiKey(keyToDelete.value.id)
  if (result.success) {
    toastStore.success('ApiKey 已删除')
  } else {
    toastStore.error(result.message || '删除失败')
  }

  showDeleteKeyModal.value = false
  keyToDelete.value = null
}

// 获取黑名单列表
async function fetchBlacklist(page = 1) {
  loadingBlacklist.value = true
  try {
    const response = await $fetch('/api/blacklist', {
      params: { page, limit: 20 },
      headers: authStore.authHeader
    })

    if (response.success && response.data) {
      blacklist.value = response.data.records
      blacklistPagination.value = response.data.pagination
    }
  } catch (error) {
    console.error('获取黑名单失败:', error)
    toastStore.error('获取黑名单失败')
  } finally {
    loadingBlacklist.value = false
  }
}

// 手动添加到黑名单
async function addToBlacklistManual() {
  if (!newBlacklistIp.value.trim()) {
    toastStore.error('请输入 IP 地址')
    return
  }

  addingToBlacklist.value = true
  try {
    const response = await $fetch('/api/blacklist', {
      method: 'POST',
      headers: authStore.authHeader,
      body: {
        ip: newBlacklistIp.value.trim(),
        reason: newBlacklistReason.value.trim() || '手动添加'
      }
    })

    if (response.success) {
      toastStore.success(response.message || `IP ${newBlacklistIp.value} 已添加到黑名单`)
      newBlacklistIp.value = ''
      newBlacklistReason.value = ''
      // 刷新列表
      await fetchBlacklist(1)
    } else {
      toastStore.error(response.message || '添加失败')
    }
  } catch (error) {
    console.error('添加黑名单失败:', error)
    toastStore.error(error.data?.message || '添加失败')
  } finally {
    addingToBlacklist.value = false
  }
}

// 从黑名单移除
async function removeFromBlacklist(item) {
  try {
    const response = await $fetch(`/api/blacklist/${item._id}`, {
      method: 'DELETE',
      headers: authStore.authHeader
    })

    if (response.success) {
      toastStore.success(`IP ${item.ip} 已从黑名单中移除`)
      // 刷新列表
      await fetchBlacklist(blacklistPagination.value.page)
    } else {
      toastStore.error(response.message || '移除失败')
    }
  } catch (error) {
    console.error('移除黑名单失败:', error)
    toastStore.error('移除失败')
  }
}

// 初始化
onMounted(async () => {
  // 获取配置（authStore.init() 已在插件中调用）
  await Promise.all([
    settingsStore.fetchPublicApiConfig(),
    settingsStore.fetchPrivateApiConfig(),
    settingsStore.fetchApiKeys()
  ])

  // 同步配置到本地状态
  const fetchedPublicConfig = settingsStore.publicApiConfig
  Object.assign(publicConfig, fetchedPublicConfig)

  // 确保内容安全配置存在（使用默认配置作为回退）
  if (!publicConfig.contentSafety) {
    publicConfig.contentSafety = { ...defaultContentSafetyConfig }
  }

  // 确保 autoBlacklistIp 存在
  if (publicConfig.contentSafety.autoBlacklistIp === undefined) {
    publicConfig.contentSafety.autoBlacklistIp = false
  }

  // 确保所有 provider 配置存在（兼容新增的 provider）
  if (!publicConfig.contentSafety.providers) {
    publicConfig.contentSafety.providers = { ...defaultContentSafetyConfig.providers }
  } else {
    // 确保 nsfw_detector 配置存在
    if (!publicConfig.contentSafety.providers['nsfw_detector']) {
      publicConfig.contentSafety.providers['nsfw_detector'] = {
        name: 'nsfw_detector',
        apiUrl: '',
        apiKey: '',
        threshold: 0.8
      }
    } else if (publicConfig.contentSafety.providers['nsfw_detector'].threshold === undefined) {
      // 确保 threshold 存在（兼容旧配置）
      publicConfig.contentSafety.providers['nsfw_detector'].threshold = 0.8
    }
  }

  Object.assign(privateConfig, settingsStore.privateApiConfig)

  // 获取黑名单列表
  await fetchBlacklist()
})
</script>