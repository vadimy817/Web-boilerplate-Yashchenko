import { randomUserMock, additionalUsers } from './FE4U-Lab2-mock.js';

const COURSES = [
  'Mathematics', 'Physics', 'English', 'Computer Science', 
  'Dancing', 'Chess', 'Biology', 'Chemistry', 
  'Law', 'Art', 'Medicine', 'Statistics'
];

const getRandomCourse = () => COURSES[Math.floor(Math.random() * COURSES.length)];

// 1. Нормалізація та об'єднання даних
export function getFormattedTeachers() {
  const normalizedMock = randomUserMock.map((user) => {
    return {
      id: user.login?.uuid || user.id?.value || String(Math.random()),
      gender: user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : null,
      title: user.name?.title || null,
      full_name: `${user.name?.first || ''} ${user.name?.last || ''}`.trim(),
      city: user.location?.city || null,
      state: user.location?.state || null,
      country: user.location?.country || null,
      postcode: user.location?.postcode || null,
      coordinates: user.location?.coordinates ? {
        latitude: user.location.coordinates.latitude,
        longitude: user.location.coordinates.longitude
      } : null,
      timezone: user.location?.timezone ? {
        offset: user.location.timezone.offset,
        description: user.location.timezone.description
      } : null,
      email: user.email || null,
      b_day: user.dob?.date || null,
      age: user.dob?.age || null,
      phone: user.phone || null,
      picture_large: user.picture?.large || null,
      picture_thumbnail: user.picture?.thumbnail || null,
      favorite: false,
      course: getRandomCourse(),
      bg_color: '#f75c4c',
      note: null
    };
  });

  const normalizedAdditional = additionalUsers.map((user) => {
    return {
      id: user.id || String(Math.random()),
      gender: user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : null,
      title: user.title || null,
      full_name: user.full_name || null,
      city: user.city || null,
      state: user.state || null,
      country: user.country || null,
      postcode: user.postcode || null,
      coordinates: user.coordinates || null,
      timezone: user.timezone || null,
      email: user.email || null,
      b_day: user.b_day || null,
      age: user.b_day ? calculateAge(user.b_day) : null,
      phone: user.phone || null,
      picture_large: user.picture_large || null,
      picture_thumbnail: user.picture_thumbnail || null,
      favorite: Boolean(user.favorite),
      course: user.course || getRandomCourse(),
      bg_color: user.bg_color || '#f75c4c',
      note: user.note || null
    };
  });

  const combined = [...normalizedMock, ...normalizedAdditional];
  const uniqueTeachers = [];
  const seenIdentifiers = new Set();

  for (const teacher of combined) {
    const key = teacher.email || teacher.id;
    if (!seenIdentifiers.has(key)) {
      seenIdentifiers.add(key);
      uniqueTeachers.push(teacher);
    }
  }

  return uniqueTeachers;
}

function calculateAge(bDayString) {
  const birthDate = new Date(bDayString);
  const diff = Date.now() - birthDate.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

// 2. Валідація об'єкта викладача
export function validateTeacher(teacher) {
  if (typeof teacher !== 'object' || teacher === null) return false;

  // Перевірка рядкових полів
  if (teacher.full_name && typeof teacher.full_name !== 'string') return false;
  
  if (teacher.age !== null && teacher.age !== undefined) {
    if (typeof teacher.age !== 'number' || Number.isNaN(teacher.age)) return false;
  }

  if (teacher.email !== null && teacher.email !== undefined && teacher.email !== '') {
    if (typeof teacher.email !== 'string' || !teacher.email.includes('@')) return false;
  }

  // Виправлена регулярка для телефону (без /\$)
  if (teacher.phone !== null && teacher.phone !== undefined && teacher.phone !== '') {
    if (typeof teacher.phone !== 'string') return false;
    const phoneRegex = /^[\d\s()+-]+\$/;
    if (!phoneRegex.test(teacher.phone)) return false;
  }

  return true;
}

// 3. Фільтрація масиву
export function filterTeachers(teachers, { country, age, gender, favorite } = {}) {
  return teachers.filter((teacher) => {
    if (country && teacher.country !== country) return false;
    if (gender && (teacher.gender || '').toLowerCase() !== gender.toLowerCase()) return false;
    if (favorite !== undefined && teacher.favorite !== favorite) return false;
    
    if (age) {
      if (typeof age === 'number' && teacher.age !== age) return false;
      if (typeof age === 'string' && age.includes('-')) {
        const [min, max] = age.split('-').map(Number);
        if (teacher.age < min || teacher.age > max) return false;
      }
      if (typeof age === 'string' && age.endsWith('+')) {
        const min = Number(age.replace('+', ''));
        if (teacher.age < min) return false;
      }
    }

    return true;
  });
}

// 4. Сортування (розширено список полів для таблиці)
export function sortTeachers(teachers, field, order = 'asc') {
  const allowedFields = ['full_name', 'course', 'age', 'gender', 'b_day', 'country'];
  if (!allowedFields.includes(field)) return teachers;

  return [...teachers].sort((a, b) => {
    let valA = a[field];
    let valB = b[field];

    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;

    if (field === 'b_day') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    }

    if (typeof valA === 'string') {
      const comparison = valA.localeCompare(valB);
      return order === 'asc' ? comparison : -comparison;
    }

    return order === 'asc' ? valA - valB : valB - valA;
  });
}

// 5. Пошук (тепер повертає МАСИВ знайдених викладачів)
export function findTeacher(teachers, query) {
  if (!query && query !== 0) return teachers;
  const searchStr = String(query).toLowerCase();

  return teachers.filter((teacher) => {
    const nameMatch = teacher.full_name && teacher.full_name.toLowerCase().includes(searchStr);
    const noteMatch = teacher.note && teacher.note.toLowerCase().includes(searchStr);
    const ageMatch = teacher.age && String(teacher.age) === searchStr;

    return nameMatch || noteMatch || ageMatch;
  });
}

// 6. Розрахунок відсотка
export function getTeacherPercentage(teachers, query) {
  if (!teachers || teachers.length === 0) return 0;

  const searchStr = String(query).toLowerCase();

  const matchingCount = teachers.filter((teacher) => {
    const nameMatch = teacher.full_name && teacher.full_name.toLowerCase().includes(searchStr);
    const noteMatch = teacher.note && teacher.note.toLowerCase().includes(searchStr);
    
    let ageMatch = false;
    if (typeof query === 'string' && query.startsWith('>')) {
      const minAge = Number(query.slice(1));
      ageMatch = teacher.age > minAge;
    } else if (typeof query === 'string' && query.startsWith('<')) {
      const maxAge = Number(query.slice(1));
      ageMatch = teacher.age < maxAge;
    } else {
      ageMatch = teacher.age && String(teacher.age) === searchStr;
    }

    return nameMatch || noteMatch || ageMatch;
  }).length;

  return Math.round((matchingCount / teachers.length) * 100);
}