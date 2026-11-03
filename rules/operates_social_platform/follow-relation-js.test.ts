// lexcode-expect: 2
import express from 'express';
import mongoose from 'mongoose';
import { prisma } from './db';

const router = express.Router();

router.post('/users/:id/follow', async (req, res) => {
  await prisma.follow.create({
    data: { followerId: req.user.id, followingId: req.params.id },
  });
  res.sendStatus(204);
});

const followSchema = new mongoose.Schema({
  follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  following: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Follow = mongoose.model('Follow', followSchema);
export default router;
