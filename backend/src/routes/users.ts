// backend/src/routes/users.ts
import {Router, Request, Response} from 'express';
import {getAuth} from 'firebase-admin/auth';
import {FieldValue} from 'firebase-admin/firestore';
import {db} from '../firebase'; // your firebase-admin init

/**
 * Express router for user-related endpoints
 */
const router = Router();

/**
 * POST /api/users/profile
 *   - expects an ID token in Authorization: Bearer <token>
 *   - verifies it, upserts a `users/{uid}` doc, and returns {uid, name, email}
 */
router.post('/profile', async (req: Request, res: Response) => {
  // Debug incoming request
  console.log('[users/profile] hit /profile', {
    body: req.body,
    authHeader: req.headers.authorization,
  });

  // 1) grab the token from `Authorization: Bearer …`
  const authHeader = (req.headers.authorization ?? '').toString();
  let idToken: string | undefined;

  if (authHeader.startsWith('Bearer ')) {
    idToken = authHeader.slice('Bearer '.length);
    console.log('[users/profile] token from header');
  } else {
    idToken = (req.body.idToken as string) || undefined;
    console.log('[users/profile] token from body');
  }

  if (!idToken) {
    console.warn('[users/profile] missing idToken');
    res.status(400).json({error: 'Missing idToken'});
    return; // Handler must return void
  }

  try {
    // 2) verify token
    const decoded = await getAuth().verifyIdToken(idToken);
    const {uid, name = null, email = null, picture = null} = decoded;
    console.log('[users/profile] verified uid=', uid);

    // 3) upsert user doc
    const userRef = db.collection('users').doc(uid);
    const snap = await userRef.get();
    const now = FieldValue.serverTimestamp();

    if (!snap.exists) {
      console.log('[users/profile] creating new users/%s', uid);
      await userRef.set({
        name,
        email,
        photoURL: picture,
        createdAt: now,
        lastSeen: now,
        proficiencyLevel: 'beginner',
      });
    } else {
      console.log('[users/profile] updating lastSeen for %s', uid);
      await userRef.update({lastSeen: now});
    }

    // 4) send back minimal profile
    res.json({uid, name, email});
    // No `return res.json(...)`
  } catch (err) {
    console.error('[users/profile] error:', err);
    res.status(401).json({error: 'Invalid or expired idToken'});
  }
});

export default router;