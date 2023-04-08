import * as dotenv from 'dotenv'
import { z } from 'zod'

const RawConfig = z.object({
    SAGIRI_TOKEN: z.string().nonempty(),
    TELEGRAM_TOKEN: z.string().nonempty()
})
type RawConfig = z.infer<typeof RawConfig>

export class Config implements RawConfig {
    SAGIRI_TOKEN: string
    TELEGRAM_TOKEN: string
    
    constructor() {
        const config = dotenv.config()
        if(config.error) {
            throw config.error
        }

        const parsed = RawConfig.parse(config.parsed)
        this.SAGIRI_TOKEN = parsed.SAGIRI_TOKEN
        this.TELEGRAM_TOKEN = parsed.TELEGRAM_TOKEN
    }
}