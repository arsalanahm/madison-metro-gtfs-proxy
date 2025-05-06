import express from 'express';
import fetch from 'node-fetch';
import * as gtfs from 'gtfs-realtime-bindings';

const app = express();
const PORT = process.env.PORT || 10000;

// Add a simple root endpoint to check if the API is working
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Madison Metro GTFS-Realtime Proxy API is running', 
    endpoints: ['/realtime/trip-updates', '/test'] 
  });
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ status: 'ok', message: 'Test endpoint is working!' });
});

// Main endpoint for trip updates
app.get('/realtime/trip-updates', async (req, res) => {
  try {
    console.log('Fetching GTFS-Realtime data from Madison Metro...');
    
    const response = await fetch('https://transitdata.cityofmadison.com/gtfsrt/TripUpdate/TripUpdate.pb');
    
    if (!response.ok) {
      console.error(`Error from Madison API: ${response.status} ${response.statusText}`);
      return res.status(502).json({ 
        error: 'Failed to retrieve data from Madison Metro API', 
        status: response.status,
        message: response.statusText
      });
    }
    
    const buffer = await response.arrayBuffer();
    const feed = gtfs.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
    
    console.log('Successfully decoded GTFS-Realtime data');
    res.json(feed);
  } catch (err) {
    console.error('Error fetching/parsing GTFS-Realtime:', err);
    res.status(500).json({ 
      error: 'Failed to retrieve or parse trip updates',
      message: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy API listening on port ${PORT}`);
});
