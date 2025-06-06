import * as aws from "@pulumi/aws";
import { albHostname } from "./ingress";
import { domain, subDomain } from "./config";

const hostedZone = aws.route53.getZoneOutput({ name: domain, privateZone: false });

export const dnsRecord = new aws.route53.Record("api-dns-record", {
  zoneId: hostedZone.zoneId,
  name: `${subDomain}.${domain}`,
  type: "CNAME",
  ttl: 300,
  records: [albHostname],
});
