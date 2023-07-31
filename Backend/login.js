import bcrypt from 'bcrypt';
import { pool } from '../../lib/db';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { username, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    req.session.user = { id: user.id, username: user.username };
    req.session.save(() => {
      res.setHeader('Set-Cookie', serialize('session_id', req.session.id, {
        httpOnly: true,
        maxAge: 60 * 60 * 24, // 1 day
        sameSite: 'strict',
        path: '/',
      }));
      res.status(200).json({ message: 'Login successful' });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
