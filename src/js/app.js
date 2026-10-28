import {
  formatUser,
  removeDuplicates,
  getTeacherErrors,
  sortTeachers,
  findTeacher,
} from './lab2.js';
import {
  fetchUsers, postTeacher, INITIAL_COUNT, PAGE_SIZE,
} from './api.js';

const COUNTRY_TO_REGION = {
  Germany: 'Europe',
  Ukraine: 'Europe',
  'United Kingdom': 'Europe',
  UK: 'Europe',
  France: 'Europe',
  Spain: 'Europe',
  Italy: 'Europe',
  Norway: 'Europe',
  Denmark: 'Europe',
  Switzerland: 'Europe',
  Ireland: 'Europe',
  Finland: 'Europe',
  Turkey: 'Europe',
  Poland: 'Europe',
  Netherlands: 'Europe',
  Serbia: 'Europe',

  USA: 'Americas',
  'United States': 'Americas',
  Canada: 'Americas',
  Brazil: 'Americas',
  Mexico: 'Americas',

  India: 'Asia',
  China: 'Asia',
  Iran: 'Asia',
  Japan: 'Asia',
  'South Korea': 'Asia',

  Egypt: 'Africa',
  Nigeria: 'Africa',

  Australia: 'Oceania',
  'New Zealand': 'Oceania',
};

const state = {
  teachers: [],
  fetchedCount: 0,
  isLoading: false,
  query: '',
  filters: {
    age: '', region: '', sex: '', onlyPhoto: false, onlyFavorites: false,
  },
  sort: { field: 'full_name', order: 'asc' },
  selectedTeacher: null,
};

const $ = (selector) => document.querySelector(selector);

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}

function getInitials(name) {
  if (!name) return 'N/A';
  return name.split(' ').map((part) => part[0]).join('.').toUpperCase();
}

// Дані: фільтрація / пошук

function matchesAge(teacher, ageFilter) {
  if (!ageFilter) return true;
  if (ageFilter.endsWith('+')) return teacher.age >= Number(ageFilter.slice(0, -1));
  const [min, max] = ageFilter.split('-').map(Number);
  return teacher.age >= min && teacher.age <= max;
}

function matchesRegion(teacher, region) {
  if (!region) return true;
  return COUNTRY_TO_REGION[teacher.country] === region;
}

// Список після фільтрів та пошуку (без сортування)
function getVisibleTeachers() {
  const { filters } = state;

  const filtered = state.teachers.filter((teacher) => matchesAge(teacher, filters.age)
    && matchesRegion(teacher, filters.region)
    && (!filters.sex || (teacher.gender || '').toLowerCase() === filters.sex)
    && (!filters.onlyPhoto || Boolean(teacher.picture_large))
    && (!filters.onlyFavorites || teacher.favorite));

  return findTeacher(filtered, state.query);
}

// Рендер

function createTeacherCard(teacher, { showStar = false } = {}) {
  const card = document.createElement('div');
  card.className = 'teacher-card';
  card.style.cursor = 'pointer';

  const name = escapeHtml(teacher.full_name || 'No Name');
  const avatarHtml = teacher.picture_large
    ? `<img src="${escapeHtml(teacher.picture_large)}" alt="${name}" class="teacher-card__avatar">`
    : `<div class="teacher-card__initials" style="border-color:${escapeHtml(teacher.bg_color || '#f75c4c')}">${escapeHtml(getInitials(teacher.full_name))}</div>`;
  const starHtml = showStar && teacher.favorite ? '<span class="teacher-card__star">★</span>' : '';

  card.innerHTML = `
    <div class="teacher-card__avatar-wrap">
      ${avatarHtml}
      ${starHtml}
    </div>
    <h3 class="teacher-card__name">${name}</h3>
    <p class="teacher-card__subject">${escapeHtml(teacher.course || 'General')}</p>
    <p class="teacher-card__location">${escapeHtml(teacher.country || 'Unknown')}</p>
  `;

  card.addEventListener('click', () => openTeacherInfoModal(teacher));
  return card;
}

function renderTeachers(teachers) {
  const grid = $('.teachers-grid');
  grid.innerHTML = '';
  teachers.forEach((teacher) => grid.appendChild(createTeacherCard(teacher, { showStar: true })));
}

function renderFavorites() {
  const carousel = $('.favorites-carousel');
  carousel.innerHTML = '';
  state.teachers
    .filter((teacher) => teacher.favorite)
    .forEach((teacher) => carousel.appendChild(createTeacherCard(teacher)));
}

function renderTable(teachers) {
  const tableBody = $('.stats-table tbody');
  tableBody.innerHTML = '';

  sortTeachers(teachers, state.sort.field, state.sort.order).forEach((teacher) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(teacher.full_name || 'N/A')}</td>
      <td>${escapeHtml(teacher.course || 'N/A')}</td>
      <td>${escapeHtml(teacher.age ?? 'N/A')}</td>
      <td>${escapeHtml(teacher.gender || 'N/A')}</td>
      <td>${escapeHtml(teacher.country || 'N/A')}</td>
    `;
    tableBody.appendChild(row);
  });
}

// Статистика рахується по тих даних, що зараз відображаються
function renderStats(teachers) {
  const ages = teachers.map((t) => t.age).filter((age) => typeof age === 'number');
  const averageAge = ages.length
    ? (ages.reduce((sum, age) => sum + age, 0) / ages.length).toFixed(1)
    : '–';
  const males = teachers.filter((t) => t.gender === 'Male').length;
  const females = teachers.filter((t) => t.gender === 'Female').length;
  const countries = new Set(teachers.map((t) => t.country).filter(Boolean)).size;

  $('#stats-summary').innerHTML = `
    <span>Shown: <strong>${teachers.length}</strong> of ${state.teachers.length}</span>
    <span>Average age: <strong>${averageAge}</strong></span>
    <span>Male: <strong>${males}</strong></span>
    <span>Female: <strong>${females}</strong></span>
    <span>Countries: <strong>${countries}</strong></span>
  `;
}

function renderAll() {
  const visible = getVisibleTeachers();
  renderTeachers(visible);
  renderTable(visible);
  renderStats(visible);
  renderFavorites();
}

// Модальне вікно викладача

function openTeacherInfoModal(teacher) {
  state.selectedTeacher = teacher;
  const modal = $('#modal-teacher-info');

  modal.querySelector('.modal-teacher__avatar').src = teacher.picture_large || 'https://via.placeholder.com/140';
  modal.querySelector('.modal-teacher__name').textContent = teacher.full_name || 'No Name';
  modal.querySelector('.modal-teacher__subject').textContent = teacher.course || 'General';
  modal.querySelector('.modal-teacher__location').textContent = [teacher.city, teacher.country].filter(Boolean).join(', ');
  modal.querySelector('.modal-teacher__age-gender').textContent = `${teacher.age ?? 'N/A'}, ${teacher.gender || 'N/A'}`;
  modal.querySelector('.modal-teacher__email').innerHTML = teacher.email
    ? `<a href="mailto:${escapeHtml(teacher.email)}">${escapeHtml(teacher.email)}</a>`
    : 'N/A';
  modal.querySelector('.modal-teacher__phone').textContent = teacher.phone || 'N/A';
  modal.querySelector('.modal-teacher__description').textContent = teacher.note || 'No notes available.';
  $('#modal-star-btn').textContent = teacher.favorite ? '★' : '☆';

  modal.classList.add('is-open');
}

function initFavoriteToggle() {
  $('#modal-star-btn').addEventListener('click', () => {
    const teacher = state.selectedTeacher;
    if (!teacher) return;
    teacher.favorite = !teacher.favorite;
    $('#modal-star-btn').textContent = teacher.favorite ? '★' : '☆';
    renderAll();
  });
}

// Фільтри, сортування, пошук

function initFilters() {
  const controls = {
    age: $('#filter-age'),
    region: $('#filter-region'),
    sex: $('#filter-sex'),
    onlyPhoto: $('#only-photo'),
    onlyFavorites: $('#only-favorites'),
  };

  Object.entries(controls).forEach(([key, element]) => {
    element.addEventListener('change', () => {
      state.filters[key] = element.type === 'checkbox' ? element.checked : element.value;
      renderAll();
    });
  });
}

function initSorting() {
  const headers = document.querySelectorAll('.stats-table th[data-sort]');

  headers.forEach((header) => {
    header.addEventListener('click', () => {
      const field = header.dataset.sort;

      if (state.sort.field === field) {
        state.sort.order = state.sort.order === 'asc' ? 'desc' : 'asc';
      } else {
        state.sort = { field, order: 'asc' };
      }

      headers.forEach((h) => { h.querySelector('.sort-icon').textContent = ''; });
      header.querySelector('.sort-icon').textContent = state.sort.order === 'asc' ? '↓' : '↑';

      renderAll();
    });
  });
}

function initSearch() {
  $('#search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    state.query = $('#search-input').value.trim();
    renderAll();
  });
}

// Завантаження даних з API та пагінація

function setLoadMoreState({ loading, error = '' }) {
  const button = $('#load-more');
  button.disabled = loading;
  button.textContent = loading ? 'Loading...' : 'Next';
  const errorBox = $('#load-error');
  errorBox.textContent = error;
  errorBox.hidden = !error;
}

async function loadTeachers(count) {
  if (state.isLoading) return;
  state.isLoading = true;
  setLoadMoreState({ loading: true });

  try {
    const users = await fetchUsers(count, state.fetchedCount);
    state.fetchedCount += users.length;

    const formatted = users
      .map(formatUser)
      .filter((teacher) => getTeacherErrors(teacher, { checkPhone: false }).length === 0);

    state.teachers = removeDuplicates([...state.teachers, ...formatted]);
    setLoadMoreState({ loading: false });
    renderAll();
  } catch (error) {
    console.error(error);
    setLoadMoreState({ loading: false, error: 'Could not load teachers. Please try again.' });
  } finally {
    state.isLoading = false;
  }
}

function initPagination() {
  $('#load-more').addEventListener('click', () => loadTeachers(PAGE_SIZE));
}

// Форма додавання викладача

function calculateAge(dateString) {
  const birth = new Date(dateString);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hadBirthday = today.getMonth() > birth.getMonth()
    || (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hadBirthday) age -= 1;
  return age;
}

function readTeacherFromForm(form) {
  const sex = form.querySelector('input[name="sex"]:checked')?.value || 'male';
  const dob = $('#teacher-dob').value;

  return {
    id: String(Date.now()),
    full_name: $('#teacher-name').value.trim(),
    course: $('#teacher-speciality').value,
    country: $('#teacher-country').value,
    city: $('#teacher-city').value.trim() || null,
    email: $('#teacher-email').value.trim(),
    phone: $('#teacher-phone').value.trim(),
    age: dob ? calculateAge(dob) : null,
    b_day: dob,
    gender: sex.charAt(0).toUpperCase() + sex.slice(1),
    bg_color: $('#teacher-color').value,
    note: $('#teacher-notes').value.trim() || null,
    picture_large: null,
    favorite: false,
  };
}

function showFormErrors(errors) {
  const box = $('#form-error');
  box.innerHTML = errors.map((message) => `<div>${escapeHtml(message)}</div>`).join('');
  box.hidden = errors.length === 0;
}

function initAddTeacherForm() {
  const form = $('#add-teacher-form');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const teacher = readTeacherFromForm(form);
    const errors = getTeacherErrors(teacher); // у формі телефон перевіряється суворо
    showFormErrors(errors);
    if (errors.length) return;

    try {
      const saved = await postTeacher(teacher);
      state.teachers.unshift({ ...teacher, ...saved });
    } catch (error) {
      console.warn('json-server is unavailable, teacher was added locally only', error);
      state.teachers.unshift(teacher);
    }

    renderAll();
    form.reset();
    $('#modal-add-teacher').classList.remove('is-open');
  });
}

// Модальні вікна

function initModals() {
  const addModal = $('#modal-add-teacher');
  const infoModal = $('#modal-teacher-info');

  ['#open-add-teacher-modal', '#open-add-teacher-modal-footer'].forEach((selector) => {
    $(selector).addEventListener('click', () => {
      showFormErrors([]);
      addModal.classList.add('is-open');
    });
  });

  ['#close-add-teacher-btn', '#close-add-teacher-overlay'].forEach((selector) => {
    $(selector).addEventListener('click', () => addModal.classList.remove('is-open'));
  });

  ['#close-teacher-info-btn', '#close-teacher-info-overlay'].forEach((selector) => {
    $(selector).addEventListener('click', () => infoModal.classList.remove('is-open'));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initModals();
  initFilters();
  initSorting();
  initSearch();
  initPagination();
  initFavoriteToggle();
  initAddTeacherForm();
  loadTeachers(INITIAL_COUNT);
});