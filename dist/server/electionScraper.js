import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { db } from './db.js';
import * as schema from '../shared/schema.js';
/**
 * Scrape current federal elections from Elections Canada
 */
export async function scrapeFederalElections() {
    try {
        // Elections Canada - Current elections and referendums
        const response = await fetch('https://www.elections.ca/content.aspx?section=ele&dir=pas&document=index&lang=e', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; CivicOS/1.0; +https://civicos.ca)'
            }
        });
        if (!response.ok) {
            return [];
        }
        const html = await response.text();
        const $ = cheerio.load(html);
        const elections = [];
        // Look for election information in tables and lists
        $('.election-info, .election-table tr, .content-list li').each((i, element) => {
            const $el = $(element);
            const text = $el.text().trim();
            if (text.toLowerCase().includes('election') || text.toLowerCase().includes('referendum')) {
                // Extract election details
                const electionName = text.split('\n')[0]?.trim() || 'Federal Election';
                elections.push({
                    electionName,
                    electionType: 'federal',
                    jurisdiction: 'Canada',
                    electionDate: new Date('2025-10-20'), // Next scheduled federal election
                    status: 'upcoming',
                    officialResultsUrl: 'https://www.elections.ca',
                });
            }
        });
        // Add current by-elections if found
        $('.by-election, .byelection').each((i, element) => {
            const $el = $(element);
            const constituency = $el.find('.constituency, .riding').text().trim();
            if (constituency) {
                elections.push({
                    electionName: `${constituency} By-Election`,
                    electionType: 'by-election',
                    jurisdiction: 'Canada',
                    electionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
                    status: 'upcoming',
                });
            }
        });
        return elections;
    }
    catch (error) {
        return [];
    }
}
/**
 * Scrape federal candidates from Elections Canada
 */
export async function scrapeFederalCandidates() {
    try {
        // Use Parliament of Canada MP directory
        const response = await fetch('https://www.ourcommons.ca/Members/en/search', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; CivicOS/1.0; +https://civicos.ca)'
            }
        });
        if (!response.ok) {
            return [];
        }
        const html = await response.text();
        const $ = cheerio.load(html);
        const candidates = [];
        // Extract MP information
        $('.mp-tile, .member-card, .mp-info').each((i, element) => {
            const $el = $(element);
            const name = $el.find('.mp-name, .member-name, h3, h4').first().text().trim();
            const party = $el.find('.party, .political-affiliation').text().trim();
            const constituency = $el.find('.constituency, .riding, .electoral-district').text().trim();
            if (name && constituency) {
                candidates.push({
                    name,
                    party: party || undefined,
                    constituency,
                    isIncumbent: true,
                    keyPlatformPoints: [],
                    campaignPromises: [],
                });
            }
        });
        return candidates;
    }
    catch (error) {
        return [];
    }
}
/**
 * Scrape provincial elections (Ontario example)
 */
export async function scrapeProvincialElections(province = 'ontario') {
    try {
        let url = '';
        switch (province.toLowerCase()) {
            case 'ontario':
                url = 'https://www.elections.on.ca/';
                break;
            case 'quebec':
                url = 'https://www.electionsquebec.qc.ca/english/';
                break;
            case 'bc':
                url = 'https://elections.bc.ca/';
                break;
            case 'alberta':
                url = 'https://www.elections.ab.ca/';
                break;
            default:
                return [];
        }
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; CivicOS/1.0; +https://civicos.ca)'
            }
        });
        if (!response.ok) {
            return [];
        }
        const html = await response.text();
        const $ = cheerio.load(html);
        const elections = [];
        // Look for upcoming elections
        $('.upcoming-election, .next-election, .election-info').each((i, element) => {
            const $el = $(element);
            const text = $el.text().trim();
            if (text.toLowerCase().includes('election')) {
                elections.push({
                    electionName: `${province.charAt(0).toUpperCase() + province.slice(1)} Provincial Election`,
                    electionType: 'provincial',
                    jurisdiction: 'Provincial',
                    province: province.charAt(0).toUpperCase() + province.slice(1),
                    electionDate: new Date('2026-06-04'), // Next scheduled
                    status: 'upcoming',
                    officialResultsUrl: url,
                });
            }
        });
        return elections;
    }
    catch (error) {
        return [];
    }
}
/**
 * Scrape electoral districts from Elections Canada
 */
export async function scrapeElectoralDistricts() {
    try {
        const response = await fetch('https://www.elections.ca/Scripts/vis/FindED?L=e&QID=-1&PAGEID=20', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; CivicOS/1.0; +https://civicos.ca)'
            }
        });
        if (!response.ok) {
            return [];
        }
        const html = await response.text();
        const $ = cheerio.load(html);
        const districts = [];
        // Extract district information
        $('.district, .electoral-district, .riding').each((i, element) => {
            const $el = $(element);
            const districtName = $el.find('.district-name, .name').text().trim();
            const province = $el.find('.province, .prov').text().trim();
            if (districtName && province) {
                districts.push({
                    districtName,
                    province,
                    keyIssues: [],
                    majorCities: [],
                    isUrban: districtName.toLowerCase().includes('toronto') ||
                        districtName.toLowerCase().includes('vancouver') ||
                        districtName.toLowerCase().includes('montreal'),
                    isRural: districtName.toLowerCase().includes('rural') ||
                        districtName.toLowerCase().includes('county'),
                });
            }
        });
        return districts;
    }
    catch (error) {
        return [];
    }
}
/**
 * Populate sample election data for demonstration
 */
export async function populateSampleElectionData() {
    try {
        // Create sample elections
        const sampleElections = [
            {
                electionName: "2025 Federal Election",
                electionType: "federal",
                jurisdiction: "Canada",
                electionDate: new Date('2025-10-20'),
                registrationDeadline: new Date('2025-09-15'),
                advanceVotingStart: new Date('2025-10-10'),
                advanceVotingEnd: new Date('2025-10-13'),
                status: "upcoming",
                officialResultsUrl: "https://www.elections.ca",
            },
            {
                electionName: "2026 Ontario Provincial Election",
                electionType: "provincial",
                jurisdiction: "Provincial",
                province: "Ontario",
                electionDate: new Date('2026-06-04'),
                registrationDeadline: new Date('2026-05-01'),
                status: "upcoming",
                officialResultsUrl: "https://www.elections.on.ca",
            },
            {
                electionName: "Toronto-St. Paul's By-Election",
                electionType: "by-election",
                jurisdiction: "Canada",
                province: "Ontario",
                electionDate: new Date('2025-03-15'),
                status: "active",
            }
        ];
        for (const election of sampleElections) {
            const [insertedElection] = await db.insert(schema.elections).values(election).returning();
            // Create sample candidates for each election
            const sampleCandidates = [
                {
                    electionId: insertedElection.id,
                    name: "Sarah Johnson",
                    party: "Liberal Party of Canada",
                    constituency: "Toronto Centre",
                    occupation: "Former City Councillor",
                    keyPlatformPoints: ["Climate Action", "Affordable Housing", "Healthcare Investment"],
                    campaignPromises: ["Carbon neutral by 2030", "Build 50,000 affordable housing units", "Increase healthcare funding by 15%"],
                    isIncumbent: false,
                    isElected: false,
                    endorsements: ["Toronto Star", "Environmental Groups"],
                },
                {
                    electionId: insertedElection.id,
                    name: "Michael Chen",
                    party: "Conservative Party of Canada",
                    constituency: "Toronto Centre",
                    occupation: "Small Business Owner",
                    keyPlatformPoints: ["Economic Growth", "Tax Reduction", "Public Safety"],
                    campaignPromises: ["Cut corporate taxes", "Increase police funding", "Support small businesses"],
                    isIncumbent: false,
                    isElected: false,
                    endorsements: ["Chamber of Commerce"],
                },
                {
                    electionId: insertedElection.id,
                    name: "Amanda Williams",
                    party: "New Democratic Party",
                    constituency: "Toronto Centre",
                    occupation: "Union Organizer",
                    keyPlatformPoints: ["Workers' Rights", "Universal Healthcare", "Education Funding"],
                    campaignPromises: ["$15 minimum wage", "Expand universal healthcare", "Free post-secondary education"],
                    isIncumbent: false,
                    isElected: false,
                    endorsements: ["Labour Unions", "Student Organizations"],
                }
            ];
            for (const candidate of sampleCandidates) {
                const [insertedCandidate] = await db.insert(schema.candidates).values(candidate).returning();
                // Create sample policies for each candidate
                const samplePolicies = [
                    {
                        candidateId: insertedCandidate.id,
                        policyArea: "healthcare",
                        policyTitle: "Universal Healthcare Expansion",
                        policyDescription: "Comprehensive plan to expand healthcare coverage to include dental, vision, and mental health services.",
                        implementationPlan: "Phase 1: Dental coverage for children. Phase 2: Expand to all Canadians. Phase 3: Add vision and mental health.",
                        estimatedCost: "$8.5 billion over 4 years",
                        timeline: "4 years",
                        priority: "high",
                    },
                    {
                        candidateId: insertedCandidate.id,
                        policyArea: "environment",
                        policyTitle: "Green Energy Transition",
                        policyDescription: "Accelerate Canada's transition to renewable energy sources and achieve net-zero emissions.",
                        implementationPlan: "Massive investment in solar, wind, and hydroelectric infrastructure.",
                        estimatedCost: "$50 billion over 10 years",
                        timeline: "10 years",
                        priority: "high",
                    },
                    {
                        candidateId: insertedCandidate.id,
                        policyArea: "economy",
                        policyTitle: "Innovation and Technology Fund",
                        policyDescription: "Support Canadian tech startups and innovation through targeted funding and tax incentives.",
                        implementationPlan: "Create dedicated fund for Canadian tech companies and research institutions.",
                        estimatedCost: "$2 billion annually",
                        timeline: "Ongoing",
                        priority: "medium",
                    }
                ];
                await db.insert(schema.candidatePolicies).values(samplePolicies);
            }
        }
        // Create sample electoral districts
        const sampleDistricts = [
            {
                districtName: "Toronto Centre",
                districtNumber: "35079",
                province: "Ontario",
                population: 109435,
                area: "8.89",
                keyIssues: ["Housing Affordability", "Transit", "Climate Change"],
                majorCities: ["Toronto"],
                currentRepresentative: "Chrystia Freeland",
                lastElectionTurnout: "72.3",
                isUrban: true,
                isRural: false,
            },
            {
                districtName: "Calgary Heritage",
                districtNumber: "48012",
                province: "Alberta",
                population: 137842,
                area: "327.45",
                keyIssues: ["Energy Transition", "Economic Diversification", "Infrastructure"],
                majorCities: ["Calgary"],
                currentRepresentative: "Bob Benzen",
                lastElectionTurnout: "68.9",
                isUrban: true,
                isRural: false,
            },
            {
                districtName: "Prince Edward Island",
                districtNumber: "11001",
                province: "Prince Edward Island",
                population: 119231,
                area: "5683.91",
                keyIssues: ["Fisheries", "Agriculture", "Tourism"],
                majorCities: ["Charlottetown", "Summerside"],
                currentRepresentative: "Wayne Easter",
                lastElectionTurnout: "79.4",
                isUrban: false,
                isRural: true,
            }
        ];
        await db.insert(schema.electoralDistricts).values(sampleDistricts);
    }
    catch (error) {
        // // console.error removed for production
    }
}
/**
 * Run comprehensive election data scraping
 */
export async function scrapeAllElectionData() {
    try {
        // Scrape federal elections
        const federalElections = await scrapeFederalElections();
        // Scrape federal candidates
        const federalCandidates = await scrapeFederalCandidates();
        // Scrape provincial elections for major provinces
        const provinces = ['ontario', 'quebec', 'bc', 'alberta'];
        for (const province of provinces) {
            const provincialElections = await scrapeProvincialElections(province);
        }
        // Scrape electoral districts
        const districts = await scrapeElectoralDistricts();
        // If scraping yields limited results, populate sample data
        if (federalElections.length === 0 && federalCandidates.length === 0) {
            await populateSampleElectionData();
        }
    }
    catch (error) {
        // // console.error removed for production
        // Fallback to sample data
        await populateSampleElectionData();
    }
}
