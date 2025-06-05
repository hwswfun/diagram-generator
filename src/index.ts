import { JSDOM } from "jsdom";
import { Editor, Cell } from "@maxgraph/core";
import * as fs from "fs";
import * as path from "path";

// Set up DOM environment for maxGraph
const dom = new JSDOM(
  '<!DOCTYPE html><html><body><div id="graphContainer"></div></body></html>'
);
global.window = dom.window as any;
global.document = dom.window.document;
Object.defineProperty(global, "navigator", {
  value: dom.window.navigator,
  writable: true,
});
global.HTMLElement = dom.window.HTMLElement;
global.Element = dom.window.Element;
global.XMLSerializer = dom.window.XMLSerializer;
global.DOMParser = dom.window.DOMParser;

interface AWSComponent {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  strokeColor: string;
  shape: string;
}

class AWSArchitectureDiagram {
  private editor: Editor;
  private parent: Cell;

  constructor() {
    // Create container element
    const container = document.getElementById("graphContainer")!;

    // Initialize editor
    this.editor = new Editor(container);
    this.editor.graph.setEnabled(false); // Disable editing for export

    // Get the default parent for inserting new cells
    this.parent = this.editor.graph.getDefaultParent();
  }

  private createAWSComponent(component: AWSComponent): Cell {
    return this.editor.graph.insertVertex({
      parent: this.parent,
      position: [component.x, component.y],
      size: [component.width, component.height],
      value: component.label,
      style: {
        fillColor: component.fillColor,
        strokeColor: component.strokeColor,
        shape: component.shape,
        fontSize: 12,
        fontColor: "#000000",
        verticalAlign: "middle",
        align: "center",
        rounded: true,
        strokeWidth: 2,
      },
    });
  }

  private createConnection(
    source: Cell,
    target: Cell,
    label: string = ""
  ): Cell {
    return this.editor.graph.insertEdge({
      parent: this.parent,
      source: source,
      target: target,
      value: label,
      style: {
        strokeColor: "#666666",
        strokeWidth: 2,
        edgeStyle: "orthogonalEdgeStyle",
        rounded: true,
        endArrow: "classic",
        endSize: 8,
      },
    });
  }

  public createDiagram(): void {
    this.editor.graph.batchUpdate(() => {
      // Define AWS components
      const apiGateway: AWSComponent = {
        id: "api-gateway",
        label: "API Gateway\\nREST API",
        x: 50,
        y: 100,
        width: 120,
        height: 80,
        fillColor: "#FF9900",
        strokeColor: "#FF6600",
        shape: "rectangle",
      };

      const lambda: AWSComponent = {
        id: "lambda",
        label: "more fun AWS Lambda\\nFunction",
        x: 250,
        y: 100,
        width: 120,
        height: 80,
        fillColor: "#FF9900",
        strokeColor: "#FF6600",
        shape: "rectangle",
      };

      const dynamodb: AWSComponent = {
        id: "dynamodb",
        label: "DynamoDB\\nTable",
        x: 450,
        y: 100,
        width: 120,
        height: 80,
        fillColor: "#3F48CC",
        strokeColor: "#232F3E",
        shape: "rectangle",
      };

      // Create vertices
      const apiGatewayVertex = this.createAWSComponent(apiGateway);
      const lambdaVertex = this.createAWSComponent(lambda);
      const dynamodbVertex = this.createAWSComponent(dynamodb);

      // Create connections
      this.createConnection(apiGatewayVertex, lambdaVertex, "HTTP Request");
      this.createConnection(lambdaVertex, dynamodbVertex, "Query/Put");

      // Add title
      this.editor.graph.insertVertex({
        parent: this.parent,
        position: [200, 20],
        size: [200, 30],
        value: "AWS Serverless Architecture",
        style: {
          fillColor: "transparent",
          strokeColor: "transparent",
          fontSize: 16,
          fontStyle: 1, // 1 for bold
          fontColor: "#232F3E",
          align: "center",
        },
      });
    });
  }

  private convertMaxGraphToDrawIO(maxGraphXml: string): string {
    let converted = maxGraphXml;

    // Convert element names
    converted = converted.replace(/<Cell/g, "<mxCell");
    converted = converted.replace(/<\/Cell>/g, "</mxCell>");
    converted = converted.replace(/<Geometry/g, "<mxGeometry");
    converted = converted.replace(/<\/Geometry>/g, "</mxGeometry>");

    // Convert geometry attributes (remove underscores)
    converted = converted.replace(/_x="/g, 'x="');
    converted = converted.replace(/_y="/g, 'y="');
    converted = converted.replace(/_width="/g, 'width="');
    converted = converted.replace(/_height="/g, 'height="');

    // Convert style Object elements to style attributes and properly position them
    converted = converted.replace(
      /<mxCell([^>]*?)><mxGeometry([^>]*?)\/><Object ([^>]*?)as="style"[^>]*?\/><\/mxCell>/g,
      (match, cellAttrs, geomAttrs, styleAttrs) => {
        const attrs = styleAttrs.match(/(\w+)="([^"]*?)"/g) || [];
        const styles = attrs
          .filter((attr: string) => !attr.startsWith("as="))
          .map((attr: string) => attr.replace(/="([^"]*)"/, "=$1"))
          .join(";");

        const styleAttr = styles ? ` style="${styles};"` : "";

        return `<mxCell${cellAttrs}${styleAttr}><mxGeometry${geomAttrs}/></mxCell>`;
      }
    );

    // Remove wrapper
    return converted
      .replace("<GraphDataModel>", "")
      .replace("</GraphDataModel>", "");
  }

  public exportToDrawIO(filename: string = "aws-architecture.drawio"): void {
    try {
      // Get the actual graph model XML using Editor's writeGraphModel method
      const graphModelXml = this.editor.writeGraphModel();

      // Convert maxGraph format to draw.io format
      const convertedXml = this.convertMaxGraphToDrawIO(graphModelXml);

      // Create draw.io compatible XML structure - format like the working sample
      const xmlContent = `<mxfile host="maxgraph-aws-diagram" modified="${new Date().toISOString()}" agent="maxGraph AWS Diagram Generator" version="1.0.0" etag="${Math.random()
        .toString(36)
        .substring(7)}" type="device">
  <diagram id="aws-architecture" name="AWS Architecture">
    <mxGraphModel dx="800" dy="600" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      ${convertedXml}
    </mxGraphModel>
  </diagram>
</mxfile>`;

      // Write to file
      const outputPath = path.join(process.cwd(), filename);
      fs.writeFileSync(outputPath, xmlContent, "utf8");

      console.log(
        `✅ AWS Architecture diagram exported successfully to: ${outputPath}`
      );
      console.log(
        `📁 You can now open this file in draw.io or any compatible application`
      );
    } catch (error) {
      console.error("❌ Error exporting diagram:", error);
      throw error;
    }
  }

  public getGraphInfo(): string {
    return `Graph created successfully with AWS components using maxGraph Editor`;
  }
}

// Main execution
async function main(): Promise<void> {
  try {
    console.log("🚀 Starting AWS Architecture Diagram Generation...");

    // Create diagram instance
    const diagram = new AWSArchitectureDiagram();

    // Create the diagram
    console.log("📊 Creating AWS architecture diagram...");
    diagram.createDiagram();

    // Export to drawio format
    console.log("💾 Exporting to draw.io format...");
    diagram.exportToDrawIO("aws-architecture.drawio");

    console.log("🎉 Diagram generation completed successfully!");
    console.log("");
    console.log("Files created:");
    console.log("  - aws-architecture.drawio (draw.io compatible)");
    console.log("");
    console.log("To view the diagram:");
    console.log("  1. Open https://app.diagrams.net/ (draw.io)");
    console.log("  2. File → Open → Select aws-architecture.drawio");
  } catch (error) {
    console.error("❌ Error generating diagram:", error);
    process.exit(1);
  }
}

// Run the application
if (require.main === module) {
  main().catch(console.error);
}
