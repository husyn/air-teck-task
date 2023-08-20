import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";

export class AirtekTaskStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const ecr_repo_app = new ecr.Repository(this, `infra-repo-app`,{
      repositoryName: 'infra-repo-app',
      lifecycleRules: [
        {
          maxImageCount: 2,
          description: 'lifecycle cleanup rule'
        }
      ]
    });

    const ecr_repo_web = new ecr.Repository(this, `infra-repo-web-node`,{
      repositoryName: 'infra-repo-web-node',
      lifecycleRules: [
        {
          maxImageCount: 2,
          description: 'lifecycle cleanup rule'
        }
      ]
    });

    const vpc = new ec2.Vpc(this, "airtek-vpc", {
      maxAzs: 3, // Default is all AZs in region      
      natGateways: 0
    });
    
    const cluster = new ecs.Cluster(this, "airteck-Cluster", {
      vpc: vpc
    });

    const service_app = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "AppService", {
      cluster: cluster, // Required
      cpu: 1024, // Default is 256
      desiredCount: 1, // Default is 1
      listenerPort: 80,
      taskImageOptions: { image: ecs.ContainerImage.fromEcrRepository(ecr_repo_app) },
      memoryLimitMiB: 2048, // Default is 512
      publicLoadBalancer: true, // Default is true      
      assignPublicIp: true
    });
    
    service_app.targetGroup.configureHealthCheck({
      path: "/WeatherForecast"      
    });

    new ecs_patterns.ApplicationLoadBalancedFargateService(this, "WebService", {
      cluster: cluster, // Required
      cpu: 512, // Default is 256
      desiredCount: 1, // Default is 1      
      taskImageOptions: { image: ecs.ContainerImage.fromEcrRepository(ecr_repo_web) },
      memoryLimitMiB: 2048, // Default is 512
      publicLoadBalancer: true,
      assignPublicIp: true 
    });
    
  }
}
