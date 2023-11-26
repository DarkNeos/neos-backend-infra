import * as cdk from "aws-cdk-lib";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import { type Construct } from "constructs";

export class NeosBackendInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Look up the default VPC
    const vpc = ec2.Vpc.fromLookup(this, "VPC", {
      isDefault: true,
    });

    const _repository = new ecr.Repository(this, "NeosBackend", {
      repositoryName: "neos-backend-cdkecsinfrastack",
    });

    const taskIamRole = new cdk.aws_iam.Role(this, "NeosBackendInfra", {
      roleName: "neos-backend-infra",
      assumedBy: new cdk.aws_iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    taskIamRole.addManagedPolicy(
      cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AmazonECSTaskExecutionRolePolicy",
      ),
    );

    const taskDefinition = new ecs.FargateTaskDefinition(this, "Task", {
      taskRole: taskIamRole,
      family: "CdkEcsInfraStackTaskDef",
    });

    taskDefinition.addContainer("NeosBackend", {
      image: ecs.ContainerImage.fromRegistry("nginx:latest"),
      portMappings: [{ containerPort: 80 }],
      memoryReservationMiB: 256,
      cpu: 256,
    });

    new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      "NeosBackendLoadBalance",
      {
        vpc,
        taskDefinition,
        desiredCount: 1,
        serviceName: "Neos",
        assignPublicIp: true,
        publicLoadBalancer: true,
        healthCheckGracePeriod: cdk.Duration.seconds(5),
      },
    );
  }
}
