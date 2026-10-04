import testModules from './test-module.js';

console.log(testModules?.hello);

const initialTeachers = [
    {
        id: '1',
        gender: 'Male',
        name: 'Ihor Tkachuk',
        city: 'Kyiv',
        country: 'Ukraine',
        email: 'ihor_tkachuk@domain.com',
        phone: '+380964993252',
        picture_large: 'https://randomuser.me/api/portraits/men/44.jpg',
        age: 35,
        subject: 'Chemistry',
        favorite: true
    },
    {
        id: '2',
        gender: 'Male',
        name: 'Pragg Rameshbandu',
        city: 'Chennai',
        country: 'India',
        email: 'pragg@domain.com',
        phone: '+919876543210',
        picture_large: 'https://randomuser.me/api/portraits/men/32.jpg',
        age: 28,
        subject: 'Chess',
        favorite: false
    },
    {
        id: '3',
        gender: 'Female',
        name: 'Floor Jansen',
        city: 'Amsterdam',
        country: 'Denmark',
        email: 'floor@domain.com',
        phone: '+4512345678',
        picture_large: 'https://randomuser.me/api/portraits/women/65.jpg',
        age: 41,
        subject: 'Vocal',
        favorite: true
    },
    {
        id: '4',
        gender: 'Female',
        name: 'Anna Muzychuk',
        city: 'Lviv',
        country: 'Ukraine',
        email: 'anna@domain.com',
        phone: '+380501112233',
        picture_large: null,
        age: 32,
        subject: 'Chess',
        favorite: true
    }
];

let teachers = [...initialTeachers];

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

    const closeAddModal = () => addTeacherModal.classList.remove('is-open');
    if (closeAddBtn) closeAddBtn.addEventListener('click', closeAddModal);
    if (closeAddOverlay) closeAddOverlay.addEventListener('click', closeAddModal);

    const infoModal = document.getElementById('modal-teacher-info');
    const closeInfoBtn = document.getElementById('close-teacher-info-btn');
    const closeInfoOverlay = document.getElementById('close-teacher-info-overlay');

    const closeInfoModal = () => infoModal.classList.remove('is-open');
    if (closeInfoBtn) closeInfoBtn.addEventListener('click', closeInfoModal);
    if (closeInfoOverlay) closeInfoOverlay.addEventListener('click', closeInfoModal);
}

function getInitials(name) {
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
            ? `<img src="${teacher.picture_large}" alt="${teacher.name}" class="teacher-card__avatar">`
            : `<div class="teacher-card__initials" style="border-color:${teacher.bg_color || '#f75c4c'}">${getInitials(teacher.name)}</div>`;

        card.innerHTML = `
            <div class="teacher-card__avatar-wrap">
                ${avatarHtml}
                ${starHtml}
            </div>
            <h3 class="teacher-card__name">${teacher.name}</h3>
            <p class="teacher-card__subject">${teacher.subject}</p>
            <p class="teacher-card__location">${teacher.country}</p>
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
            ? `<img src="${teacher.picture_large}" alt="${teacher.name}" class="teacher-card__avatar">`
            : `<div class="teacher-card__initials">${getInitials(teacher.name)}</div>`;

        card.innerHTML = `
            <div class="teacher-card__avatar-wrap">
                ${avatarHtml}
            </div>
            <h3 class="teacher-card__name">${teacher.name}</h3>
            <p class="teacher-card__subject">${teacher.subject}</p>
            <p class="teacher-card__location">${teacher.country}</p>
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
            <td>${teacher.name}</td>
            <td>${teacher.subject}</td>
            <td>${teacher.age}</td>
            <td>${teacher.gender}</td>
            <td>${teacher.country}</td>
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
    if (name) name.textContent = teacher.name;
    if (subject) subject.textContent = teacher.subject;
    if (location) location.textContent = `${teacher.city || ''}, ${teacher.country}`;
    if (ageGender) ageGender.textContent = `${teacher.age}, ${teacher.gender}`;
    if (email) email.innerHTML = `<a href="mailto:${teacher.email}">${teacher.email}</a>`;
    if (phone) phone.textContent = teacher.phone;
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
            name: document.getElementById('teacher-name').value,
            subject: document.getElementById('teacher-speciality').value,
            country: document.getElementById('teacher-country').value,
            city: document.getElementById('teacher-city').value,
            email: document.getElementById('teacher-email').value,
            phone: document.getElementById('teacher-phone').value,
            age: 30,
            gender: form.querySelector('input[name="sex"]:checked')?.value || 'Male',
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