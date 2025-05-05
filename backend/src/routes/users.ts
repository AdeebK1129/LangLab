// backend/src/routes/users.ts
import { Router,NextFunction }      from "express"
import { getAuth }                  from "firebase-admin/auth"
import { FieldValue }               from "firebase-admin/firestore"
import { db }                       from "../firebase"       // ← your firebase‐admin init file

const router = Router()

router.post(
  "/api/users/profile",
  async (req, res, next) => {
    try {
      const idToken = req.body.idToken as string | undefined
      if (!idToken) {
        res.status(400).json({ error: "Missing idToken" })
        return
      }

      // 1) verify the Firebase ID token
      const decoded = await getAuth().verifyIdToken(idToken)
      const { uid, name = null, email = null, picture = null } = decoded

      // 2) upsert their Firestore profile
      const userRef = db.collection("users").doc(uid)
      const snap    = await userRef.get()
      const now     = FieldValue.serverTimestamp()

      if (!snap.exists) {
        await userRef.set({
          name,
          email,
          photoURL: picture,
          createdAt: now,
          lastSeen: now,
          proficiencyLevel: "beginner",
        })
      } else {
        await userRef.update({ lastSeen: now })
      }

      // 3) send them back a minimal profile
      res.json({ uid, name, email })
    } catch (err) {
      console.error("Error in /api/users/profile", err)
      res.status(401).json({ error: "Invalid or expired idToken" })
    }
  }
)

export default router
