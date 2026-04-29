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
export function subscribeToLiveMatches(callback: (matches: Record<string, unknown>[]) => void) {
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
export function subscribeToFixtures(callback: (fixtures: Record<string, unknown>[]) => void) {
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
 * Subscribe to configured leagues.
 */
export function subscribeToLeagues(callback: (leagues: Record<string, unknown>[]) => void) {
  return onSnapshot(doc(db, "config", "leagues_list"), (docSnap) => {
    if (!docSnap.exists()) {
      callback([]);
      return;
    }
    callback(docSnap.data().leagues || []);
  }, (error) => {
    console.error("Error subscribing to leagues:", error);
  });
}

/**
 * Subscribe to teams for a single league.
 */
export function subscribeToLeagueTeams(leagueId: string | number, callback: (teams: unknown[]) => void) {
  if (!leagueId) return () => {};

  return onSnapshot(doc(db, "league_teams", leagueId.toString()), (docSnap) => {
    if (!docSnap.exists()) {
      callback([]);
      return;
    }
    const teamsMap = docSnap.data()?.teams || {};
    callback(Object.values(teamsMap));
  }, (error) => {
    console.error(`Error subscribing to league teams for ${leagueId}:`, error);
  });
}

/**
 * Subscribe to odds for a specific fixture.
 */
export function subscribeToOdds(fixtureId: string | number, callback: (odds: Record<string, unknown> | null) => void) {
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
