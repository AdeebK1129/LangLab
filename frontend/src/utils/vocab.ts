import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    serverTimestamp,
  } from 'firebase/firestore';
  import {db} from './firebase';
  
  /**
   * Returns a reference to the knownWords collection for a user
   */
  const wordsCol = (uid: string) => collection(db, 'users', uid, 'knownWords');
  
  /**
   * Fetches all known words for a user
   * @param uid User ID to fetch words for
   * @return List of known words
   */
  export async function fetchKnownWords(uid: string): Promise<string[]> {
    const snap = await getDocs(wordsCol(uid));
    return snap.docs.map((d) => d.id);
  }
  
  /**
   * Adds or updates a word in the user's known words collection
   * @param uid User ID to add the word for
   * @param word The word to add or update
   */
  export async function addWord(uid: string, word: string) {
    const ref = doc(wordsCol(uid), word);
    const snap = await getDoc(ref);
  
    if (!snap.exists()) {
      await setDoc(ref, {
        firstSeen: serverTimestamp(),
        lastSeen: serverTimestamp(),
        count: 1,
        proficiency: 'new',
      });
    } else {
      await updateDoc(ref, {
        lastSeen: serverTimestamp(),
        count: (snap.data().count ?? 0) + 1,
      });
    }
  }