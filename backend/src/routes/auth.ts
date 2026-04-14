import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { readDb } from '../store';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const db = readDb();
  const user = db.users.find((u) => u.email === email);

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role, name: user.full_name },
    process.env.JWT_SECRET as string,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
  });
});

export default router;
