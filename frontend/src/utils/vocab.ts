import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    serverTimestamp,
  } from "firebase/firestore";
  import { db } from "./firebase";
  
  const wordsCol = (uid: string) => collection(db, "users", uid, "knownWords");
  
  export async function fetchKnownWords(uid: string): Promise<string[]> {
    const snap = await getDocs(wordsCol(uid));
    return snap.docs.map((d) => d.id);
  }
  
  export async function addWord(uid: string, word: string) {
    const ref  = doc(wordsCol(uid), word);
    const snap = await getDoc(ref);
  
    if (!snap.exists()) {
      await setDoc(ref, {
        firstSeen: serverTimestamp(),
        lastSeen:  serverTimestamp(),
        count:     1,
        proficiency: "new",
      });
    } else {
      await updateDoc(ref, {
        lastSeen: serverTimestamp(),
        count:    (snap.data().count ?? 0) + 1,
      });
    }
  }
  