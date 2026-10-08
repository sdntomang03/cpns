import api from './axios';

export function getDashboardSummary() {
  return api.get('/dashboard/summary');
}

export function getNationalRanking() {
  return api.get('/ranking/national');
}

export function getMyNationalRanking() {
  return api.get('/ranking/me');
}
