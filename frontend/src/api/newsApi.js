import api from './axios';

export function getNews(params = {}) {
  return api.get('/news', { params });
}

export function getNewsArticle(slug) {
  return api.get(`/news/${encodeURIComponent(slug)}`);
}

export function registerPushDevice(token, platform) {
  return api.post('/notifications/device', { token, platform });
}
