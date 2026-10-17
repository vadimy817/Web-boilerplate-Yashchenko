import { 
  getFormattedTeachers, 
  validateTeacher, 
  filterTeachers, 
  sortTeachers, 
  findTeacher, 
  getTeacherPercentage 
} from './lab2.js';

let teachers = getFormattedTeachers();

console.log('Formatted Teachers:', teachers);

if (teachers.length > 0) {
  console.log('Validation of first teacher:', validateTeacher(teachers[0]));
}

const filtered = filterTeachers(teachers, { gender: 'male', favorite: true });
console.log('Filtered (Male & Favorite):', filtered);

const sortedByName = sortTeachers(teachers, 'full_name', 'asc');
console.log('Sorted by Full Name (ASC):', sortedByName);

const found = findTeacher(teachers, 'Norbert');
console.log('Found teacher (Norbert):', found);

const percentageOver30 = getTeacherPercentage(teachers, '>30');
console.log('Percentage of teachers age > 30:', percentageOver30 + '%');

document.addEventListener('DOMContentLoaded', () => {
  initModals();
  renderTeachers(teachers);
  renderFavorites(teachers);
  renderTable(teachers);
  initAddTeacherForm();
});

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

function openTeacherInfoModal(teacher) {
  const infoModal = document.getElementById('modal-teacher-info');
  if (!infoModal) return;

  const avatar = infoModal.querySelector('.modal-teacher__avatar');
  const name = infoModal.querySelector('.modal-teacher__name');
  const subject = infoModal.querySelector('.modal-teacher__subject');
  const location = infoModal.querySelector('.modal-teacher__location');
  const ageGender = infoModal.querySelector('.modal-teacher__age-gender');
  const email = infoModal.querySelector('.modal-teacher__email');
  const phone = infoModal.querySelector('.modal-teacher__phone');
  const star = infoModal.querySelector('.modal-teacher__star');

  if (avatar) avatar.src = teacher.picture_large || 'https://via.placeholder.com/140';
  if (name) name.textContent = teacher.full_name || 'No Name';
  if (subject) subject.textContent = teacher.course || 'General';
  if (location) location.textContent = `${teacher.city || ''}, ${teacher.country || ''}`;
  if (ageGender) ageGender.textContent = `${teacher.age || 'N/A'}, ${teacher.gender || 'N/A'}`;
  if (email) email.innerHTML = teacher.email ? `<a href="mailto:${teacher.email}">${teacher.email}</a>` : 'N/A';
  if (phone) phone.textContent = teacher.phone || 'N/A';
  if (star) star.textContent = teacher.favorite ? '★' : '☆';

  infoModal.classList.add('is-open');
}

function initAddTeacherForm() {
  const form = document.getElementById('add-teacher-form');
  const addTeacherModal = document.getElementById('modal-add-teacher');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const newTeacher = {
      id: String(Date.now()),
      full_name: document.getElementById('teacher-name').value,
      course: document.getElementById('teacher-speciality').value,
      country: document.getElementById('teacher-country').value,
      city: document.getElementById('teacher-city').value,
      email: document.getElementById('teacher-email').value,
      phone: document.getElementById('teacher-phone').value,
      age: 30,
      gender: form.querySelector('input[name="sex"]:checked')?.value || 'male',
      bg_color: document.getElementById('teacher-color').value,
      picture_large: null,
      favorite: false
    };

    teachers.unshift(newTeacher);
    renderTeachers(teachers);
    renderFavorites(teachers);
    renderTable(teachers);

    form.reset();
    if (addTeacherModal) addTeacherModal.classList.remove('is-open');
  });
}