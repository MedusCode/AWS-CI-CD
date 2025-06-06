import * as aws from "@pulumi/aws";
import { alb } from "./alb";
import { domain, subDomain } from "./config";

// Get the Route53 zone
const zone = aws.route53.getZone({
  name: domain,
  privateZone: false,
});

// Create a DNS record pointing to the ALB
const dnsRecord = new aws.route53.Record("frontend-alias-record", {
  name: `${subDomain}.${domain}`,
  type: "A",
  zoneId: zone.then(z => z.zoneId),
  aliases: [{
    name: alb.dnsName,
    zoneId: alb.zoneId,
    evaluateTargetHealth: true,
  }],
});

// Optional export for index.ts
export const frontendUrl = alb.dnsName;
export const dnsRecordName = dnsRecord.name;
