# BKPEE frontend

React + Vite + JavaScript. Run from `E:\dbms\frontend`:

```powershell
npm ci
npm run dev
```

Open http://localhost:5173/products. Vite pins localhost:5173 with `strictPort`:
if another process owns that port, it reports an error instead of silently
moving to 5174 and breaking the expected CORS origin.

Backend: from `E:\dbms\backend`, run `mvn spring-boot:run` for
http://localhost:8080. SQL Server remains localhost:1433, database BKPEE_DB.

The ignored frontend `.env` and tracked `.env.example` use:

```dotenv
VITE_API_URL=http://localhost:8080/api
```

On a new checkout, copy `.env.example` to `.env` if needed; the API client also
defaults to this URL. `VITE_*` values are public, never credentials. Restart Vite
after changing `.env`. A process-level `VITE_API_URL` overrides the file: remove
an old override with `Remove-Item Env:VITE_API_URL -ErrorAction SilentlyContinue`
in the terminal before starting Vite. Backend `SERVER_PORT` similarly defaults
to 8080 and may be overridden by process environment or CLI arguments.

If products show `Failed to fetch`, confirm the backend is running on 8080,
the served API module uses that URL, and CORS permits http://localhost:5173.
A backend running only on another port cannot answer requests sent to 8080.
An expired token normally causes HTTP 401, not a network `Failed to fetch`.
Guest requests without a stored token have no Authorization header.

Checks that do not write SQL data:

```powershell
node --test src/services/api.test.js src/config/catalog.test.js
npm run build
cd ..\backend
python scripts/check_connection.py
```

Catalog pagination defaults to 12 items, with a maximum of 48. Frontend overrides
`VITE_CATALOG_PAGE_SIZE` and `VITE_CATALOG_MAX_PAGE_SIZE` are defined in
[catalog configuration](src/config/catalog.js); backend overrides
`CATALOG_DEFAULT_PAGE_SIZE` and `CATALOG_MAX_PAGE_SIZE` are defined in
[application configuration](../backend/src/main/resources/application.yml).
Keep the frontend and backend limits compatible. See the current
[catalog API](../backend/src/main/java/com/bkpee/buyer/CatalogApi.java),
[cart API](../backend/src/main/java/com/bkpee/buyer/CartApi.java),
[profile API](../backend/src/main/java/com/bkpee/auth/BuyerProfileApi.java), and
[catalog tests](src/config/catalog.test.js) for their contracts and validation.
SQL write integration tests require a separate `BKPEE_TEST_` database; see
[BuyerSqlIntegrationTest](../backend/src/test/java/com/bkpee/integration/BuyerSqlIntegrationTest.java).
The smoke/demo scripts and opt-in SQL integration tests create QA records;
do not run those as a read-only connection diagnostic.
