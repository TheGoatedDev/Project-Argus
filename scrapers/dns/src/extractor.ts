import type { MxRecord } from "node:dns";
import type {
    ExtractedDataPoint,
    ExtractedEdge,
    ExtractedEntity,
    ExtractionResult,
} from "@argus/types";

interface DnsResults {
    a?: string[];
    aaaa?: string[];
    mx?: MxRecord[];
    ns?: string[];
    txt?: string[][];
}

interface WhoisResult {
    registrantName?: string;
    registrantOrganization?: string;
    registrantEmail?: string;
    registrar?: string;
    creationDate?: string;
    expirationDate?: string;
    [key: string]: unknown;
}

export function extractFromDns(
    domain: string,
    dns: DnsResults,
    whois: WhoisResult | null,
    originalQuery?: string,
): ExtractionResult {
    const entities: ExtractedEntity[] = [];
    const edges: ExtractedEdge[] = [];
    const dataPoints: ExtractedDataPoint[] = [];
    const now = new Date();

    // If the original query was a subdomain, create it and link to root domain
    if (originalQuery && originalQuery !== domain) {
        entities.push({
            type: "domain",
            name: originalQuery,
            metadata: { subdomain: true, rootDomain: domain },
        });
        edges.push({
            sourceRef: originalQuery,
            targetRef: domain,
            sourceType: "domain",
            targetType: "domain",
            edgeType: "associated_with",
            confidence: 1.0,
        });
    }

    // Domain entity
    const domainMeta: Record<string, unknown> = {};
    if (whois) {
        if (whois.registrar) domainMeta.registrar = whois.registrar;
        if (whois.creationDate) domainMeta.createdDate = whois.creationDate;
        if (whois.expirationDate) domainMeta.expiryDate = whois.expirationDate;
    }
    entities.push({ type: "domain", name: domain, metadata: domainMeta });

    // Data point for the domain
    dataPoints.push({
        entityRef: domain,
        entityType: "domain",
        sourceProvider: "dns",
        sourceUrl: `dns://${domain}`,
        rawData: { dns, whois: whois ?? {} },
        fetchedAt: now,
    });

    // A records
    for (const ip of dns.a ?? []) {
        entities.push({ type: "ip", name: ip, metadata: { recordType: "A" } });
        edges.push({
            sourceRef: domain,
            targetRef: ip,
            sourceType: "domain",
            targetType: "ip",
            edgeType: "associated_with",
            confidence: 1.0,
        });
    }

    // AAAA records
    for (const ip of dns.aaaa ?? []) {
        entities.push({
            type: "ip",
            name: ip,
            metadata: { recordType: "AAAA" },
        });
        edges.push({
            sourceRef: domain,
            targetRef: ip,
            sourceType: "domain",
            targetType: "ip",
            edgeType: "associated_with",
            confidence: 1.0,
        });
    }

    // MX records
    for (const mx of dns.mx ?? []) {
        entities.push({
            type: "domain",
            name: mx.exchange,
            metadata: { priority: mx.priority, recordType: "MX" },
        });
        edges.push({
            sourceRef: domain,
            targetRef: mx.exchange,
            sourceType: "domain",
            targetType: "domain",
            edgeType: "associated_with",
            confidence: 1.0,
        });
    }

    // NS records
    for (const ns of dns.ns ?? []) {
        entities.push({
            type: "domain",
            name: ns,
            metadata: { recordType: "NS" },
        });
        edges.push({
            sourceRef: domain,
            targetRef: ns,
            sourceType: "domain",
            targetType: "domain",
            edgeType: "associated_with",
            confidence: 1.0,
        });
    }

    // WHOIS registrant
    if (whois) {
        const registrantName =
            whois.registrantName ?? whois.registrantOrganization;
        if (registrantName) {
            const registrantType = whois.registrantOrganization
                ? "org"
                : "person";
            entities.push({
                type: registrantType,
                name: registrantName,
                metadata: whois.registrantEmail
                    ? { registrantEmail: whois.registrantEmail }
                    : {},
            });
            edges.push({
                sourceRef: registrantName,
                targetRef: domain,
                sourceType: registrantType,
                targetType: "domain",
                edgeType: "owns",
                confidence: 0.8,
            });
        }

        if (whois.registrantEmail) {
            entities.push({ type: "email", name: whois.registrantEmail });
            edges.push({
                sourceRef: registrantName ?? domain,
                targetRef: whois.registrantEmail,
                sourceType: registrantName
                    ? whois.registrantOrganization
                        ? "org"
                        : "person"
                    : "domain",
                targetType: "email",
                edgeType: "owns",
                confidence: 0.7,
            });
        }
    }

    return { entities, edges, dataPoints };
}
