/* Stockist finder — fully dynamic by design.
   The CSV lives in the owner's Dropbox and is fetched in the browser at page
   load, so edits go live with NO site deploy. Do not move this to build time.
   No jQuery, no jquery-csv: ~40 lines of native fetch + parse. */
(function () {
  'use strict';

  var root = document.querySelector('.stk');
  if (!root) return;

  var csvUrl = root.getAttribute('data-csv');
  var stateFilter = (root.getAttribute('data-state') || '').toUpperCase();
  var listEl = root.querySelector('[data-stk-list]');
  var statusEl = root.querySelector('[data-stk-status]');
  var countEl = root.querySelector('[data-stk-count]');
  var input = root.querySelector('.stk__input');
  var mapEl = root.querySelector('[data-stk-map]');

  var all = [];

  /* The filter lives in a <form role="search"> — Enter must refine, not
     reload the page and wipe the loaded list. */
  var form = root.querySelector('form');
  if (form) form.addEventListener('submit', function (e) { e.preventDefault(); });

  /* RFC-ish CSV parse: handles quoted fields and embedded commas. */
  function parseCSV(text) {
    var rows = [], row = [], field = '', inQ = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQ) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
        else field += c;
      } else if (c === '"') inQ = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (field !== '' || row.length) { row.push(field); rows.push(row); row = []; field = ''; }
        if (c === '\r' && text[i + 1] === '\n') i++;
      } else field += c;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    var head = rows.shift() || [];
    return rows.filter(function (r) { return r.length > 1; }).map(function (r) {
      var o = {};
      head.forEach(function (h, j) { o[h.trim()] = (r[j] || '').trim(); });
      return o;
    });
  }

  /* Two-pass: exact uppercase abbreviation first (the common case), then a
     case-insensitive recovery pass — the live CSVs mix "VIC", "Vic" and
     "Victoria" and the strict pass alone drops those rows. */
  var STATE_NAMES = {
    'new south wales': 'NSW', 'victoria': 'VIC', 'queensland': 'QLD',
    'south australia': 'SA', 'western australia': 'WA', 'tasmania': 'TAS',
    'northern territory': 'NT', 'australian capital territory': 'ACT'
  };
  function stateOf(s) {
    var hay = (s['Address 2'] || '') + ' ' + (s['Address 1'] || '');
    var m = hay.match(/\b(NSW|VIC|QLD|SA|WA|TAS|NT|ACT)\b/);
    if (m) return m[1];
    m = hay.match(/\b(new south wales|victoria|queensland|south australia|western australia|tasmania|northern territory|australian capital territory|nsw|vic|qld|sa|wa|tas|nt|act)\b/i);
    if (!m) return '';
    var t = m[1].toLowerCase();
    return STATE_NAMES[t] || t.toUpperCase();
  }

  function render(items) {
    listEl.innerHTML = '';
    var frag = document.createDocumentFragment();
    items.forEach(function (s) {
      var li = document.createElement('li');
      li.className = 'stk__item';
      var addr = [s['Address 1'], s['Address 2']].filter(Boolean).join(', ');
      var mapsQ = encodeURIComponent((s.Customer || '') + ' ' + addr);
      li.innerHTML =
        '<h3>' + esc(s.Customer) + '</h3>' +
        '<p>' + esc(addr) + '</p>' +
        '<p class="stk__item-links">' +
        (s.Phone ? '<a href="tel:' + esc(s.Phone.replace(/\s+/g, '')) + '">' + esc(s.Phone) + '</a> · ' : '') +
        '<a href="https://www.google.com/maps/search/?api=1&query=' + mapsQ + '" rel="noopener">Directions</a></p>';
      frag.appendChild(li);
    });
    listEl.appendChild(frag);
    countEl.textContent = items.length + ' stockist' + (items.length === 1 ? '' : 's');
  }

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function apply() {
    var q = (input.value || '').toLowerCase();
    var items = all.filter(function (s) {
      if (stateFilter && stateOf(s) !== stateFilter) return false;
      if (!q) return true;
      return ((s.Customer || '') + ' ' + (s['Address 1'] || '') + ' ' + (s['Address 2'] || ''))
        .toLowerCase().indexOf(q) !== -1;
    });
    render(items);
    plot(items);
  }

  /* Map is enhancement only: the list is the product. */
  var map, markers = [];
  function plot(items) {
    if (!window.google || !google.maps || !mapEl || mapEl.hidden) return;
    markers.forEach(function (m) { m.setMap(null); });
    markers = [];
    var bounds = new google.maps.LatLngBounds();
    items.forEach(function (s) {
      var lat = parseFloat(s.Latitude), lng = parseFloat(s.Longitude);
      if (isNaN(lat) || isNaN(lng)) return;
      var pos = { lat: lat, lng: lng };
      var m = new google.maps.Marker({ map: map, position: pos, title: s.Customer });
      markers.push(m);
      bounds.extend(pos);
    });
    if (markers.length) map.fitBounds(bounds, 40);
  }

  function initMap() {
    var key = root.getAttribute('data-maps-key');
    if (!key || !mapEl) return;
    var s = document.createElement('script');
    s.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(key) + '&loading=async&callback=__stkMapReady';
    s.async = true;
    window.__stkMapReady = function () {
      mapEl.hidden = false;
      mapEl.removeAttribute('aria-hidden');
      map = new google.maps.Map(mapEl, {
        center: { lat: -29.5, lng: 145 },
        zoom: 4,
        mapTypeControl: false,
        streetViewControl: false
      });
      apply();
    };
    document.head.appendChild(s);
  }

  statusEl.textContent = 'Loading stockists…';
  fetch(csvUrl, { redirect: 'follow' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(function (text) {
      all = parseCSV(text);
      statusEl.textContent = '';
      apply();
      initMap();
    })
    .catch(function () {
      statusEl.innerHTML = 'The stockist list couldn’t load just now. ' +
        'Ring us on <a href="tel:+61352322200">(03) 5232 2200</a> and we’ll ' +
        'point you to your nearest stockist.';
      countEl.textContent = '';
    });

  var t;
  input.addEventListener('input', function () { clearTimeout(t); t = setTimeout(apply, 120); });
})();
