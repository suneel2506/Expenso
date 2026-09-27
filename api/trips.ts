// Memory cache across warm serverless invocations on Vercel
const tripsCache = new Map<string, any>();
const codeLookup = new Map<string, string>(); // code -> tripId

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { code, id } = req.query || {};

  // GET query
  if (req.method === 'GET') {
    if (code) {
      const cleanCode = String(code).trim().toUpperCase();
      const tripId = codeLookup.get(cleanCode);
      if (tripId && tripsCache.has(tripId)) {
        return res.json({ trip: tripsCache.get(tripId) });
      }
      for (const trip of tripsCache.values()) {
        if (trip.code?.toUpperCase() === cleanCode) {
          return res.json({ trip });
        }
      }
      return res.status(404).json({ error: 'Trip not found with this code' });
    }

    if (id) {
      const trip = tripsCache.get(String(id));
      if (trip) return res.json({ trip });
      return res.status(404).json({ error: 'Trip not found' });
    }

    return res.json({ trips: Array.from(tripsCache.values()) });
  }

  // POST or PUT (Save trip)
  if (req.method === 'POST' || req.method === 'PUT') {
    const trip = req.body;
    if (trip && trip.id) {
      tripsCache.set(trip.id, trip);
      if (trip.code) {
        codeLookup.set(trip.code.toUpperCase(), trip.id);
      }
      return res.json({ success: true, trip });
    }
    return res.status(400).json({ error: 'Trip with id is required' });
  }

  // DELETE
  if (req.method === 'DELETE') {
    if (id) {
      tripsCache.delete(String(id));
    } else {
      tripsCache.clear();
      codeLookup.clear();
    }
    return res.json({ success: true, message: 'Trips cleared' });
  }

  return res.json({ success: true });
}
