// lexcode-expect: 0
import express from 'express';

const app = express();

app.post('/login', passport.authenticate('local'), (req, res) => res.redirect('/'));
app.get('/users/:id', requireStaff, (req, res) => res.json(users.get(req.params.id)));
app.post('/admin/invite', requireStaff, async (req, res) => {
  await invitations.send(req.body.email);
  res.sendStatus(202);
});
app.get('/registry/search', (req, res) => res.json(registry.search(String(req.query.q))));
app.post('/vehicles/register', requireStaff, (req, res) => res.sendStatus(201));
