# Equipment Management App

Dit is een statische HTML/CSS/JavaScript app voor equipment management.

## Functies

- Overzichtspagina met equipment kaarten (bijv. camera, laptop)
- Per item: foto, status en locatie zichtbaar
- Klik op een item om naar een eigen product-URL te gaan (`product.html?id=...`)
- Op de productpagina kan je:
  - te reserveren
  - nu te lenen
  - terug te brengen
  - alleen locatie te updaten
- Bij lenen en reserveren vul je ook een naam in, zodat het overzicht toont wie het product heeft of reserveert
- Reserveringen gebruik je met een start- en einddatum via de datumvelden op de productpagina
- Locatie kiezen uit vaste locaties die je zelf toevoegt
- Data blijft bewaard in `localStorage`

## NFC koppelen

Elke productpagina heeft een unieke URL op basis van het ID, bijvoorbeeld:

- `https://jouwdomein.nl/product.html?id=abc123`

Die URL kan je direct op een NFC-tag programmeren.

## Synchronisatie tussen devices

De app ondersteunt nu realtime synchronisatie via Firebase Firestore.

Zodra cloud sync actief is:

- Nieuwe producten zijn zichtbaar op andere devices
- Statuswijzigingen (reserveren, lenen, terugbrengen) worden direct zichtbaar
- Locatiewijzigingen worden direct zichtbaar

### Firebase instellen

1. Maak een Firebase project aan op Firebase Console.
2. Voeg een Web App toe binnen dat project.
3. Activeer Firestore Database (start in test mode of met eigen rules).
4. Open `firebase-config.js`.
5. Vul alle waarden in met jouw Firebase config (`apiKey`, `authDomain`, `projectId`, etc.).
6. Host daarna de app (bijvoorbeeld GitHub Pages/Netlify/Vercel).

Als `firebase-config.js` niet is ingevuld, draait de app in lokale modus (alleen dit device).

## Bestanden

- `index.html`
- `styles.css`
- `app.js`

## Lokaal openen

Open `index.html` in je browser.

## Hosten

Omdat dit een statische site is, kan je eenvoudig hosten op:

- GitHub Pages
- Netlify
- Vercel

### Voorbeeld GitHub Pages

1. Maak een GitHub repository aan.
2. Upload deze bestanden.
3. Ga naar `Settings > Pages`.
4. Kies branch `main` en root map.
5. Sla op, daarna krijg je een publieke URL.
