# WarEra tRPC Client
This package provides a frontend + backend compatible tRPC communication layer.

## Install
```bash
npm install
```

## Generate OpenAPI Types
```bash
npm run openapi
```

## Usage
```ts
import { createTrpcClient } from "warera-trpc-client";

const client = createTrpcClient({
	url: "https://api2.warera.io/trpc",
	apiKey: "YOUR_API_KEY",
});
```

## Important
The API does not provide return types, thus the return types needs to be created manually, and added as a type.
Do not change the `warera-openapi.d.ts` as it will be overwritten when `npm run openapi` is executed.
Currently the tests folder is being used to create the types manually.
