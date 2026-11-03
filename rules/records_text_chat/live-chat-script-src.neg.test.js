// lexcode-expect: 0
// Scripts added from other hosts, from our own path, and an image whose source is a
// chat vendor's logo shown as a link, not loaded as a script.
function loadMaps(key) {
  const script = document.createElement('script');
  script.src = 'https://maps.googleapis.com/maps/api/js?key=' + key;
  document.head.appendChild(script);
}

function loadOwnBundle() {
  const script = document.createElement('script');
  script.src = '/static/vendor/chart.min.js';
  document.head.appendChild(script);
}

function loadAnalyticsHelper() {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/dayjs@1.11.13/dayjs.min.js';
  document.head.appendChild(script);
}

const notes = {
  help: 'Our help desk is at https://embed.tawk.to/ on the support site only.',
  logo: 'src = embed.tawk.to is the vendor host',
};
