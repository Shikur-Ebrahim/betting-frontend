import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  doc 
} from "firebase/firestore";

/**
 * Subscribe to live matches in real-time.
 */
export function subscribeToLiveMatches(callback: (matches: any[]) => void) {
  const q = query(
    collection(db, "live_matches"),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const matches = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    callback(matches);
  }, (error) => {
    console.error("Error subscribing to live matches:", error);
  });
}

/**
 * Subscribe to upcoming fixtures.
 */
export function subscribeToFixtures(callback: (fixtures: any[]) => void) {
  const q = query(
    collection(db, "fixtures"),
    orderBy("fixture.date", "asc"),
    limit(100)
  );

  return onSnapshot(q, (snapshot) => {
    const fixtures = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    callback(fixtures);
  }, (error) => {
    console.error("Error subscribing to fixtures:", error);
  });
}

/**
 * Subscribe to odds for a specific fixture.
 */
export function subscribeToOdds(fixtureId: string | number, callback: (odds: any) => void) {
  if (!fixtureId) return () => {};
  
  return onSnapshot(doc(db, "odds", fixtureId.toString()), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback(null);
    }
  }, (error) => {
    console.error(`Error subscribing to odds for ${fixtureId}:`, error);
  });
}
