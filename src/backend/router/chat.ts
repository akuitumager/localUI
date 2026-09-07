import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database';

const router = Router();

router.get('/sessions', (req, res) => {
  try {
    const sessions = db.prepare('SELECT * FROM sessions ORDER BY updated_at DESC').all();
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

router.get('/sessions/:id/messages', (req, res) => {
  const { id } = req.params;
  try {
    const messages = db.prepare('SELECT id, role, content FROM messages WHERE session_id = ? ORDER BY created_at ASC').all(id);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/sessions', (req, res) => {
  const { title } = req.body;
  const id = uuidv4();
  
  try {
    const stmt = db.prepare('INSERT INTO sessions (id, title) VALUES (?, ?)');
    stmt.run(id, title || 'New Chat');
    res.json({ id, title: title || 'New Chat' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

router.post('/messages', (req, res) => {
  const { sessionId, role, content } = req.body;
  if (!sessionId || !role || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const messageId = uuidv4();

  try {
    const insertMsg = db.prepare(
      'INSERT INTO messages (id, session_id, role, content) VALUES (?, ?, ?, ?)'
    );
    const updateSession = db.prepare(
      'UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    );

    const saveTransaction = db.transaction(() => {
      insertMsg.run(messageId, sessionId, role, content);
      updateSession.run(sessionId);
    });

    saveTransaction();
    res.json({ success: true, id: messageId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save message' });
  }
});

router.delete('/sessions/:id', (req, res) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
    stmt.run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

export default router;