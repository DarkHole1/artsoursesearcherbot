import { autoQuote } from "@roziscoding/grammy-autoquote";
import { Bot, Context, InlineKeyboard } from "grammy"
import { z } from "zod"
import { Config } from "./config"
import { FileFlavor, hydrateFiles } from "@grammyjs/files"
import * as fs from 'fs/promises'
import * as fs2 from 'node:fs'
import * as iqdb from '@l2studio/iqdb-api'
import sagiri from "sagiri"

const config = new Config()
const bot = new Bot<FileFlavor<Context>>(config.TELEGRAM_TOKEN)

bot.api.config.use(hydrateFiles(config.TELEGRAM_TOKEN))
bot.use(autoQuote)

const client = sagiri(config.SAGIRI_TOKEN)

bot.on(':photo', ctx => ctx.reply('Select method of searching', {
    reply_markup: new InlineKeyboard().text('IQDB', 'iqdb').text('SauceNAO', 'saucenao')
}))

bot.callbackQuery('iqdb', async ctx => {
    const message = ctx.callbackQuery.message
    if (!message || !message.reply_to_message || !message.reply_to_message.photo) {
        await ctx.answerCallbackQuery('Something went wrong')
        return
    }
    const photos = message.reply_to_message.photo
    const photo = photos[photos.length - 1]

    await ctx.answerCallbackQuery('Started searching with IQBD')

    const file = await ctx.api.getFile(photo.file_id)
    const path = await file.download()

    try {
        const res = await iqdb.search(fs2.createReadStream(path))
        await ctx.editMessageText(`IQDB matches\n${res.results.map(match => `[${match.similarity}%] - ${match.sources[0].fixedHref}`).join('\n')}`)
    } finally {
        await fs.unlink(path)
    }
})

bot.callbackQuery('saucenao', async ctx => {
    const message = ctx.callbackQuery.message
    if (!message || !message.reply_to_message || !message.reply_to_message.photo) {
        await ctx.answerCallbackQuery('Something went wrong')
        return
    }
    const photos = message.reply_to_message.photo
    const photo = photos[photos.length - 1]

    await ctx.answerCallbackQuery('Started searching with SauceNAO')

    const file = await ctx.api.getFile(photo.file_id)
    const path = await file.download()

    try {
        const res = await client(fs2.createReadStream(path))
        await ctx.editMessageText(`SauceNAO matches\n${res.map(match => `[${match.similarity}%] - ${match.url}`).join('\n')}`)
    } finally {
        await fs.unlink(path)
    }
})

bot.start()
