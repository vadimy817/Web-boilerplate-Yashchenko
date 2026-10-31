const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const DEFAULT_ZOOM = 4;

let map = null;
let marker = null;

const toCoordinate = (value) => (_.isNil(value) || value === '' ? NaN : Number(value));

export function parseCoordinates(coordinates) {
  const lat = toCoordinate(_.get(coordinates, 'latitude'));
  const lng = toCoordinate(_.get(coordinates, 'longitude'));

  const isValid = Number.isFinite(lat) && Number.isFinite(lng)
    && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

  return isValid ? [lat, lng] : null;
}

function getMap(container) {
  if (!map) {
    map = L.map(container);
    L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION }).addTo(map);
    marker = L.marker([0, 0]).addTo(map);
  }
  return map;
}

export function showTeacherMap(teacher) {
  const wrapper = document.getElementById('teacher-map-wrapper');
  const container = document.getElementById('teacher-map');
  const note = document.getElementById('teacher-map-note');

  const position = parseCoordinates(teacher.coordinates);
  wrapper.hidden = !position;
  note.hidden = Boolean(position);
  if (!position) return;

  container.hidden = false;
  const leafletMap = getMap(container);

  const label = document.createElement('div');
  label.textContent = _.compact([teacher.city, teacher.country]).join(', ') || teacher.full_name;
  marker.setLatLng(position).bindPopup(label);

  leafletMap.invalidateSize();
  leafletMap.setView(position, DEFAULT_ZOOM);
}

export function initMapToggle() {
  document.getElementById('toggle-map').addEventListener('click', (event) => {
    event.preventDefault();
    const container = document.getElementById('teacher-map');
    container.hidden = !container.hidden;

    if (!container.hidden && map) {
      map.invalidateSize();
      map.setView(marker.getLatLng(), map.getZoom());
    }
  });
}
