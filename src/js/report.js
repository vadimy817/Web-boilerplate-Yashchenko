export const VIEW_COUNTRY = 'country';
export const VIEW_FLAT = 'flat';

const FIELD_META = {
  id: { caption: 'ID', type: 'string' },
  full_name: { caption: 'Name', type: 'string' },
  course: { caption: 'Speciality', type: 'string' },
  age: { caption: 'Age', type: 'number' },
  gender: { caption: 'Gender', type: 'string' },
  country: { caption: 'Country', type: 'string' },
  city: { caption: 'City', type: 'string' },
  email: { caption: 'Email', type: 'string' },
  phone: { caption: 'Phone', type: 'string' },
  b_day: { caption: 'Date of birth', type: 'string' },
};

const FLAT_FIELDS = ['full_name', 'course', 'age', 'gender', 'country', 'city', 'email', 'phone', 'b_day'];

const HIDDEN_TOOLBAR_TABS = ['wdr-tab-connect', 'wdr-tab-open', 'wdr-tab-save'];

let pivot = null;
let isReady = false;
let pendingRows = null;
let currentRows = [];
let currentView = VIEW_COUNTRY;

const withFieldMeta = (rows) => [FIELD_META, ...rows];

const toRow = (teacher) => ({
  id: String(teacher.id),
  full_name: teacher.full_name || '',
  course: teacher.course || '',
  age: _.isNumber(teacher.age) ? teacher.age : null,
  gender: teacher.gender || '',
  country: teacher.country || '',
  city: teacher.city || '',
  email: teacher.email || '',
  phone: teacher.phone || '',
  b_day: teacher.b_day ? String(teacher.b_day).slice(0, 10) : '',
});

function buildReport(view, rows) {
  const common = {
    dataSource: { data: withFieldMeta(rows) },
    formats: [{ name: 'oneDecimal', maxDecimalPlaces: 1 }],
  };

  if (view === VIEW_FLAT) {
    return {
      ...common,
      slice: {
        rows: _.map(FLAT_FIELDS, (uniqueName) => ({ uniqueName })),
        columns: [{ uniqueName: '[Measures]' }],
        measures: [],
      },
      options: {
        grid: { type: 'flat', showTotals: 'off', showGrandTotals: 'off' },
        configuratorButton: false,
      },
    };
  }

  return {
    ...common,
    slice: {
      rows: [{ uniqueName: 'country' }],
      columns: [{ uniqueName: '[Measures]' }],
      measures: [
        { uniqueName: 'id', aggregation: 'count', caption: 'Teachers' },
        {
          uniqueName: 'age', aggregation: 'average', caption: 'Average age', format: 'oneDecimal',
        },
      ],
    },
    options: {
      grid: { type: 'compact', showTotals: 'off', showGrandTotals: 'on' },
      showAggregationLabels: false,
      configuratorButton: false,
    },
  };
}

function onToolbarCreate(toolbar) {
  const tabs = toolbar.getTabs();
  toolbar.getTabs = () => _.reject(tabs, (tab) => _.includes(HIDDEN_TOOLBAR_TABS, tab.id));
}

function onReportComplete() {
  isReady = true;
  if (pendingRows) {
    const rows = pendingRows;
    pendingRows = null;
    pivot.updateData({ data: withFieldMeta(rows) });
  }
}

function createPivot(rows) {
  pivot = new WebDataRocks({
    container: '#wdr-component',
    width: '100%',
    height: 460,
    toolbar: true,
    beforetoolbarcreated: onToolbarCreate,
    reportcomplete: onReportComplete,
    report: buildReport(currentView, rows),
  });
}

export function updateReport(teachers) {
  currentRows = _.map(teachers, toRow);

  if (!pivot) {
    createPivot(currentRows);
  } else if (isReady) {
    pivot.updateData({ data: withFieldMeta(currentRows) });
  } else {
    pendingRows = currentRows;
  }
}

export function setReportView(view) {
  currentView = view;
  if (!pivot) return;
  isReady = false;
  pendingRows = null;
  pivot.setReport(buildReport(view, currentRows));
}
