import logging
import requests
from telegram.ext import Updater, CommandHandler, MessageHandler, filters, CallbackQueryHandler, CallbackContext, InlineKeyboardButton, InlineKeyboardMarkup, Update

TOKEN = ''

logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def start(update: Update, context: CallbackContext):
    update.message.reply_text(
        'Selamat datang di bot Nonton Anime! Ketik judul anime yang ingin Anda cari.')


def search_anime(query):
    url = f'https://kitsu.io/api/edge/anime?filter[text]={query}'
    response = requests.get(url)
    result = response.json()
    return result['data']


def format_anime_info(anime):
    title = anime['attributes']['canonicalTitle']
    rating = anime['attributes']['averageRating']
    url = f"https://kitsu.io/anime/{anime['id']}"

    return f"Title: {title}\nRating: {rating}\nURL: {url}"


def handle_message(update: Update, context: CallbackContext):
    query = update.message.text
    anime_list = search_anime(query)

    if len(anime_list) == 0:
        update.message.reply_text('Tidak ada hasil yang ditemukan.')
    else:
        message = ''
        for anime in anime_list:
            message += format_anime_info(anime) + '\n\n'
        update.message.reply_text(message)


def main():
    updater = Updater(TOKEN, use_context=True)
    dp = updater.dispatcher

    dp.add_handler(CommandHandler('start', start))
    dp.add_handler(MessageHandler(filters.text & ~
                   filters.command, handle_message))

    updater.start_polling()
    logger.info('Bot started')
    updater.idle()


if __name__ == '__main__':
    main()
