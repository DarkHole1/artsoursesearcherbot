import { autoQuote } from "@roziscoding/grammy-autoquote";
import { Bot, Context } from "grammy"
import { z } from "zod"
import { Config } from "./config"
import { FileFlavor, hydrateFiles } from "@grammyjs/files"
import * as fs from 'fs/promises'
import * as fs2 from 'node:fs'
import * as iqdb from '@l2studio/iqdb-api'


const ProcessType = z.enum(['iqdb', 'saucenao']).catch('iqdb')
type ProcessType = z.infer<typeof ProcessType>

const config = new Config()
const bot = new Bot<FileFlavor<Context>>(config.TELEGRAM_TOKEN)

bot.api.config.use(hydrateFiles(config.TELEGRAM_TOKEN))
bot.use(autoQuote)

bot.on(':photo', async ctx => {
    const processType = ProcessType.parse(ctx.message?.caption)
    // await ctx.reply(`Started processing with ${processType}`)
    // console.log(ctx.message?.photo)
    console.log('File finding')
    const file = await ctx.getFile()
    console.log(`File`, file)
    const path = await file.download()
    try {
        console.log(path)
        switch(processType) {
            case 'iqdb':
                const res = await iqdb.search(fs2.createReadStream(path))
                ctx.reply(`IQDB matches\n${
                    res.results.map(match => `${match.match} [${match.similarity}%] - ${match.sources[0].fixedHref}`).join('\n')
                }`)
                break;
            case 'saucenao':
                ctx.reply('Saucenao currently not supported')
                break
        }
    } finally {
        await fs.unlink(path)
    }
})

bot.start()
