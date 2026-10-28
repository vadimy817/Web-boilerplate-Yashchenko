import { 
  getFormattedTeachers, 
  validateTeacher, 
  filterTeachers, 
  sortTeachers, 
  findTeacher 
} from './lab2.js';

let allTeachers = getFormattedTeachers();
let currentFilteredTeachers = [...allTeachers];
let currentSortField = 'full_name';
let currentSortOrder = 'asc';
let selectedTeacherForModal = null;

const COUNTRY_TO_REGION = {
  
  'Germany': 'Europe', 'Ukraine': 'Europe', 'UK': 'Europe', 'United Kingdom': 'Europe',
  'France': 'Europe', 'Spain': 'Europe', 'Italy': 'Europe', 'Norway': 'Europe', 
  'Denmark': 'Europe', 'Switzerland': 'Europe', 'Ireland': 'Europe', 'Finland': 'Europe',
  'Turkey': 'Europe', 'Poland': 'Europe', 'Netherlands': 'Europe',

  'USA': 'Americas', 'United States': 'Americas', 'Canada': 'Americas', 
  'Brazil': 'Americas', 'Mexico': 'Americas',

  'India': 'Asia', 'China': 'Asia', 'Iran': 'Asia', 'Japan': 'Asia', 'South Korea': 'Asia',

  'Egypt': 'Africa', 'Nigeria': 'Africa',
  'Australia': 'Oceania', 'New Zealand': 'Oceania'
};

document.addEventListener('DOMContentLoaded', () => {
  initModals();
  renderAll();
  initFilters();
  initSorting();
  initSearch();
  initAddTeacherForm();
});

function renderAll() {
  renderTeachers(currentFilteredTeachers);
  renderFavorites(allTeachers);
  renderTable(currentFilteredTeachers);
}

// Відображення та додавання у Favorites
function getInitials(name) {
  if (!name) return 'N/A';
  return name.split(' ').map(n => n[0]).join('.').toUpperCase();
}

function renderTeachers(teachersList) {
  const gridContainer = document.querySelector('.teachers-grid');
  if (!gridContainer) return;

  gridContainer.innerHTML = '';

  teachersList.forEach(teacher => {
    const card = document.createElement('div');
    card.className = 'teacher-card';
    card.style.cursor = 'pointer';

    const starHtml = teacher.favorite ? '<span class="teacher-card__star">★</span>' : '';
    const avatarHtml = teacher.picture_large
      ? `<img src="${teacher.picture_large}" alt="${teacher.full_name}" class="teacher-card__avatar">`
      : `<div class="teacher-card__initials" style="border-color:${teacher.bg_color || '#f75c4c'}">${getInitials(teacher.full_name)}</div>`;

    card.innerHTML = `
      <div class="teacher-card__avatar-wrap">
        ${avatarHtml}
        ${starHtml}
      </div>
      <h3 class="teacher-card__name">${teacher.full_name || 'No Name'}</h3>
      <p class="teacher-card__subject">${teacher.course || 'General'}</p>
      <p class="teacher-card__location">${teacher.country || 'Unknown'}</p>
    `;

    card.addEventListener('click', () => openTeacherInfoModal(teacher));
    gridContainer.appendChild(card);
  });
}

function renderFavorites(teachersList) {
  const favoritesContainer = document.querySelector('.favorites-carousel');
  if (!favoritesContainer) return;

  favoritesContainer.innerHTML = '';
  const favorites = teachersList.filter(t => t.favorite);

  favorites.forEach(teacher => {
    const card = document.createElement('div');
    card.className = 'teacher-card';
    card.style.cursor = 'pointer';

    const avatarHtml = teacher.picture_large
      ? `<img src="${teacher.picture_large}" alt="${teacher.full_name}" class="teacher-card__avatar">`
      : `<div class="teacher-card__initials">${getInitials(teacher.full_name)}</div>`;

    card.innerHTML = `
      <div class="teacher-card__avatar-wrap">
        ${avatarHtml}
      </div>
      <h3 class="teacher-card__name">${teacher.full_name || 'No Name'}</h3>
      <p class="teacher-card__subject">${teacher.course || 'General'}</p>
      <p class="teacher-card__location">${teacher.country || 'Unknown'}</p>
    `;

    card.addEventListener('click', () => openTeacherInfoModal(teacher));
    favoritesContainer.appendChild(card);
  });
}

function openTeacherInfoModal(teacher) {
  selectedTeacherForModal = teacher;
  const infoModal = document.getElementById('modal-teacher-info');
  if (!infoModal) return;

  const avatar = infoModal.querySelector('.modal-teacher__avatar');
  const name = infoModal.querySelector('.modal-teacher__name');
  const subject = infoModal.querySelector('.modal-teacher__subject');
  const location = infoModal.querySelector('.modal-teacher__location');
  const ageGender = infoModal.querySelector('.modal-teacher__age-gender');
  const email = infoModal.querySelector('.modal-teacher__email');
  const phone = infoModal.querySelector('.modal-teacher__phone');
  const starBtn = document.getElementById('modal-star-btn');
  const desc = infoModal.querySelector('.modal-teacher__description');

  if (avatar) avatar.src = teacher.picture_large || 'https://via.placeholder.com/140';
  if (name) name.textContent = teacher.full_name || 'No Name';
  if (subject) subject.textContent = teacher.course || 'General';
  if (location) location.textContent = `${teacher.city || ''}, ${teacher.country || ''}`;
  if (ageGender) ageGender.textContent = `${teacher.age || 'N/A'}, ${teacher.gender || 'N/A'}`;
  if (email) email.innerHTML = teacher.email ? `<a href="mailto:${teacher.email}">${teacher.email}</a>` : 'N/A';
  if (phone) phone.textContent = teacher.phone || 'N/A';
  if (starBtn) starBtn.textContent = teacher.favorite ? '★' : '☆';
  if (desc) desc.textContent = teacher.note || 'No notes available.';

  infoModal.classList.add('is-open');
}

// Клік по зірочці у модальному вікні для перемикання Favorites
document.getElementById('modal-star-btn')?.addEventListener('click', () => {
  if (selectedTeacherForModal) {
    selectedTeacherForModal.favorite = !selectedTeacherForModal.favorite;
    document.getElementById('modal-star-btn').textContent = selectedTeacherForModal.favorite ? '★' : '☆';
    renderAll();
  }
});

// Фільтрація
function initFilters() {
  const ageSelect = document.getElementById('filter-age');
  const regionSelect = document.getElementById('filter-region');
  const sexSelect = document.getElementById('filter-sex');
  const onlyPhoto = document.getElementById('only-photo');
  const onlyFavorites = document.getElementById('only-favorites');

  const applyFilters = () => {
    let result = [...allTeachers];

    if (ageSelect?.value) {
      const [min, max] = ageSelect.value.split('-');
      if (max) {
        result = result.filter(t => t.age >= Number(min) && t.age <= Number(max));
      } else if (ageSelect.value.includes('+')) {
        const minAge = Number(ageSelect.value.replace('+', ''));
        result = result.filter(t => t.age >= minAge);
      }
    }

    if (regionSelect?.value) {
      const selectedRegion = regionSelect.value.toLowerCase();
      result = result.filter(t => {
        const teacherRegion = COUNTRY_TO_REGION[t.country] || 'Europe'; // за замовчуванням Europe, якщо країни немає в списку
        return teacherRegion.toLowerCase() === selectedRegion;
      });
    }

    if (sexSelect?.value) {
      result = result.filter(t => (t.gender || '').toLowerCase() === sexSelect.value.toLowerCase());
    }

    if (onlyPhoto?.checked) {
      result = result.filter(t => Boolean(t.picture_large));
    }

    if (onlyFavorites?.checked) {
      result = result.filter(t => Boolean(t.favorite));
    }

    currentFilteredTeachers = result;
    renderTeachers(currentFilteredTeachers);
    renderTable(currentFilteredTeachers);
  };

  [ageSelect, regionSelect, sexSelect, onlyPhoto, onlyFavorites].forEach(el => {
    el?.addEventListener('change', applyFilters);
  });
}

// Сортування таблиці
function renderTable(teachersList) {
  const tableBody = document.querySelector('.stats-table tbody');
  if (!tableBody) return;

  tableBody.innerHTML = '';

  teachersList.forEach(teacher => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${teacher.full_name || 'N/A'}</td>
      <td>${teacher.course || 'N/A'}</td>
      <td>${teacher.age || 'N/A'}</td>
      <td>${teacher.gender || 'N/A'}</td>
      <td>${teacher.country || 'N/A'}</td>
    `;
    tableBody.appendChild(row);
  });
}

function initSorting() {
  const headers = document.querySelectorAll('.stats-table th[data-sort]');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const field = header.getAttribute('data-sort');

      if (currentSortField === field) {
        currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortField = field;
        currentSortOrder = 'asc';
      }

      headers.forEach(h => {
        const icon = h.querySelector('.sort-icon');
        if (icon) icon.textContent = '';
      });

      const icon = header.querySelector('.sort-icon');
      if (icon) icon.textContent = currentSortOrder === 'asc' ? '↓' : '↑';

      currentFilteredTeachers = sortTeachers(currentFilteredTeachers, currentSortField, currentSortOrder);
      renderTable(currentFilteredTeachers);
    });
  });
}

// Пошук
function initSearch() {
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');

  searchForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput?.value.trim().toLowerCase();
    if (!query) {
      currentFilteredTeachers = [...allTeachers];
    } else {
      currentFilteredTeachers = allTeachers.filter(t => {
        const nameMatch = (t.full_name || '').toLowerCase().includes(query);
        const noteMatch = (t.note || '').toLowerCase().includes(query);
        const ageMatch = String(t.age) === query;
        return nameMatch || noteMatch || ageMatch;
      });
    }
    renderTeachers(currentFilteredTeachers);
    renderTable(currentFilteredTeachers);
  });
}

function id(name) {
  return document.getElementById(name);
}

// Форма додавання викладача
function initAddTeacherForm() {
  const form = document.getElementById('add-teacher-form');
  const addTeacherModal = document.getElementById('modal-add-teacher');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const nameVal = document.getElementById('teacher-name').value;
    const dobVal = document.getElementById('teacher-dob').value;

    let calculatedAge = 30;
    if (dobVal) {
      const birthYear = new Date(dobVal).getFullYear();
      calculatedAge = new Date().getFullYear() - birthYear;
    }

    const selectedSex = form.querySelector('input[name="sex"]:checked')?.value || 'Male';
    const formattedGender = selectedSex.charAt(0).toUpperCase() + selectedSex.slice(1);

    const newTeacher = {
      id: String(Date.now()),
      full_name: nameVal,
      course: document.getElementById('teacher-speciality').value,
      country: document.getElementById('teacher-country').value,
      city: document.getElementById('teacher-city').value || 'Unknown',
      email: document.getElementById('teacher-email').value,
      phone: document.getElementById('teacher-phone').value,
      age: calculatedAge,
      b_day: dobVal,
      gender: formattedGender,
      bg_color: document.getElementById('teacher-color').value,
      note: document.getElementById('teacher-notes').value || '',
      picture_large: null,
      favorite: false
    };

    if (validateTeacher(newTeacher)) {
      allTeachers.unshift(newTeacher);
      currentFilteredTeachers.unshift(newTeacher);
      renderAll();
      form.reset();
      if (addTeacherModal) addTeacherModal.classList.remove('is-open');
    } else {
      allTeachers.unshift(newTeacher);
      currentFilteredTeachers.unshift(newTeacher);
      renderAll();
      form.reset();
      if (addTeacherModal) addTeacherModal.classList.remove('is-open');
    }
  });
}

function initModals() {
  const addTeacherBtns = [
    document.getElementById('open-add-teacher-modal'),
    document.getElementById('open-add-teacher-modal-footer')
  ];
  const addTeacherModal = document.getElementById('modal-add-teacher');
  const closeAddBtn = document.getElementById('close-add-teacher-btn');
  const closeAddOverlay = document.getElementById('close-add-teacher-overlay');

  addTeacherBtns.forEach(btn => {
    if (btn && addTeacherModal) {
      btn.addEventListener('click', () => addTeacherModal.classList.add('is-open'));
    }
  });

  const closeAddModal = () => addTeacherModal?.classList.remove('is-open');
  if (closeAddBtn) closeAddBtn.addEventListener('click', closeAddModal);
  if (closeAddOverlay) closeAddOverlay.addEventListener('click', closeAddModal);

  const infoModal = document.getElementById('modal-teacher-info');
  const closeInfoBtn = document.getElementById('close-teacher-info-btn');
  const closeInfoOverlay = document.getElementById('close-teacher-info-overlay');

  const closeInfoModal = () => infoModal?.classList.remove('is-open');
  if (closeInfoBtn) closeInfoBtn.addEventListener('click', closeInfoModal);
  if (closeInfoOverlay) closeInfoOverlay.addEventListener('click', closeInfoModal);
}