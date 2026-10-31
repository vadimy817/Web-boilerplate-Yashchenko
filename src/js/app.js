import {
  formatUser,
  removeDuplicates,
  getTeacherErrors,
  filterTeachers,
  sortTeachers,
  findTeacher,
  calculateAge,
  getDaysUntilBirthday,
} from './lab2.js';
import {
  fetchUsers, postTeacher, INITIAL_COUNT, PAGE_SIZE,
} from './api.js';
import { showTeacherMap, initMapToggle } from './map.js';
import { initPieChart, updatePieChart } from './charts.js';
import { updateReport, setReportView } from './report.js';

const state = {
  teachers: [],
  fetchedCount: 0,
  isLoading: false,
  query: '',
  filters: {
    age: '', region: '', sex: '', onlyPhoto: false, onlyFavorites: false,
  },
  sort: { field: '', order: 'asc' },
  selectedTeacher: null,
};

const $ = (selector) => document.querySelector(selector);

const getInitials = (name) => (name
  ? _.map(_.split(name, ' '), (part) => part[0]).join('.').toUpperCase()
  : 'N/A');

// Дані: фільтрація / пошук / сортування

function getVisibleTeachers() {
  const { filters } = state;

  const filtered = filterTeachers(state.teachers, {
    age: filters.age,
    region: filters.region,
    gender: filters.sex,
    withPhoto: filters.onlyPhoto,
    favorite: filters.onlyFavorites ? true : undefined,
  });

  return findTeacher(filtered, state.query);
}

// Рендер

function createTeacherCard(teacher, { showStar = false } = {}) {
  const card = document.createElement('div');
  card.className = 'teacher-card';
  card.style.cursor = 'pointer';

  const name = _.escape(teacher.full_name || 'No Name');
  const avatarHtml = teacher.picture_large
    ? `<img src="${_.escape(teacher.picture_large)}" alt="${name}" class="teacher-card__avatar">`
    : `<div class="teacher-card__initials" style="border-color:${_.escape(teacher.bg_color || '#f75c4c')}">${_.escape(getInitials(teacher.full_name))}</div>`;
  const starHtml = showStar && teacher.favorite ? '<span class="teacher-card__star">★</span>' : '';

  card.innerHTML = `
    <div class="teacher-card__avatar-wrap">
      ${avatarHtml}
      ${starHtml}
    </div>
    <h3 class="teacher-card__name">${name}</h3>
    <p class="teacher-card__subject">${_.escape(teacher.course || 'General')}</p>
    <p class="teacher-card__location">${_.escape(teacher.country || 'Unknown')}</p>
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
  _.filter(state.teachers, 'favorite')
    .forEach((teacher) => carousel.appendChild(createTeacherCard(teacher)));
}

function renderStats(teachers) {
  const withAge = _.filter(teachers, (teacher) => _.isNumber(teacher.age));
  const averageAge = withAge.length ? _.round(_.meanBy(withAge, 'age'), 1) : '–';
  const genders = _.countBy(teachers, 'gender');
  const countries = _.uniq(_.compact(_.map(teachers, 'country'))).length;

  $('#stats-summary').innerHTML = `
    <span>Shown: <strong>${teachers.length}</strong> of ${state.teachers.length}</span>
    <span>Average age: <strong>${averageAge}</strong></span>
    <span>Male: <strong>${genders.Male || 0}</strong></span>
    <span>Female: <strong>${genders.Female || 0}</strong></span>
    <span>Countries: <strong>${countries}</strong></span>
  `;
}

function renderAll() {
  const visible = getVisibleTeachers();
  renderTeachers(sortTeachers(visible, state.sort.field, state.sort.order));
  renderStats(visible);
  updatePieChart(visible);
  renderFavorites();
}

function renderData() {
  renderAll();
  updateReport(state.teachers);
}

// Модальне вікно викладача

function formatBirthday(birthDate) {
  const days = getDaysUntilBirthday(birthDate);
  if (days === null) return 'Next birthday: N/A';
  if (days === 0) return 'Birthday is today! 🎉';

  const dateLabel = dayjs(String(birthDate).slice(0, 10)).format('D MMMM');
  return `Next birthday in ${days} ${days === 1 ? 'day' : 'days'} (${dateLabel})`;
}

function openTeacherInfoModal(teacher) {
  state.selectedTeacher = teacher;
  const modal = $('#modal-teacher-info');

  modal.querySelector('.modal-teacher__avatar').src = teacher.picture_large || 'https://via.placeholder.com/140';
  modal.querySelector('.modal-teacher__name').textContent = teacher.full_name || 'No Name';
  modal.querySelector('.modal-teacher__subject').textContent = teacher.course || 'General';
  modal.querySelector('.modal-teacher__location').textContent = _.compact([teacher.city, teacher.country]).join(', ');
  modal.querySelector('.modal-teacher__age-gender').textContent = `${teacher.age ?? 'N/A'}, ${teacher.gender || 'N/A'}`;
  modal.querySelector('.modal-teacher__email').innerHTML = teacher.email
    ? `<a href="mailto:${_.escape(teacher.email)}">${_.escape(teacher.email)}</a>`
    : 'N/A';
  modal.querySelector('.modal-teacher__phone').textContent = teacher.phone || 'N/A';
  modal.querySelector('.modal-teacher__description').textContent = teacher.note || 'No notes available.';
  $('#modal-birthday').textContent = formatBirthday(teacher.b_day);
  $('#modal-star-btn').textContent = teacher.favorite ? '★' : '☆';

  modal.classList.add('is-open');
  showTeacherMap(teacher);
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

  _.forEach(controls, (element, key) => {
    element.addEventListener('change', () => {
      state.filters[key] = element.type === 'checkbox' ? element.checked : element.value;
      renderAll();
    });
  });
}

function initSorting() {
  const fieldSelect = $('#sort-field');
  const orderSelect = $('#sort-order');

  const onChange = () => {
    state.sort = { field: fieldSelect.value, order: orderSelect.value };
    renderAll();
  };

  fieldSelect.addEventListener('change', onChange);
  orderSelect.addEventListener('change', onChange);
}

function initSearch() {
  $('#search-form').addEventListener('submit', (event) => {
    event.preventDefault();
    state.query = $('#search-input').value.trim();
    renderAll();
  });
}

// Вигляд звіту

function initReportViewSwitch() {
  const buttons = document.querySelectorAll('.view-switch__btn');

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      buttons.forEach((other) => other.classList.toggle('is-active', other === button));
      setReportView(button.dataset.view);
    });
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

    const formatted = _.filter(
      _.map(users, formatUser),
      (teacher) => _.isEmpty(getTeacherErrors(teacher, { checkPhone: false })),
    );

    state.teachers = removeDuplicates([...state.teachers, ...formatted]);
    setLoadMoreState({ loading: false });
    renderData();
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
    gender: _.capitalize(sex),
    bg_color: $('#teacher-color').value,
    note: $('#teacher-notes').value.trim() || null,
    coordinates: null,
    picture_large: null,
    favorite: false,
  };
}

function showFormErrors(errors) {
  const box = $('#form-error');
  box.innerHTML = _.map(errors, (message) => `<div>${_.escape(message)}</div>`).join('');
  box.hidden = _.isEmpty(errors);
}

function initAddTeacherForm() {
  const form = $('#add-teacher-form');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const teacher = readTeacherFromForm(form);
    const errors = getTeacherErrors(teacher);
    showFormErrors(errors);
    if (errors.length) return;

    try {
      const saved = await postTeacher(teacher);
      state.teachers.unshift({ ...teacher, ...saved });
    } catch (error) {
      console.warn('json-server is unavailable, teacher was added locally only', error);
      state.teachers.unshift(teacher);
    }

    renderData();
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
  initMapToggle();
  initPieChart();
  initFilters();
  initSorting();
  initSearch();
  initPagination();
  initReportViewSwitch();
  initFavoriteToggle();
  initAddTeacherForm();
  loadTeachers(INITIAL_COUNT);
});
