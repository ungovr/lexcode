// lexcode-expect: 3
// The classic snippets that add a chat widget to a page by creating a script tag.
(function () {
  var s1 = document.createElement('script');
  s1.async = true;
  s1.src = 'https://embed.tawk.to/5e1f0000000000/default';
  s1.charset = 'UTF-8';
  document.head.appendChild(s1);
})();

function loadIntercom(appId) {
  var s = document.createElement('script');
  s.type = 'text/javascript';
  s.async = true;
  s.src = 'https://widget.intercom.io/widget/' + appId;
  document.head.appendChild(s);
}

function loadCrisp() {
  const script = document.createElement('script');
  script.src = "//client.crisp.chat/l.js";
  document.getElementsByTagName('head')[0].appendChild(script);
}
