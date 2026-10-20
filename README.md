# Crave web

React + Vite front end for the Spring Boot `FoodDeliveryApp` API.

## Run

```bash
npm install
npm run dev
```

1. Start the Spring Boot app first (port 8080, MySQL running). On an empty database it loads 7 starter restaurants with photos and menus.
2. Make sure `.env` has `VITE_USE_MOCK=false`. With `true` nothing is saved to the database.
3. Put your Google Maps key in `VITE_GOOGLE_MAPS_KEY` (see below), then **restart** `npm run dev`.

## Google Maps setup

In Google Cloud Console, create an API key and enable **Maps JavaScript API** and **Geocoding API**
(billing must be on; Google gives a monthly free credit). Restrict the key to `http://localhost:5173/*`.
Each restaurant's position comes from the backend (`latitude` / `longitude` columns in the `restaurants` table).

## How live tracking works

- Checkout: the customer drops a pin; the address is filled in with the Geocoding API and the
  coordinates are saved on the order.
- Delivery partner: signs in with the ADMIN account, opens **Orders desk**, sets the order to
  *Out for delivery* and taps **Share my live location**. The phone's GPS is sent to
  `PUT /api/admin/orders/{id}/location` every 5 seconds.
- Customer: the tracking page polls `GET /api/orders/{id}` every 4 seconds and moves the rider on the map.

Phone GPS needs HTTPS (or localhost). To test on a phone, deploy the site or use a tunnel such as ngrok.

## Demo mode

`VITE_USE_MOCK=true` runs with built-in data. Demo admin login: `admin@crave.com` / `admin`.
