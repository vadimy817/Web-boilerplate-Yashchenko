const COURSES = [
  'Mathematics', 'Physics', 'English', 'Computer Science',
  'Dancing', 'Chess', 'Biology', 'Chemistry',
  'Law', 'Art', 'Medicine', 'Statistics',
];

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

const REQUIRED_STRING_FIELDS = { full_name: 'Name', course: 'Speciality', country: 'Country' };
const SORTABLE_FIELDS = ['full_name', 'course', 'age', 'gender', 'b_day', 'country'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s().+-]{7,}$/;
const MIN_AGE = 18;
const MAX_AGE = 100;

export const getRegion = (country) => COUNTRY_TO_REGION[country] || null;


export function formatUser(user) {
  const pick = (path) => _.get(user, path) || null;

  return {
    id: pick('login.uuid') || pick('id.value') || _.uniqueId('teacher-'),
    gender: _.capitalize(pick('gender')) || null,
    title: pick('name.title'),
    full_name: _.compact([_.get(user, 'name.first'), _.get(user, 'name.last')]).join(' '),
    city: pick('location.city'),
    state: pick('location.state'),
    country: pick('location.country'),
    postcode: pick('location.postcode'),
    coordinates: pick('location.coordinates'),
    timezone: pick('location.timezone'),
    email: pick('email'),
    b_day: pick('dob.date'),
    age: _.get(user, 'dob.age', null),
    phone: pick('phone'),
    picture_large: pick('picture.large'),
    picture_thumbnail: pick('picture.thumbnail'),
    favorite: false,
    course: _.sample(COURSES),
    bg_color: '#f75c4c',
    note: null,
  };
}

export function removeDuplicates(teachers) {
  return _.uniqBy(teachers, (teacher) => teacher.email || teacher.id);
}

// Валідація

export function getTeacherErrors(teacher, { checkPhone = true } = {}) {
  if (!_.isPlainObject(teacher)) return ['Invalid teacher object'];

  const errors = [];

  _.forEach(REQUIRED_STRING_FIELDS, (label, field) => {
    if (!_.isString(teacher[field]) || _.isEmpty(_.trim(teacher[field]))) {
      errors.push(`${label} is required`);
    }
  });

  if (!_.isNil(teacher.city) && !_.isString(teacher.city)) {
    errors.push('City must be a string');
  }

  if (!_.isFinite(teacher.age) || !_.inRange(teacher.age, MIN_AGE, MAX_AGE + 1)) {
    errors.push(`Age must be a number between ${MIN_AGE} and ${MAX_AGE}`);
  }

  if (!_.isString(teacher.email) || !EMAIL_REGEX.test(teacher.email)) {
    errors.push('Email is not valid');
  }

  if (checkPhone && (!_.isString(teacher.phone) || !PHONE_REGEX.test(teacher.phone))) {
    errors.push('Phone is not valid');
  }

  return errors;
}

export function validateTeacher(teacher, options) {
  return _.isEmpty(getTeacherErrors(teacher, options));
}

// 3. Фільтрація

function createAgeMatcher(age) {
  if (_.isNil(age) || age === '') return _.stubTrue;
  if (_.isNumber(age)) return (value) => value === age;

  if (_.endsWith(age, '+')) {
    const min = Number(_.trimEnd(age, '+'));
    return (value) => _.isNumber(value) && value >= min;
  }

  if (_.includes(age, '-')) {
    const [min, max] = _.map(_.split(age, '-'), Number);
    return (value) => _.isNumber(value) && _.inRange(value, min, max + 1);
  }

  return _.stubTrue;
}

export function filterTeachers(teachers, {
  country, region, age, gender, favorite, withPhoto,
} = {}) {
  const matchesAge = createAgeMatcher(age);
  const genderLower = _.toLower(gender);

  return _.filter(teachers, (teacher) => (!country || teacher.country === country)
    && (!region || getRegion(teacher.country) === region)
    && (!gender || _.toLower(teacher.gender) === genderLower)
    && (favorite === undefined || teacher.favorite === favorite)
    && (!withPhoto || Boolean(teacher.picture_large))
    && matchesAge(teacher.age));
}

// 4. Сортування

function getSortValue(teacher, field) {
  const value = teacher[field];
  if (field === 'b_day') return Date.parse(value);
  return _.isString(value) ? _.toLower(_.deburr(value)) : value;
}

export function sortTeachers(teachers, field, order = 'asc') {
  if (!_.includes(SORTABLE_FIELDS, field)) return teachers;

  const [withValue, withoutValue] = _.partition(teachers, (teacher) => !_.isNil(teacher[field]));
  const sorted = _.orderBy(withValue, [(teacher) => getSortValue(teacher, field)], [order]);

  return [...sorted, ...withoutValue];
}

// 5. Пошук

export function findTeacher(teachers, query) {
  if (_.isNil(query) || query === '') return teachers;
  const searchStr = _.toLower(String(query));

  return _.filter(teachers, (teacher) => _.includes(_.toLower(teacher.full_name), searchStr)
    || _.includes(_.toLower(teacher.note), searchStr)
    || (_.isNumber(teacher.age) && String(teacher.age) === searchStr));
}

// Відсоток викладачів за запитом

export function getTeacherPercentage(teachers, query) {
  if (_.isEmpty(teachers)) return 0;

  const searchStr = _.toLower(String(query));
  const isString = _.isString(query);

  const matchesAge = (age) => {
    if (isString && _.startsWith(query, '>')) return age > Number(query.slice(1));
    if (isString && _.startsWith(query, '<')) return age < Number(query.slice(1));
    return _.isNumber(age) && String(age) === searchStr;
  };

  const matchingCount = _.countBy(teachers, (teacher) => (
    _.includes(_.toLower(teacher.full_name), searchStr)
    || _.includes(_.toLower(teacher.note), searchStr)
    || matchesAge(teacher.age)
  )).true || 0;

  return _.round((matchingCount / teachers.length) * 100);
}

// Дати

export function calculateAge(birthDate) {
  return dayjs().diff(dayjs(birthDate), 'year');
}

export function getDaysUntilBirthday(birthDate, now = dayjs()) {
  const birth = dayjs(String(birthDate).slice(0, 10));
  if (!birthDate || !birth.isValid()) return null;

  const today = now.startOf('day');
  let next = birth.year(today.year());
  if (next.isBefore(today)) next = birth.year(today.year() + 1);

  return next.diff(today, 'day');
}
