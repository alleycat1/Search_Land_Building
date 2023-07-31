export default async function handler(req, res) {
    if (req.method !== 'GET') {
      return res.status(405).end();
    }
  
    if (!req.session.user) {
      return res.status(401).end();
    }
  
    res.status(200).end();
}
