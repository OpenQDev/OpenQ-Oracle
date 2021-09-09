# OpenQ API

This is the API middleware between the OpenQ frontend and the OpenQ backend.

## Stack
Package Manger: yarn
Containerization: Docker
Orchestration (Development): Docker Compose
Orchestration (Production): Kubernetes
CI/CD: CircleCI
Server: Node + Express

## Getting Started

### Environment Variables

`RPC_NODE`
The Ethereum RPC node to connect to. Defaults to `http://127.0.0.1:8545`

`OPENQ_ADDRESS`
Address of deployed `OpenQ` contract.

`WALLET_KEY`
OpenQ owner address which was used to deploy the OpenQ smart contract on whichever network you are connected to via `RPC_NODE`
This is necessary to call `onlyOwner` functions like withdraw.

### Starting OpenQAPI
Once you have the above environment variables configured to your needs, run:

```bash
docker compose up
```

### Stopping OpenQAPI

#### In the same terminal
```bash
Control + C
```
#### From a different terminal
```bash
docker compose down
```