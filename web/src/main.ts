import { Config } from './config.js'
import { getChosenStorageAdapter } from './helpers.js'

console.log(await Config.all('profiles'))

const config = await Config.init('owo', 'profiles')
const storage = await getChosenStorageAdapter(config)

await storage.save('test', 'owo')
