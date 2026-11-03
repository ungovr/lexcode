// lexcode-expect: 3
import axios from 'axios';

// Creates a Veriff session for a new customer before their first order is released.
export async function createVeriffSession(user) {
  const reply = await fetch('https://stationapi.veriff.com/v1/sessions', {
    method: 'POST',
    headers: { 'x-auth-client': process.env.VERIFF_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ verification: { person: { firstName: user.first, lastName: user.last } } }),
  });
  return reply.json();
}

// Reads the outcome of a Persona inquiry.
export async function personaInquiry(id) {
  const res = await axios.get(`https://withpersona.com/api/v1/inquiries/${id}`, {
    headers: { authorization: `Bearer ${process.env.PERSONA_KEY}` },
  });
  return res.data.data.attributes.status;
}

// Starts an Onfido check through the vendor's REST API.
export async function onfidoCheck(applicantId) {
  return axios.post('https://api.eu.onfido.com/v3.6/checks', { applicant_id: applicantId }, {
    headers: { authorization: `Token token=${process.env.ONFIDO_TOKEN}` },
  });
}
