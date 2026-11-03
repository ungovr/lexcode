// lexcode-expect: 3
import express from 'express';
import { db } from './db';

const router = express.Router();

export async function approvePlugin(submissionId: string, reviewerId: string) {
  await db.submission.update({ where: { id: submissionId }, data: { status: 'approved', reviewerId } });
}

export const rejectExtension = async (submissionId: string, reason: string) => {
  await db.submission.update({ where: { id: submissionId }, data: { status: 'rejected', reason } });
};

router.post('/extensions/:id/approve', requireModerator, async (req, res) => {
  await approvePlugin(req.params.id, req.user.id);
  res.sendStatus(204);
});

export default router;
