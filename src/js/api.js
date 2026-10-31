const RANDOM_USER_URL = 'https://randomuser.me/api/';
const JSON_SERVER_URL = 'http://localhost:3000/teachers';

const SEED = 'teachfinder';

export const INITIAL_COUNT = 50;
export const PAGE_SIZE = 10;

async function requestJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function fetchUsers(count, offset = 0) {
  const page = Math.floor(offset / count) + 1;
  const url = `${RANDOM_USER_URL}?results=${count}&page=${page}&seed=${SEED}`;
  const data = await requestJson(url);
  return data.results || [];
}

export function postTeacher(teacher) {
  return requestJson(JSON_SERVER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(teacher),
  });
}
