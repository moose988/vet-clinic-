/* =========================================================
   CLINIC CONFIGURATION
   ---------------------------------------------------------
   To make owner tracking links LIVE (auto-updating on the
   owner's phone), connect a free Firebase Realtime Database:

   1. Go to https://console.firebase.google.com → Add project
      (no Google Analytics needed).
   2. In the project: Build → Realtime Database → Create
      Database → choose a location → start in "test mode".
   3. Copy the database URL shown at the top, e.g.
        https://your-project-default-rtdb.firebaseio.com
      (it may end in .europe-west1.firebasedatabase.app)
   4. Paste it below between the quotes. Done — owner links
      now update in real time, and services/offers sync
      across all devices.

   ⚠️ Test mode rules are public. Before going to production,
   secure the rules in Firebase console (e.g. restrict writes).

   Leave empty ('') to run without a backend — owner links
   then carry a snapshot of the status instead.
   ========================================================= */
window.HUD_CONFIG = {
  databaseURL: ''
};
