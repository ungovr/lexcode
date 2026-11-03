// lexcode-expect: 0
import express from 'express';
import { db } from './db';

const router = express.Router();

export async function approveInvoice(invoiceId: string, approverId: string) {
  await db.invoice.update({ where: { id: invoiceId }, data: { status: 'approved', approverId } });
}

export const reviewPullRequest = async (prId: string) => db.pullRequest.findUnique({ where: { id: prId } });

router.post('/orders/:id/approve', requireManager, async (req, res) => {
  await approveInvoice(req.params.id, req.user.id);
  res.sendStatus(204);
});

router.post('/plugins/:id/install', requireUser, async (req, res) => {
  await db.install.create({ data: { pluginId: req.params.id, userId: req.user.id } });
  res.sendStatus(201);
});

export default router;
