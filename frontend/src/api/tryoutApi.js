import api from './axios';

export function getTryouts() {
  return api.get('/tryouts');
}

export function startTryout(tryoutId) {
  return api.post(`/tryouts/${tryoutId}/start`);
}

export function saveTryoutAnswer(attemptId, questionId, optionId) {
  return api.post(`/tryout-attempts/${attemptId}/answer`, {
    question_id: questionId,
    option_id: optionId,
  });
}

export function submitTryout(attemptId) {
  return api.post(`/tryout-attempts/${attemptId}/submit`);
}

export function getTryoutResult(attemptId) {
  return api.get(`/tryout-attempts/${attemptId}/result`);
}
