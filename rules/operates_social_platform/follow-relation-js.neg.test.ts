// lexcode-expect: 0
import express from 'express';

const router = express.Router();

interface GitHubProfile {
  login: string;
  followers: number;
  following: number;
}

export function describe(profile: GitHubProfile): string {
  return `${profile.login} has ${profile.followers} followers`;
}

router.post('/tickets/:id/follow-up', async (req, res) => {
  await queue.add('follow-up-email', { ticketId: req.params.id });
  res.sendStatus(202);
});

router.get('/orders/:id/follow-through', (req, res) => res.json({ ok: true }));

export default router;
