const UNKNOWN = 'Unknown';

const getAgeGroup = (age) => {
  if (!_.isNumber(age)) return UNKNOWN;
  if (age <= 31) return '18-31';
  if (age <= 45) return '32-45';
  return '46+';
};

const GROUPINGS = {
  course: (teacher) => teacher.course || UNKNOWN,
  gender: (teacher) => teacher.gender || UNKNOWN,
  country: (teacher) => teacher.country || UNKNOWN,
  age: (teacher) => getAgeGroup(teacher.age),
};

let chart = null;
let currentTeachers = [];

const getColors = (count) => _.times(count, (i) => `hsl(${Math.round((360 / count) * i)}, 65%, 55%)`);

function formatTooltip(context) {
  const total = _.sum(context.dataset.data);
  const value = context.parsed;
  return ` ${context.label}: ${value} (${_.round((value / total) * 100, 1)}%)`;
}

function createChart(canvas) {
  return new Chart(canvas, {
    type: 'pie',
    data: { labels: [], datasets: [{ data: [], backgroundColor: [] }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right' },
        tooltip: { callbacks: { label: formatTooltip } },
      },
    },
  });
}

function draw() {
  const groupKey = document.getElementById('pie-group').value;
  const counts = _.countBy(currentTeachers, GROUPINGS[groupKey]);
  const sortedPairs = _.orderBy(_.toPairs(counts), [1], ['desc']);

  const isEmpty = _.isEmpty(sortedPairs);
  document.getElementById('pie-empty').hidden = !isEmpty;
  document.getElementById('pie-chart').hidden = isEmpty;

  chart.data.labels = _.map(sortedPairs, 0);
  chart.data.datasets[0].data = _.map(sortedPairs, 1);
  chart.data.datasets[0].backgroundColor = getColors(sortedPairs.length);
  chart.update();
}

export function initPieChart() {
  chart = createChart(document.getElementById('pie-chart'));
  document.getElementById('pie-group').addEventListener('change', draw);
}

export function updatePieChart(teachers) {
  currentTeachers = teachers;
  draw();
}
