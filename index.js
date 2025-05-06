import express from 'express';
import fetch from 'node-fetch';
import * as gtfs from 'gtfs-realtime-bindings';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/realtime/trip-updates', async (req, res) => {
  try {
    const response = await fetch('https://transitdata.cityofmadison.com/gtfsrt/TripUpdate/TripUpdate.pb');
    const buffer = await response.arrayBuffer();
    const feed = gtfs.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
    res.json(feed);
  } catch (err) {
    console.error('Error fetching/parsing GTFS-Realtime:', err);
    res.status(500).json({ error: 'Failed to retrieve or parse trip updates.' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy API listening on port ${PORT}`);
});
