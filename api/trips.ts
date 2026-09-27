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

  // Trips data in the frontend is primarily stored in LocalStorage, with server as optional sync
  if (req.method === 'GET') {
    return res.json({ trips: [] });
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    return res.json({ success: true, trip: req.body });
  }

  if (req.method === 'DELETE') {
    return res.json({ success: true, message: 'Trips handled' });
  }

  return res.json({ success: true });
}
