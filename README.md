#  Simple Buy

## 🚀 Motivation

**Simple Buy** is an experimental project aimed at exploring various API architectural styles within a unified application. Also using this  as a sandbox to assess the capabilities of [Bun](https://bun.sh/) and determine its viability as a replacement for Node.js in my Backend Development era.

##  API Architectural Styles Employed

This project integrates multiple API paradigms, each selected for its strengths in specific scenarios:

* **REST**: Handles primary CRUD operations for resources.
* **GraphQL**: Will use this for complex queries like fetching dashboards/analytics data.
* **WebSockets**: For real-time notifications and bidirectional communication between client and server.
* **SOAP**: For legacy payment gateways that require XML-based messaging protocols (none in mind yet).
* **gRPC**: Might split this project into micros-services and this will be used to trigger events between services.
* **Webhooks**: To allow external services receive real time data.
* **Server-Sent Events (SSE)**: Not Decided

## 🛠️ Getting Started

### Prerequisites

* Ensure you have [Bun](https://bun.sh/) installed.

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/zufichris/simple-buy.git
   cd simple-buy
   ```



2. **Install dependencies:**

   ```bash
   bun install
   ```



### Running the Development Server

Start the development server with:

```bash
bun run dev
```



The application will be accessible at `http://localhost:3000`.

---

## 🛠️ Tools Breakdown

- **Language:** JavaScript / TypeScript
- **Runtime:** [Bun](https://bun.sh/)
- **API Framework:** [Elysia](https://elysiajs.com/)
- **API Documentation:** [Swagger](https://swagger.io/), [Postman](https://www.postman.com/)
- **Database:** PostgreSQL
- **Testing Framework:** Vitest, Supertest
- **Authentication & Security:** JWT, Helmet
- **Deployment/DevOps:** Docker, GitHub Actions
<!-- - **Code Linting & Formatting:** ESLint, Prettier -->

##  Additional Resources

For more information on the API architectural styles utilized in this project, consider exploring the following resources:

* [Exploring API Architectural Styles: A Dive into SOAP, REST, GraphQL, gRPC, WebSocket, and Webhook](https://medium.com/@siddhantprateek/exploring-api-architectural-styles-a-dive-into-soap-rest-graphql-grpc-websocket-and-webhook-de740700e68d)
* [Top 6 Most Popular API Architecture Styles You Need to Know](https://dev.to/kanani_nirav/top-6-most-popular-api-architecture-styles-you-need-to-know-with-pros-cons-and-use-cases-564j)
* [The System Design Cheat Sheet: API Styles - REST, GraphQL, WebSocket, Webhook, RPC/gRPC, SOAP](https://hackernoon.com/the-system-design-cheat-sheet-api-styles-rest-graphql-websocket-webhook-rpcgrpc-soap)
