import dns from "node:dns/promises";
import { describe, expect, it, vi } from "vitest";
import { extractFromDns } from "../src/extractor.js";
import { getRootDomain } from "../src/index.js";

describe("extractFromDns", () => {
    it("extracts entities and edges from DNS records", () => {
        const result = extractFromDns(
            "example.com",
            {
                a: ["93.184.216.34"],
                aaaa: ["2606:2800:220:1:248:1893:25c8:1946"],
                mx: [{ exchange: "mail.example.com", priority: 10 }],
                ns: ["ns1.example.com"],
                txt: [["v=spf1 include:example.com ~all"]],
            },
            {
                registrantName: "Example Inc",
                registrantOrganization: "Example Inc",
                registrantEmail: "admin@example.com",
                registrar: "Example Registrar",
                creationDate: "1995-08-14",
                expirationDate: "2025-08-13",
            },
        );

        // Domain entity
        const domainEntity = result.entities.find(
            (e) => e.type === "domain" && e.name === "example.com",
        );
        expect(domainEntity).toBeDefined();
        expect(domainEntity!.metadata?.registrar).toBe("Example Registrar");

        // IP entity from A record
        const ipEntity = result.entities.find(
            (e) => e.type === "ip" && e.name === "93.184.216.34",
        );
        expect(ipEntity).toBeDefined();

        // MX domain entity
        const mxEntity = result.entities.find(
            (e) => e.type === "domain" && e.name === "mail.example.com",
        );
        expect(mxEntity).toBeDefined();

        // NS domain entity
        const nsEntity = result.entities.find(
            (e) => e.type === "domain" && e.name === "ns1.example.com",
        );
        expect(nsEntity).toBeDefined();

        // Registrant org entity
        const orgEntity = result.entities.find(
            (e) => e.type === "org" && e.name === "Example Inc",
        );
        expect(orgEntity).toBeDefined();

        // Registrant email entity
        const emailEntity = result.entities.find(
            (e) => e.type === "email" && e.name === "admin@example.com",
        );
        expect(emailEntity).toBeDefined();

        // Edges
        expect(result.edges.length).toBeGreaterThanOrEqual(5);

        // Domain -> IP edge
        const domainIpEdge = result.edges.find(
            (e) =>
                e.sourceRef === "example.com" &&
                e.targetRef === "93.184.216.34",
        );
        expect(domainIpEdge).toBeDefined();
        expect(domainIpEdge!.edgeType).toBe("associated_with");

        // Org -> Domain edge
        const orgDomainEdge = result.edges.find(
            (e) =>
                e.sourceRef === "Example Inc" && e.targetRef === "example.com",
        );
        expect(orgDomainEdge).toBeDefined();
        expect(orgDomainEdge!.edgeType).toBe("owns");

        // Data points
        expect(result.dataPoints.length).toBe(1);
        expect(result.dataPoints[0]!.sourceProvider).toBe("dns");
    });

    it("handles missing DNS records gracefully", () => {
        const result = extractFromDns("example.com", {}, null);
        expect(result.entities.length).toBe(1); // just the domain
        expect(result.edges.length).toBe(0);
        expect(result.dataPoints.length).toBe(1);
    });

    it("links subdomain to root domain when originalQuery differs", () => {
        const result = extractFromDns(
            "migadu.com",
            { a: ["91.121.223.63"] },
            null,
            "aspmx2.migadu.com",
        );

        // Should have subdomain entity + root domain + IP = 3
        expect(result.entities.length).toBe(3);

        const subdomain = result.entities.find(
            (e) => e.name === "aspmx2.migadu.com",
        );
        expect(subdomain).toBeDefined();
        expect(subdomain!.metadata?.rootDomain).toBe("migadu.com");

        const rootDomain = result.entities.find((e) => e.name === "migadu.com");
        expect(rootDomain).toBeDefined();

        // Subdomain -> root domain edge
        const subdomainEdge = result.edges.find(
            (e) =>
                e.sourceRef === "aspmx2.migadu.com" &&
                e.targetRef === "migadu.com",
        );
        expect(subdomainEdge).toBeDefined();
        expect(subdomainEdge!.edgeType).toBe("associated_with");
    });
});

describe("getRootDomain", () => {
    it("returns root domain from a subdomain", async () => {
        vi.spyOn(dns, "resolveSoa").mockImplementation(async (domain) => {
            if (domain === "example.com") {
                return {
                    nsname: "ns1.example.com",
                    hostmaster: "admin.example.com",
                    serial: 1,
                    refresh: 3600,
                    retry: 600,
                    expire: 604800,
                    minttl: 60,
                };
            }
            throw new Error("ENOTFOUND");
        });

        expect(await getRootDomain("api.staging.example.com")).toBe(
            "example.com",
        );
        expect(await getRootDomain("mail.example.com")).toBe("example.com");
        expect(await getRootDomain("example.com")).toBe("example.com");

        vi.restoreAllMocks();
    });

    it("returns domain as-is when SOA lookup fails entirely", async () => {
        vi.spyOn(dns, "resolveSoa").mockRejectedValue(new Error("ENOTFOUND"));

        expect(await getRootDomain("unknown.tld")).toBe("unknown.tld");

        vi.restoreAllMocks();
    });
});
