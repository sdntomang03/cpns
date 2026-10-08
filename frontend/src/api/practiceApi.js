import api from './axios';

export function getPracticePackages() {
  return api.get('/practice/packages');
}

export function submitPracticeResult(packageId, answers) {
  return api.post(`/practice/packages/${packageId}/result`, { answers });
}

export function syncPracticeProgress(attempts) {
  return api.post('/practice/progress/sync', { attempts });
}
