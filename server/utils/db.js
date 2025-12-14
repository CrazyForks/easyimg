import Datastore from '@seald-io/nedb'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync, mkdirSync } from 'fs'

// 获取项目根目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const dataDir = join(__dirname, '../../db')

// 确保 db 目录存在
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

// 创建数据库实例
const users = new Datastore({
  filename: join(dataDir, 'users.db'),
  autoload: true
})

const images = new Datastore({
  filename: join(dataDir, 'images.db'),
  autoload: true
})

const apikeys = new Datastore({
  filename: join(dataDir, 'apikeys.db'),
  autoload: true
})

const settings = new Datastore({
  filename: join(dataDir, 'settings.db'),
  autoload: true
})

// 内容审核任务表
const moderationTasks = new Datastore({
  filename: join(dataDir, 'moderation_tasks.db'),
  autoload: true
})

// IP 黑名单表
const ipBlacklist = new Datastore({
  filename: join(dataDir, 'ip_blacklist.db'),
  autoload: true
})

// Promise 化数据库操作
const promisify = (db) => ({
  findOne: (query) => db.findOneAsync(query),
  find: (query) => db.findAsync(query),
  insert: (doc) => db.insertAsync(doc),
  update: (query, update, options = {}) => db.updateAsync(query, update, options),
  remove: (query, options = {}) => db.removeAsync(query, options),
  count: (query) => db.countAsync(query),
  ensureIndex: (options) => db.ensureIndexAsync(options)
})

export const db = {
  users: promisify(users),
  images: promisify(images),
  apikeys: promisify(apikeys),
  settings: promisify(settings),
  moderationTasks: promisify(moderationTasks),
  ipBlacklist: promisify(ipBlacklist)
}

export default db
