require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');



// Token bot Telegram Anda
const token = process.env.TOKEN;

// Membuat objek bot
const bot = new TelegramBot(token, { polling: true });

// Menangani perintah '/start'
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = 'Halo! Selamat datang di PRA Anime Info.\n\n Kirimkan /info [judul_anime] untuk mendapatkan informasi tentang anime.\n Kirimkan /search [query] [pageNumber] untuk mencari daftar anime.\n Kirimkan /recommend untuk mendapatkan rekomendasi anime.\n Kirimkan /animenew [pageNumber] untuk mendapatkan update anime.\n Kirimkan /animetop [pageNumber] untuk mendapatkan top anime.';
  bot.sendMessage(chatId, welcomeMessage);
});

// Menangani perintah '/info'
bot.onText(/\/info (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const animeTitle = match[1];

  try {
    // Mengambil informasi anime dari API
    const response = await axios.get(`https://api.consumet.org/anime/gogoanime/info/${animeTitle}`);

    if (response.status === 200) {
      const animeInfo = response.data;
      const infoMessage = `
        Judul:   ${animeInfo.title}
Date:    ${animeInfo.releaseDate}
Genre:   ${animeInfo.genres.join(', ')}
Episode: ${animeInfo.totalEpisodes}
Status:  ${animeInfo.status}
      `;
      const photoUrl = animeInfo.image;

      // Mengirimkan pesan teks dan gambar preview
      bot.sendPhoto(chatId, photoUrl, { caption: infoMessage });
    } else {
      throw new Error('Gagal mengambil informasi anime.');
    }
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, 'Terjadi kesalahan saat memuat informasi anime harap masukan id-anime. Silahkan kirimkan /search [judul anime] terlebih dahulu kemudian akan muncul url https://gogoanime.cl//category/id-anime\n\n Example: https://gogoanime.cl//category/spy-x-family\n\n Maka ketikan /info spy-x-family');
  }
});

// Menangani perintah '/search'
bot.onText(/\/search (.+) (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1];
  const pageNumber = match[2];

  try {
    // Memastikan pageNumber berupa angka
    if (isNaN(pageNumber)) {
      throw new Error('Ketikan /search [keyword-judul] [page].');
    }

    // Mengambil daftar anime dari API
    const response = await axios.get(`https://api.consumet.org/anime/gogoanime/${query}?page=${pageNumber}`);

    if (response.status === 200) {
      const animeList = response.data.results;

      // Memastikan ada hasil anime
      if (animeList.length === 0) {
        throw new Error('Tidak ada hasil anime ditemukan.');
      }

      let listMessage = 'Hasil Pencarian Anime:\n\n';
      
      // Membuat daftar anime
      animeList.forEach((anime, index) => {
        listMessage += `${index + 1}. ${anime.title}\nURL: ${anime.url}\n\n`;
      });

      bot.sendMessage(chatId, listMessage);
    } else {
      throw new Error('Gagal mencari daftar anime.');
    }
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, error.message);
  }
});


// Menangani perintah '/recommend'
bot.onText(/\/recommend/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    const response = await axios.get('https://api.consumet.org/anime/gogoanime/top-airing');
    const animeList = response.data.results;

    if (animeList.length === 0) {
      bot.sendMessage(chatId, 'Kirimkan /recommend untuk mendapatkan rekomendasi anime.');
      return;
    }

    // Menghitung jumlah halaman
    const totalPages = response.data.currentPage.totalPages;

    // Mendapatkan nomor halaman secara acak
    const pageNumber = Math.floor(Math.random() * totalPages) + 1;

    // Mengambil daftar anime dari halaman yang dipilih secara acak
    const responseRandomPage = await axios.get(`https://api.consumet.org/anime/gogoanime/top-airing?page=${pageNumber}`);
    const animeListRandomPage = responseRandomPage.data.results;

    // Memilih satu anime secara acak dari daftar anime
    const randomIndex = Math.floor(Math.random() * animeListRandomPage.length);
    const randomAnime = animeListRandomPage[randomIndex];
    const { title, image, url, genres } = randomAnime;

    const message = `
      I recommend you watch:
Title: ${title}
Genre: ${genres.join(', ')}
URL: ${url}
    `;

    // Mengirimkan pesan teks dan gambar preview
    bot.sendPhoto(chatId, image, { caption: message });
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, 'Failed to recommend anime.');
  }
});




// Menangani perintah '/animenew'
bot.onText(/\/animenew (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const pageNumber = match[1];

  try {
    // Memastikan pageNumber berupa angka
    if (isNaN(pageNumber)) {
      throw new Error('Kirimkan /animenew [pageNumber] untuk mendapatkan update anime.');
    }

    // Mengambil daftar anime terbaru dari API
    const response = await axios.get(`https://api.consumet.org/anime/gogoanime/recent-episodes?page=${pageNumber}`);

    if (response.status === 200) {
      const recentAnimeList = response.data.results;
      let listMessage = 'Daftar Anime Terbaru:\n\n';

      // Memastikan ada hasil anime terbaru
      if (recentAnimeList.length === 0) {
        throw new Error('Tidak ada anime terbaru ditemukan.');
      }

      // Membuat daftar anime terbaru
      recentAnimeList.forEach((anime, index) => {
        listMessage += `${index + 1}. ${anime.title}\nEpisode: ${anime.episode}\nURL: ${anime.url}\n\n`;
      });

      bot.sendMessage(chatId, listMessage);
    } else {
      throw new Error('Gagal mengambil daftar anime terbaru.');
    }
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, error.message);
  }
});

// Menangani perintah '/top'
bot.onText(/\/animetop (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const pageNumber = match[1];

  try {
    // Memastikan pageNumber berupa angka
    if (isNaN(pageNumber)) {
      throw new Error('Kirimkan /animetop [pageNumber] untuk mendapatkan top anime.');
    }

    // Mengambil daftar top anime dari API
    const response = await axios.get(`https://api.consumet.org/anime/gogoanime/top-airing?page=${pageNumber}`);

    if (response.status === 200) {
      const topAnimeList = response.data.results;
      let listMessage = 'Daftar Top Anime:\n\n';

      // Memastikan ada hasil top anime
      if (topAnimeList.length === 0) {
        throw new Error('Tidak ada top anime ditemukan.');
      }

      // Membuat daftar top anime
      topAnimeList.forEach((anime, index) => {
        listMessage += `${index + 1}. ${anime.title}\nRating: ${anime.rating}\nURL: ${anime.url}\n\n`;
      });

      bot.sendMessage(chatId, listMessage);
    } else {
      throw new Error('Gagal mengambil daftar top anime.');
    }
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, error.message);
  }
});