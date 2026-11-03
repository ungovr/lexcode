'use strict';
// Loaded with `node --require test/stubs/deny-network.cjs <script>`. Makes every way a Node
// program opens a connection throw, so a run that finishes anyway made no network call.
// It patches this Node process only; a child process (the engine binary) is not touched.
const net = require('node:net');
const tls = require('node:tls');
const http = require('node:http');
const https = require('node:https');
const http2 = require('node:http2');
const dns = require('node:dns');
const dgram = require('node:dgram');

function denied(what) {
  const err = new Error(`network denied by test/stubs/deny-network.cjs: ${what}`);
  err.code = 'ENETDENIED';
  return err;
}

function deny(target, name, label) {
  if (typeof target[name] !== 'function') return;
  target[name] = function denyNetwork() {
    throw denied(label);
  };
}

for (const name of ['connect', 'createConnection']) {
  deny(net, name, `net.${name}`);
  deny(tls, name, `tls.${name}`);
  deny(http2, name, `http2.${name}`);
}
deny(net.Socket.prototype, 'connect', 'net.Socket.prototype.connect');
deny(tls.TLSSocket.prototype, 'connect', 'tls.TLSSocket.prototype.connect');
for (const name of ['request', 'get']) {
  deny(http, name, `http.${name}`);
  deny(https, name, `https.${name}`);
}
for (const name of ['lookup', 'resolve', 'resolve4', 'resolve6', 'resolveAny', 'reverse', 'lookupService']) {
  deny(dns, name, `dns.${name}`);
  if (dns.promises) deny(dns.promises, name, `dns.promises.${name}`);
}
deny(dgram, 'createSocket', 'dgram.createSocket');

globalThis.fetch = function denyFetch() {
  throw denied('fetch');
};
