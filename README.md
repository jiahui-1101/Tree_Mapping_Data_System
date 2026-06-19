# Tree Mapping Data System

A modular React prototype for managing tree records and field operations at
Taman Botani Johor. The application combines tree health monitoring, ranger
workflows, visitor experiences, spatial mapping, QR interactions, and IT
support operations in one role-based interface.

## Technology

- React 19
- Vite 7
- Three.js for the interactive garden scene
- QRCode for printable tree labels
- Node's built-in test runner

## Getting started

Requirements: Node.js 20 or newer and npm.

```bash
git clone https://github.com/jiahui-1101/Tree_Mapping_Data_System.git
cd Tree_Mapping_Data_System
npm install
npm run dev
```

Vite prints the local development address in the terminal. Open that address
in a modern browser.

## Available commands

```bash
npm run dev      # start the development server
npm run build    # create a production build
npm run preview  # preview the production build
npm test         # run service and integration tests
```

## Source layout

```text
src/
  components/    shared layout, QR, map, and UI components
  config/        navigation, roles, and demo account configuration
  data/          prototype records and fixtures
  features/      role and subsystem pages
  services/      filtering, state, and workflow helpers
  styles/        shared and subsystem-specific styles
test/            Node integration and service tests
```
