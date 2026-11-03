// lexcode-expect: 2
// Express chat handlers in plain JavaScript that store the conversation.
const express = require('express');
const { Conversation } = require('./models');
const { MongoClient } = require('mongodb');

const app = express();
const mongo = new MongoClient(process.env.MONGO_URL);

app.post('/chat', async (req, res) => {
  const { messages, sessionId } = req.body;
  await mongo.db('support').collection('chats').insertOne({ sessionId, messages, at: new Date() });
  res.json({ stored: true });
});

app.post('/chat/archive', async (req, res) => {
  await Conversation.create({ owner: req.user.id, transcript: req.body.messages });
  res.json({ stored: true });
});
