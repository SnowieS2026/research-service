const fs = require('fs');
const path = require('path');

// The exported cookies
const cookies = [
    {
        "domain": "hackerone.com",
        "expirationDate": 1775667086.760072,
        "hostOnly": true,
        "httpOnly": true,
        "name": "__Host-session",
        "path": "/",
        "sameSite": "no_restriction",
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "NzJvOUNWWEdoeXdHRW80dW13VWRtbm5qa1VDbVVFOC82MU10UFFFZDNGaW5yMjZGSndQMVVGTnVoSWp5Z2Y3aW5vZkFmTHZxWTVUckJuV1d4UWdOZy9DOGk5bDhxZXNPbEdrMVN6dTJjWW1SN3JaVDVqU0pBMElWVldKN05sSTFBMXgrZXlHVkNRZ09LZ2VaVzJRWFYxL2RzSStxaFhLaUJKZUJ6NzFPcDRZVjFYYjYzdGhaNGhocnBIcDhmODJqbkFCdDNqNElyR1RDaXpaZkhEMG9TWC9PRGUrY25oNyttaGVSeW1GUkZOR3cxUmErZUlFd2NXRmZJbjhOc0UrYytsNG9TYlpnWUdZYitCblNxRTB5NHhXdllKU1NSVWVJbXN4dWhlT2c5a2M0OW13K2Y2dFVhZDhPaXpwUVBNblROZGdoK1BGQ1hUajZaaHU5MmVuZ1NmQURla0pGbmMvbUF4YlMxQ21BM0pBRWdWTHpCUmMvbEsrVmMrYm5BeG5MWldOZHdTcVdWMU9zU0ZGT1hHclNIVmlvZHBwOWhXclpZVVBDZ29sNHhFK0tHR0tTMjNhc2pMK25UWmxOWHdlUWxZM1krSjA2MFVnbkhUQ1VZVlpZOElUbzdYWDZBREM4QVlXZkFZOEMxY2JCUGptNU4zTEVQZGRMdEdqSG5iV2o1RXpXdnpjWEpEdStqeUdiazFMaTlXcjVQUm8rcjBDS1kwengzVVdoQ1B6dlpxaG8yQWJSdk9YU0JzT2p5bXl0UFQvVFVMZWlxajBMb0NiUlhrWTRDSGFvYnRvTmw4TDVodll6WlZWcENtTVhaN1FJT2RSMUN1MVhOMG9xZjFYQWlYRk5QMzlSbFpwOEl0TmJhVU10VmtZelYzdVRxQ2RmZCsvZDF6TnF4RTQ9LS1makJxMjNnMG5zZk5xVmJEeHhNTkVnPT0%3D--2070d24546711a9d18911171d2699b290f1aa0cc"
    },
    {
        "domain": ".hackerone.com",
        "expirationDate": 1774459235,
        "hostOnly": false,
        "httpOnly": false,
        "name": "TAsessionID",
        "path": "/",
        "sameSite": "lax",
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "3154bc54-902f-455f-8816-695df7cd1fb0|EXISTING"
    },
    {
        "domain": ".hackerone.com",
        "expirationDate": 1774459288,
        "hostOnly": false,
        "httpOnly": false,
        "name": "__stripe_sid",
        "path": "/",
        "sameSite": "strict",
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "75e0105b-fdb0-4463-9390-f393978a5591c5b038"
    },
    {
        "domain": ".hackerone.com",
        "expirationDate": 1775667080.85978,
        "hostOnly": false,
        "httpOnly": false,
        "name": "app_signed_in",
        "path": "/",
        "sameSite": "no_restriction",
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "true"
    },
    {
        "domain": ".hackerone.com",
        "expirationDate": 1805993488,
        "hostOnly": false,
        "httpOnly": false,
        "name": "__stripe_mid",
        "path": "/",
        "sameSite": "strict",
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "e6f812a9-5c9a-4b63-9e7a-b51057ea43ce30064e"
    },
    {
        "domain": ".hackerone.com",
        "expirationDate": 1789059788,
        "hostOnly": false,
        "httpOnly": false,
        "name": "cmapi_cookie_privacy",
        "path": "/",
        "sameSite": "lax",
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "permit 1 required"
    },
    {
        "domain": ".hackerone.com",
        "expirationDate": 1789059788,
        "hostOnly": false,
        "httpOnly": false,
        "name": "cmapi_gtm_bl",
        "path": "/",
        "sameSite": "lax",
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "ga-ms-ua-ta-asp-bzi-sp-awct-cts-csm-img-flc-fls-mpm-mpr-m6d-tc-tdc"
    },
    {
        "domain": "hackerone.com",
        "expirationDate": 1804973952.692996,
        "hostOnly": true,
        "httpOnly": true,
        "name": "h1_device_id",
        "path": "/",
        "sameSite": "no_restriction",
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "b95ccb50-fa4e-4f93-b09e-a5cd88501fd5"
    },
    {
        "domain": ".hackerone.com",
        "hostOnly": false,
        "httpOnly": false,
        "name": "notice_behavior",
        "path": "/",
        "sameSite": "lax",
        "secure": true,
        "session": true,
        "storeId": null,
        "value": "implied,eu"
    },
    {
        "domain": ".hackerone.com",
        "expirationDate": 1789059791,
        "hostOnly": false,
        "httpOnly": false,
        "name": "notice_gdpr_prefs",
        "path": "/",
        "sameSite": "lax",
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "0:"
    },
    {
        "domain": ".hackerone.com",
        "expirationDate": 1789059791,
        "hostOnly": false,
        "httpOnly": false,
        "name": "notice_preferences",
        "path": "/",
        "sameSite": "lax",
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "0:"
    },
    {
        "domain": ".hackerone.com",
        "expirationDate": 1789059791,
        "hostOnly": false,
        "httpOnly": false,
        "name": "TAconsentID",
        "path": "/",
        "sameSite": "lax",
        "secure": true,
        "session": false,
        "storeId": null,
        "value": "6f28d212-5ba0-4f5b-a27c-057d1249fa27"
    }
];

// Convert to Playwright storageState format
const storageState = {
  cookies: cookies.map(c => ({
    name: c.name,
    value: c.value,
    domain: c.domain,
    path: c.path,
    expires: c.expirationDate,
    httpOnly: c.httpOnly,
    secure: c.secure,
    sameSite: c.sameSite === 'no_restriction' ? 'None' : c.sameSite
  })),
  extensions: [],
  origins: []
};

const outPath = 'C:/Users/bryan/.openclaw/workspace/bounty-passive-pipeline/logs/browser-sessions/hackerone-state.json';
fs.writeFileSync(outPath, JSON.stringify(storageState, null, 2));
console.log('Saved to: ' + outPath);
console.log('Cookie count: ' + storageState.cookies.length);
