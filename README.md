# AWS Architecture Diagram Generator

A TypeScript Node.js application that creates AWS architecture diagrams using the maxGraph framework and exports them to draw.io compatible files.

## Features

- 📊 Generate AWS architecture diagrams programmatically
- 🏗️ Uses maxGraph (successor to mxGraph) for diagram creation
- 💾 Exports to draw.io compatible format
- 🎨 Styled AWS components with proper colors
- ⚡ Simple to run and extend

## Architecture

The sample diagram includes:

- **AWS API Gateway** - REST API endpoint
- **AWS Lambda** - Serverless function
- **DynamoDB** - NoSQL database

These components are connected with labeled arrows showing the data flow.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Build the application:**

   ```bash
   npm run build
   ```

3. **Run the diagram generator:**

   ```bash
   npm start
   ```

4. **Open the generated diagram:**
   - The application will create `aws-architecture.drawio`
   - Go to [draw.io](https://app.diagrams.net/)
   - File → Open → Select the generated file

## Output Files

- `aws-architecture.drawio` - draw.io compatible diagram file

## Customization

To modify the diagram, edit `src/index.ts`:

- **Add new components:** Define new `AWSComponent` objects
- **Change positions:** Modify the `x`, `y` coordinates
- **Update colors:** Change `fillColor` and `strokeColor` properties
- **Add connections:** Use `createConnection()` method

## Example Usage

```typescript
// Create a new AWS component
const s3Bucket: AWSComponent = {
  id: "s3",
  label: "S3 Bucket\\nStorage",
  x: 650,
  y: 100,
  width: 120,
  height: 80,
  fillColor: "#3F48CC",
  strokeColor: "#232F3E",
  shape: "rectangle",
};

// Add it to the diagram
const s3Vertex = this.createAWSComponent(s3Bucket);
this.createConnection(lambdaVertex, s3Vertex, "Store Files");
```

## Technologies Used

- [maxGraph](https://github.com/maxGraph/maxGraph) - Diagramming library
- TypeScript - Type-safe JavaScript
- Node.js - Runtime environment
- JSDOM - DOM implementation for Node.js

## AWS Colors Reference

- **Orange (`#FF9900`)** - Compute services (Lambda, EC2)
- **Blue (`#3F48CC`)** - Database services (DynamoDB, RDS)
- **Purple (`#9D5AAE`)** - Analytics services
- **Green (`#7AA116`)** - Storage services (S3)

## License

MIT License - Feel free to use and modify as needed.
