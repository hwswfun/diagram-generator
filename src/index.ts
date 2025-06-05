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

// Predefined AWS shapes with their mxgraph mappings
export enum AWSShape {
  RECTANGLE = "RECTANGLE",
  AWS_API_GATEWAY = "AWS_API_GATEWAY",
  AWS_LAMBDA = "AWS_LAMBDA",
  AWS_DYNAMODB = "AWS_DYNAMODB",
  AWS_S3 = "AWS_S3",
  AWS_EC2 = "AWS_EC2",
  AWS_RDS = "AWS_RDS",
  AWS_CLOUDFRONT = "AWS_CLOUDFRONT",
  AWS_ALB = "AWS_ALB",
  AWS_VPC = "AWS_VPC",
}

// Mapping of AWS shapes to their mxgraph shape names and default styles
const AWS_SHAPE_CONFIG: Record<
  AWSShape,
  {
    shape: string;
    additionalStyles: Record<string, any>;
  }
> = {
  [AWSShape.RECTANGLE]: {
    shape: "rectangle",
    additionalStyles: {},
  },
  [AWSShape.AWS_API_GATEWAY]: {
    shape: "mxgraph.aws3.api_gateway",
    additionalStyles: {
      outlineConnect: 0,
      dashed: 0,
      verticalLabelPosition: "bottom",
      verticalAlign: "top",
    },
  },
  [AWSShape.AWS_LAMBDA]: {
    shape: "mxgraph.aws3.lambda_function",
    additionalStyles: {
      outlineConnect: 0,
      dashed: 0,
      verticalLabelPosition: "bottom",
      verticalAlign: "top",
    },
  },
  [AWSShape.AWS_DYNAMODB]: {
    shape: "mxgraph.aws3.dynamo_db",
    additionalStyles: {
      outlineConnect: 0,
      dashed: 0,
      verticalLabelPosition: "bottom",
      verticalAlign: "top",
    },
  },
  [AWSShape.AWS_S3]: {
    shape: "mxgraph.aws3.s3",
    additionalStyles: {
      outlineConnect: 0,
      dashed: 0,
      verticalLabelPosition: "bottom",
      verticalAlign: "top",
    },
  },
  [AWSShape.AWS_EC2]: {
    shape: "mxgraph.aws3.ec2",
    additionalStyles: {
      outlineConnect: 0,
      dashed: 0,
      verticalLabelPosition: "bottom",
      verticalAlign: "top",
    },
  },
  [AWSShape.AWS_RDS]: {
    shape: "mxgraph.aws3.rds",
    additionalStyles: {
      outlineConnect: 0,
      dashed: 0,
      verticalLabelPosition: "bottom",
      verticalAlign: "top",
    },
  },
  [AWSShape.AWS_CLOUDFRONT]: {
    shape: "mxgraph.aws3.cloudfront",
    additionalStyles: {
      outlineConnect: 0,
      dashed: 0,
      verticalLabelPosition: "bottom",
      verticalAlign: "top",
    },
  },
  [AWSShape.AWS_ALB]: {
    shape: "mxgraph.aws3.application_load_balancer",
    additionalStyles: {
      outlineConnect: 0,
      dashed: 0,
      verticalLabelPosition: "bottom",
      verticalAlign: "top",
    },
  },
  [AWSShape.AWS_VPC]: {
    shape: "mxgraph.aws3.virtual_private_cloud",
    additionalStyles: {
      outlineConnect: 0,
      dashed: 0,
      verticalLabelPosition: "bottom",
      verticalAlign: "top",
    },
  },
};

interface AWSComponent {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  strokeColor: string;
  shape: AWSShape;
  gradientColor?: string;
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

  /**
   * Helper function to create AWS components with predefined shape styling
   * @param config Basic component configuration
   * @param shape AWS shape to use (defaults to RECTANGLE)
   * @param gradientColor Optional gradient color for AWS shapes
   * @returns AWSComponent with proper shape configuration
   */
  public static createAWSComponentConfig(
    config: {
      id: string;
      label: string;
      x: number;
      y: number;
      width: number;
      height: number;
      fillColor: string;
      strokeColor: string;
    },
    shape: AWSShape = AWSShape.RECTANGLE,
    gradientColor?: string
  ): AWSComponent {
    return {
      ...config,
      shape,
      gradientColor,
    };
  }

  /**
   * Get available AWS shapes and their descriptions
   * @returns Object mapping shape names to descriptions
   */
  public static getAvailableShapes(): Record<string, string> {
    return {
      [AWSShape.RECTANGLE]: "Basic rectangle shape",
      [AWSShape.AWS_API_GATEWAY]: "AWS API Gateway icon",
      [AWSShape.AWS_LAMBDA]: "AWS Lambda function icon",
      [AWSShape.AWS_DYNAMODB]: "AWS DynamoDB table icon",
      [AWSShape.AWS_S3]: "AWS S3 bucket icon",
      [AWSShape.AWS_EC2]: "AWS EC2 instance icon",
      [AWSShape.AWS_RDS]: "AWS RDS database icon",
      [AWSShape.AWS_CLOUDFRONT]: "AWS CloudFront distribution icon",
      [AWSShape.AWS_ALB]: "AWS Application Load Balancer icon",
      [AWSShape.AWS_VPC]: "AWS Virtual Private Cloud icon",
    };
  }

  private createAWSComponent(component: AWSComponent): Cell {
    // Convert \n to HTML line breaks for draw.io compatibility
    const drawioLabel = component.label.replace(/\\n/g, "<br>");

    // Get shape configuration
    const shapeConfig = AWS_SHAPE_CONFIG[component.shape];

    // Build base styles
    const baseStyles: Record<string, any> = {
      whiteSpace: "wrap",
      fillColor: component.fillColor,
      strokeColor: component.strokeColor,
      fontSize: 12,
      html: 1, // Required for HTML rendering in draw.io
      align: "center",
      ...shapeConfig.additionalStyles,
    };

    // Add shape-specific styling
    if (component.shape === AWSShape.RECTANGLE) {
      baseStyles.rounded = true;
    } else {
      // AWS shapes use the specific shape property
      baseStyles.shape = shapeConfig.shape;
    }

    // Add gradient color if specified
    if (component.gradientColor) {
      baseStyles.gradientColor = component.gradientColor;
    }

    return this.editor.graph.insertVertex({
      parent: this.parent,
      position: [component.x, component.y],
      size: [component.width, component.height],
      value: drawioLabel,
      style: baseStyles,
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
      // Define AWS components using specific AWS shapes and colors
      const apiGateway: AWSComponent = {
        id: "api-gateway",
        label: "API Gateway\\nREST API",
        x: 50,
        y: 100,
        width: 120,
        height: 80,
        fillColor: "#D9A741",
        strokeColor: "#B8860B",
        shape: AWSShape.AWS_API_GATEWAY,
        gradientColor: "none",
      };

      const lambda: AWSComponent = {
        id: "lambda",
        label: "AWS Lambda\\nFunction",
        x: 250,
        y: 100,
        width: 120,
        height: 80,
        fillColor: "#FF9900",
        strokeColor: "#FF6600",
        shape: AWSShape.AWS_LAMBDA,
        gradientColor: "none",
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
        shape: AWSShape.AWS_DYNAMODB,
        gradientColor: "none",
      };

      // Create a second API Gateway to demonstrate the traditional rectangle shape
      const apiGatewayRect: AWSComponent = {
        id: "api-gateway-rect",
        label: "Traditional\\nRectangle",
        x: 50,
        y: 220,
        width: 120,
        height: 80,
        fillColor: "#E8F4FD",
        strokeColor: "#1F77B4",
        shape: AWSShape.RECTANGLE,
      };

      // Create vertices
      const apiGatewayVertex = this.createAWSComponent(apiGateway);
      const lambdaVertex = this.createAWSComponent(lambda);
      const dynamodbVertex = this.createAWSComponent(dynamodb);
      const apiGatewayRectVertex = this.createAWSComponent(apiGatewayRect);

      // Create connections
      this.createConnection(apiGatewayVertex, lambdaVertex, "HTTP Request");
      this.createConnection(lambdaVertex, dynamodbVertex, "Query/Put");
      this.createConnection(
        apiGatewayRectVertex,
        lambdaVertex,
        "Alternative Route"
      );

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

    // Display available AWS shapes
    console.log("\n📋 Available AWS Shapes:");
    const availableShapes = AWSArchitectureDiagram.getAvailableShapes();
    Object.entries(availableShapes).forEach(([shape, description]) => {
      console.log(`  - ${shape}: ${description}`);
    });

    // Create diagram instance
    const diagram = new AWSArchitectureDiagram();

    // Create the diagram
    console.log("\n📊 Creating AWS architecture diagram...");
    diagram.createDiagram();

    // Export to drawio format
    console.log("💾 Exporting to draw.io format...");
    diagram.exportToDrawIO("aws-architecture.drawio");

    console.log("\n🎉 Diagram generation completed successfully!");
    console.log("");
    console.log("Files created:");
    console.log("  - aws-architecture.drawio (draw.io compatible)");
    console.log("");
    console.log("📖 Usage Examples:");
    console.log("  // Create component with AWS API Gateway shape:");
    console.log(
      "  const apiGateway = AWSArchitectureDiagram.createAWSComponentConfig({"
    );
    console.log("    id: 'my-api',");
    console.log("    label: 'My API Gateway',");
    console.log("    x: 100, y: 100, width: 120, height: 80,");
    console.log("    fillColor: '#D9A741', strokeColor: '#B8860B'");
    console.log("  }, AWSShape.AWS_API_GATEWAY, 'none');");
    console.log("");
    console.log("  // Create component with AWS Lambda shape:");
    console.log(
      "  const lambda = AWSArchitectureDiagram.createAWSComponentConfig({"
    );
    console.log("    id: 'my-lambda',");
    console.log("    label: 'My Lambda Function',");
    console.log("    x: 300, y: 100, width: 120, height: 80,");
    console.log("    fillColor: '#FF9900', strokeColor: '#FF6600'");
    console.log("  }, AWSShape.AWS_LAMBDA);");
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
