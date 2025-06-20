
const FAKE_USERNAMES = [
  "Alex Baker",
  "Jamie Lin",
  "Taylor Smith",
  "Morgan Lee",
  "Jordan Park",
  "Casey Kim",
  "Avery Chen",
  "Riley Wu",
  "Drew Patel",
  "Quinn Rossi"
];

// Deterministic random: Pick a user by booking/project
export function getFakeUserForBooking(instrumentId: string, project: string) {
  const key = instrumentId + "-" + project;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash) + key.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % FAKE_USERNAMES.length;
  return FAKE_USERNAMES[idx];
}

export { FAKE_USERNAMES };
