const COURSES = [
  'Mathematics', 'Physics', 'English', 'Computer Science',
  'Dancing', 'Chess', 'Biology', 'Chemistry',
  'Law', 'Art', 'Medicine', 'Statistics',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s().+-]{7,}$/;
const MIN_AGE = 18;
const MAX_AGE = 100;

const getRandomCourse = () => COURSES[Math.floor(Math.random() * COURSES.length)];

const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : null);

// 1. Нормалізація користувача з відповіді randomuser.me до формату викладача
export function formatUser(user) {
  return {
    id: user.login?.uuid || user.id?.value || String(Math.random()),
    gender: capitalize(user.gender),
    title: user.name?.title || null,
    full_name: `${user.name?.first || ''} ${user.name?.last || ''}`.trim(),
    city: user.location?.city || null,
    state: user.location?.state || null,
    country: user.location?.country || null,
    postcode: user.location?.postcode || null,
    coordinates: user.location?.coordinates || null,
    timezone: user.location?.timezone || null,
    email: user.email || null,
    b_day: user.dob?.date || null,
    age: user.dob?.age ?? null,
    phone: user.phone || null,
    picture_large: user.picture?.large || null,
    picture_thumbnail: user.picture?.thumbnail || null,
    favorite: false,
    course: getRandomCourse(),
    bg_color: '#f75c4c',
    note: null,
  };
}

// Прибирає дублікати (за email або id)
export function removeDuplicates(teachers) {
  const seen = new Set();
  return teachers.filter((teacher) => {
    const key = teacher.email || teacher.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// 2. Валідація: повертає список помилок
export function getTeacherErrors(teacher, { checkPhone = true } = {}) {
  if (typeof teacher !== 'object' || teacher === null) return ['Invalid teacher object'];

  const errors = [];
  const requiredStrings = { full_name: 'Name', course: 'Speciality', country: 'Country' };

  Object.entries(requiredStrings).forEach(([field, label]) => {
    if (typeof teacher[field] !== 'string' || !teacher[field].trim()) {
      errors.push(`${label} is required`);
    }
  });

  if (teacher.city && typeof teacher.city !== 'string') errors.push('City must be a string');

  if (typeof teacher.age !== 'number' || Number.isNaN(teacher.age)
    || teacher.age < MIN_AGE || teacher.age > MAX_AGE) {
    errors.push(`Age must be a number between ${MIN_AGE} and ${MAX_AGE}`);
  }

  if (typeof teacher.email !== 'string' || !EMAIL_REGEX.test(teacher.email)) {
    errors.push('Email is not valid');
  }

  if (checkPhone && (typeof teacher.phone !== 'string' || !PHONE_REGEX.test(teacher.phone))) {
    errors.push('Phone is not valid');
  }

  return errors;
}

export function validateTeacher(teacher, options) {
  return getTeacherErrors(teacher, options).length === 0;
}

// 3. Фільтрація масиву
export function filterTeachers(teachers, {
  country, age, gender, favorite,
} = {}) {
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

// 4. Сортування
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

// 5. Пошук (повертає масив знайдених викладачів)
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
      ageMatch = teacher.age > Number(query.slice(1));
    } else if (typeof query === 'string' && query.startsWith('<')) {
      ageMatch = teacher.age < Number(query.slice(1));
    } else {
      ageMatch = teacher.age && String(teacher.age) === searchStr;
    }

    return nameMatch || noteMatch || ageMatch;
  }).length;

  return Math.round((matchingCount / teachers.length) * 100);
}