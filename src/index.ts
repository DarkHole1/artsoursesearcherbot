import { autoQuote } from "@roziscoding/grammy-autoquote";
import { Bot, Context, InlineKeyboard } from "grammy"
import { z } from "zod"
import { Config } from "./config"
import { FileFlavor, hydrateFiles } from "@grammyjs/files"
import * as fs from 'fs/promises'
import * as fs2 from 'node:fs'
import * as iqdb from '@l2studio/iqdb-api'
import sagiri from "sagiri"

const LOW_SIMILARITY = 70

const config = new Config()
const bot = new Bot<FileFlavor<Context>>(config.TELEGRAM_TOKEN)

bot.api.config.use(hydrateFiles(config.TELEGRAM_TOKEN))
bot.use(autoQuote)

const client = sagiri(config.SAGIRI_TOKEN)

const backKeyboard = new InlineKeyboard().text('Back', 'back')
const selectKeyboard = new InlineKeyboard().text('IQDB', 'iqdb').text('SauceNAO', 'saucenao')

bot.on(':photo', ctx => ctx.reply('Select method of searching', {
    reply_markup: selectKeyboard
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
        let message = 'IQDB matches\n'
        message += res.results
            .filter(match => match.similarity >= LOW_SIMILARITY)
            .map(match => `[${match.similarity}%] - ${match.sources[0].fixedHref}`)
            .join('\n')
        if(res.results.some(match => match.similarity < LOW_SIMILARITY)) {
            message += '\nLow similarity results hidden'
        }

        await ctx.editMessageText(message, {
            reply_markup: backKeyboard
        })
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
        let message = 'SauceNAO matches\n'
        message += res
            .filter(match => match.similarity >= LOW_SIMILARITY)
            .map(match => `[${match.similarity}%] - ${match.url}`).join('\n')
        if(res.some(match => match.similarity < LOW_SIMILARITY)) {
            message += '\nLow similarity results hidden'
        }
        await ctx.editMessageText(message, {
            reply_markup: backKeyboard
        })
    } finally {
        await fs.unlink(path)
    }
})

bot.callbackQuery('back', ctx => ctx.editMessageText('Select method of searching', {
    reply_markup: selectKeyboard
}))

bot.start()
