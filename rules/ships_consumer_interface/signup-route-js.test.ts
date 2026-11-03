// lexcode-expect: 2
import express from 'express';

const app = express();

app.get('/signup', (req, res) => res.render('signup'));
app.post('/api/auth/register', async (req, res) => {
  const account = await accounts.create(req.body);
  res.status(201).json({ id: account.id });
});

app.post('/login', passport.authenticate('local'), (req, res) => res.redirect('/'));
