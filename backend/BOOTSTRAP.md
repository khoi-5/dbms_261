# Local backend bootstrap

This note covers configuration only; the existing design documents remain the
business implementation plan. No MongoDB connection is required by the website.

## Java and Maven

Use a 64-bit JDK 21 and run commands from `backend/`. `mvn -version` must report
Java 21; setting the project language version does not change Maven's JVM.
For the current PowerShell session, set `JAVA_HOME` to your JDK directory and
prepend its `bin` directory to `PATH`, then run:

```powershell
mvn clean compile
mvn test
mvn spring-boot:run
```

Do not lower `java.version` to work around a Java 17 installation.

## Environment configuration

Use `.env.example` as the template for the ignored `.env`. The application
imports it as Java properties relative to the working directory, not as shell
dotenv: no `export`, no surrounding quotes. System environment variables take
precedence. When launching from the workspace root, use an absolute external
configuration import or configure the IDE working directory as `backend/`.

Keep private JWT keys/passwords only in `.env` or system environment variables.
The sample JWT secret is intentionally invalid. Generate at least 32 random
bytes and Base64-encode them using the instructions in `.env.example`.

## SQL Server

Default: Windows Authentication on `localhost:1433`, using the Windows identity
that runs Java. Native authentication requires the Microsoft JDBC authentication
DLL matching the driver version and JVM architecture. The resolved driver at
audit time is `13.4.0.jre11`; for x64 use
`mssql-jdbc_auth-13.4.0.x64.dll` from Microsoft's matching JDBC distribution.
The `jre11` driver artifact can run on Java 21; it does not require Java 11.

Put the DLL directory on `PATH` before launching Java. Alternatively:

```powershell
mvn spring-boot:run '-Dspring-boot.run.jvmArguments=-Djava.library.path=C:/path/to/auth/x64'
```

The optional SQL Authentication URL and credential variables are documented in
`.env.example`; switching requires replacing the active URL and supplying a
dedicated SQL login. Native authentication does not require a SQL password.
`trustServerCertificate=true` is for local development only.

The website uses the existing `BKPEE_DB` on `localhost:1433`. Later implementation
checks confirmed this database and the product API returned 3,000 products.
Do not rerun schema/seed scripts to check connectivity or substitute an Indexing
benchmark database. The older bootstrap observations below are historical.

The application does not create a database, runs no SQL initialization scripts,
and uses `ddl-auto=validate`. It must not be treated as verification of the full
28-table schema while the entity classes remain design comments.

## Security and startup verification

JWT uses HS256, a Base64-decoded key of at least 32 bytes, issuer
`mini-ecommerce`, and positive expiration minutes. Token roles must be `BUYER`
or `SELLER`, without the `ROLE_` prefix; the converter adds that prefix.
Stateless bearer authentication is configured; CSRF is disabled for this mode.
Do not switch to cookie authentication without revisiting CSRF protection.

CORS defaults to `http://localhost:5173` and `http://127.0.0.1:5173` and can be
configured through `CORS_ALLOWED_ORIGINS`. It does not replace server-side
ownership checks when business endpoints are implemented.

`/api/health` is permitted by security, but no health controller currently
exists. Auth, products, categories and Buyer cart now have implementations;
see `../IMPLEMENTATION_F01_F08_F09_F10.md` for their contracts.
JWT configuration tests run without a database; a passing test is not proof of
a JDBC connection or a successful full application startup.

## Standard ports and read-only connection check

Run `mvn spring-boot:run` from `backend/` for http://localhost:8080. `SERVER_PORT`
defaults to 8080 and is set in the ignored `.env`; no CLI override is needed.
Run `npm run dev` from `frontend/` for http://localhost:5173. Vite uses strictPort
so it fails visibly if 5173 is occupied instead of moving to an unexpected origin.
Frontend `.env`/`.env.example` set `VITE_API_URL=http://localhost:8080/api`.
Restart Vite after changing VITE_* variables. OS environment variables take precedence.

Run `python scripts/check_connection.py` to check API/JSON/CORS/auth rejection
without writing SQL data. For port normalization, leave `RUN_SQL_INTEGRATION`
unset or false: that opt-in integration test creates QA accounts. The smoke and
demo provisioning scripts also write QA data and are not connection diagnostics.

## Historical verification recorded during initial bootstrap

- `mvn clean compile`: passed with temporary Microsoft JDK 21.0.13.0.2.
- `mvn test`: 7 tests passed (JWT, role authorization, and CORS); no database used.
- `mvn spring-boot:run`: failed because the JVM could not load
  `mssql-jdbc_auth-13.4.0.x64.dll`. The subsequent Hibernate dialect error is a
  consequence of the unavailable JDBC connection, not a reason to enable DDL.
- Windows Authentication through `sqlcmd` executed read-only metadata queries:
  localhost TCP 1433 works; `BKPEE_DB` is absent. Other databases were not used.
- The system's default Maven JVM was Java 17. The portable JDK used for checks
  does not change machine settings; configure a persistent JDK 21 for daily use.
