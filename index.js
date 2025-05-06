import express from 'express';
import fetch from 'node-fetch';
import * as gtfs from 'gtfs-realtime-bindings';

const app = express();
const PORT = process.env.PORT || 10000;

// Add CORS headers to allow browser access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Root endpoint with API information
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Madison Metro GTFS-Realtime Proxy API',
    description: 'Converts Madison Metro GTFS-Realtime Protocol Buffer feeds to JSON',
    endpoints: {
      '/': 'This API information',
      '/test': 'Test if the API is working',
      '/realtime/trip-updates': 'Real-time arrival predictions',
      '/realtime/vehicle-positions': 'Current vehicle locations',
      '/realtime/service-alerts': 'Service disruptions and alerts'
    },
    documentation: 'https://gtfs.org/documentation/realtime/'
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ status: 'ok', message: 'API test endpoint is working!' });
});

// List available GTFS static feeds
app.get('/static/feeds', async (req, res) => {
  try {
    // Madison Metro should have a public GTFS static feed URL
    // This is typically a ZIP file with schedule data
    res.json({
      status: 'info',
      message: 'Madison Metro GTFS static data should be available at their official website',
      possibleUrl: 'https://www.cityofmadison.com/metro/planning/transit-data',
      note: 'This endpoint is informational only and does not fetch actual data'
    });
  } catch (err) {
    res.status(500).json({
      error: 'Failed to retrieve GTFS static information',
      message: err.message
    });
  }
});

// GTFS-Realtime Trip Updates endpoint
app.get('/realtime/trip-updates', async (req, res) => {
  try {
    // Madison Metro's correct GTFS-Realtime Trip Updates URL
    // Based on standard naming conventions
    const response = await fetch(
      'https://transitdata.cityofmadison.com/TripUpdates.pb', 
      {
        headers: { 'User-Agent': 'Madison-Metro-Proxy/1.0' },
        timeout: 10000
      }
    );
    
    if (!response.ok) {
      // If the first URL fails, try common alternative URL patterns
      console.log(`First attempt failed with ${response.status}. Trying alternate URL...`);
      
      const alternateUrl = 'https://transitdata.cityofmadison.com/gtfs-rt/TripUpdates.pb';
      const altResponse = await fetch(alternateUrl, {
        headers: { 'User-Agent': 'Madison-Metro-Proxy/1.0' },
        timeout: 10000
      });
      
      if (!altResponse.ok) {
        // Try a third common pattern
        console.log(`Second attempt failed with ${altResponse.status}. Trying third URL...`);
        
        const thirdUrl = 'https://transitdata.cityofmadison.com/gtfsrt/TripUpdate/TripUpdate.pb';
        const thirdResponse = await fetch(thirdUrl, {
          headers: { 'User-Agent': 'Madison-Metro-Proxy/1.0' },
          timeout: 10000
        });
        
        if (!thirdResponse.ok) {
          throw new Error(`All Madison Metro trip updates URLs failed. Status codes: ${response.status}, ${altResponse.status}, ${thirdResponse.status}`);
        }
        
        const buffer = await thirdResponse.arrayBuffer();
        const feed = gtfs.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
        return res.json(feed);
      }
      
      const buffer = await altResponse.arrayBuffer();
      const feed = gtfs.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
      return res.json(feed);
    }
    
    const buffer = await response.arrayBuffer();
    const feed = gtfs.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
    res.json(feed);
  } catch (err) {
    console.error('Error fetching/parsing GTFS-Realtime trip updates:', err);
    res.status(404).json({
      error: 'Failed to retrieve data from Madison Metro API',
      status: 404,
      message: 'Not Found',
      details: err.message,
      suggestion: 'Madison Metro may have changed their GTFS-Realtime feed URLs or implemented access controls'
    });
  }
});

// GTFS-Realtime Vehicle Positions endpoint
app.get('/realtime/vehicle-positions', async (req, res) => {
  try {
    // Try standard naming conventions for Vehicle Positions
    const response = await fetch(
      'https://transitdata.cityofmadison.com/VehiclePositions.pb', 
      {
        headers: { 'User-Agent': 'Madison-Metro-Proxy/1.0' },
        timeout: 10000
      }
    );
    
    if (!response.ok) {
      // If the first URL fails, try common alternative URL patterns
      console.log(`First attempt failed with ${response.status}. Trying alternate URL...`);
      
      const alternateUrl = 'https://transitdata.cityofmadison.com/gtfs-rt/VehiclePositions.pb';
      const altResponse = await fetch(alternateUrl, {
        headers: { 'User-Agent': 'Madison-Metro-Proxy/1.0' },
        timeout: 10000
      });
      
      if (!altResponse.ok) {
        // Try a third common pattern
        console.log(`Second attempt failed with ${altResponse.status}. Trying third URL...`);
        
        const thirdUrl = 'https://transitdata.cityofmadison.com/gtfsrt/VehiclePosition/VehiclePosition.pb';
        const thirdResponse = await fetch(thirdUrl, {
          headers: { 'User-Agent': 'Madison-Metro-Proxy/1.0' },
          timeout: 10000
        });
        
        if (!thirdResponse.ok) {
          throw new Error(`All Madison Metro vehicle positions URLs failed. Status codes: ${response.status}, ${altResponse.status}, ${thirdResponse.status}`);
        }
        
        const buffer = await thirdResponse.arrayBuffer();
        const feed = gtfs.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
        return res.json(feed);
      }
      
      const buffer = await altResponse.arrayBuffer();
      const feed = gtfs.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
      return res.json(feed);
    }
    
    const buffer = await response.arrayBuffer();
    const feed = gtfs.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
    res.json(feed);
  } catch (err) {
    console.error('Error fetching/parsing GTFS-Realtime vehicle positions:', err);
    res.status(404).json({
      error: 'Failed to retrieve vehicle positions data',
      status: 404,
      message: 'Not Found',
      details: err.message
    });
  }
});

// GTFS-Realtime Service Alerts endpoint
app.get('/realtime/service-alerts', async (req, res) => {
  try {
    // Try standard naming conventions for Service Alerts
    const response = await fetch(
      'https://transitdata.cityofmadison.com/Alerts.pb', 
      {
        headers: { 'User-Agent': 'Madison-Metro-Proxy/1.0' },
        timeout: 10000
      }
    );
    
    if (!response.ok) {
      // If the first URL fails, try common alternative URL patterns
      console.log(`First attempt failed with ${response.status}. Trying alternate URL...`);
      
      const alternateUrl = 'https://transitdata.cityofmadison.com/gtfs-rt/Alerts.pb';
      const altResponse = await fetch(alternateUrl, {
        headers: { 'User-Agent': 'Madison-Metro-Proxy/1.0' },
        timeout: 10000
      });
      
      if (!altResponse.ok) {
        // Try a third common pattern
        console.log(`Second attempt failed with ${altResponse.status}. Trying third URL...`);
        
        const thirdUrl = 'https://transitdata.cityofmadison.com/gtfsrt/Alert/Alert.pb';
        const thirdResponse = await fetch(thirdUrl, {
          headers: { 'User-Agent': 'Madison-Metro-Proxy/1.0' },
          timeout: 10000
        });
        
        if (!thirdResponse.ok) {
          throw new Error(`All Madison Metro service alerts URLs failed. Status codes: ${response.status}, ${altResponse.status}, ${thirdResponse.status}`);
        }
        
        const buffer = await thirdResponse.arrayBuffer();
        const feed = gtfs.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
        return res.json(feed);
      }
      
      const buffer = await altResponse.arrayBuffer();
      const feed = gtfs.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
      return res.json(feed);
    }
    
    const buffer = await response.arrayBuffer();
    const feed = gtfs.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
    res.json(feed);
  } catch (err) {
    console.error('Error fetching/parsing GTFS-Realtime service alerts:', err);
    res.status(404).json({
      error: 'Failed to retrieve service alerts data',
      status: 404,
      message: 'Not Found',
      details: err.message
    });
  }
});

// URL discovery endpoint to check all possible Madison Metro GTFS-RT URLs
app.get('/discover-urls', async (req, res) => {
  const urlPatterns = [
    // Standard GTFS-RT URL patterns
    'https://transitdata.cityofmadison.com/TripUpdates.pb',
    'https://transitdata.cityofmadison.com/VehiclePositions.pb',
    'https://transitdata.cityofmadison.com/Alerts.pb',
    
    // Alternative with gtfs-rt prefix
    'https://transitdata.cityofmadison.com/gtfs-rt/TripUpdates.pb',
    'https://transitdata.cityofmadison.com/gtfs-rt/VehiclePositions.pb',
    'https://transitdata.cityofmadison.com/gtfs-rt/Alerts.pb',
    
    // Alternative patterns
    'https://transitdata.cityofmadison.com/gtfsrt/TripUpdate/TripUpdate.pb',
    'https://transitdata.cityofmadison.com/gtfsrt/VehiclePosition/VehiclePosition.pb',
    'https://transitdata.cityofmadison.com/gtfsrt/Alert/Alert.pb'
  ];
  
  const results = {};
  
  for (const url of urlPatterns) {
    try {
      console.log(`Checking URL: ${url}`);
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Madison-Metro-Proxy/1.0' },
        timeout: 5000
      });
      
      results[url] = {
        status: response.status,
        statusText: response.statusText,
        working: response.ok
      };
    } catch (err) {
      results[url] = {
        status: 'error',
        statusText: err.message,
        working: false
      };
    }
  }
  
  // Find working URLs for each feed type
  const workingUrls = {
    tripUpdates: Object.keys(results).filter(url => 
      results[url].working && url.toLowerCase().includes('tripupdate')),
    vehiclePositions: Object.keys(results).filter(url => 
      results[url].working && url.toLowerCase().includes('vehicleposition')),
    alerts: Object.keys(results).filter(url => 
      results[url].working && url.toLowerCase().includes('alert'))
  };
  
  res.json({
    message: 'URL discovery results',
    urlChecks: results,
    workingUrls: workingUrls,
    recommendedEndpoints: {
      tripUpdates: workingUrls.tripUpdates[0] || 'None found',
      vehiclePositions: workingUrls.vehiclePositions[0] || 'None found',
      alerts: workingUrls.alerts[0] || 'None found'
    }
  });
});

app.listen(PORT, () => {
  console.log(`Proxy API listening on port ${PORT}`);
});
