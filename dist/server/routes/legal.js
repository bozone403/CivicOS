import { ResponseFormatter } from "../utils/responseFormatter.js";
import jwt from "jsonwebtoken";
// JWT Auth middleware
function jwtAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return ResponseFormatter.unauthorized(res, "Missing or invalid token");
    }
    try {
        const token = authHeader.split(" ")[1];
        const secret = process.env.SESSION_SECRET;
        if (!secret) {
            return ResponseFormatter.unauthorized(res, "Server configuration error");
        }
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch (err) {
        return ResponseFormatter.unauthorized(res, "Invalid or expired token");
    }
}
export function registerLegalRoutes(app) {
    // Sample Canadian laws database
    const canadianLaws = {
        criminalCode: [
            {
                id: 1,
                sectionNumber: "83.01",
                title: "Terrorist Activity",
                fullText: "Every person who knowingly participates in or contributes to, directly or indirectly, any activity of a terrorist group for the purpose of enhancing the ability of any terrorist group to facilitate or carry out a terrorist activity is guilty of an indictable offence and liable to imprisonment for a term not exceeding ten years.",
                summary: "Prohibits participation in terrorist activities",
                penalties: "Up to 10 years imprisonment",
                category: "National Security"
            },
            {
                id: 2,
                sectionNumber: "151",
                title: "Sexual Interference",
                fullText: "Every person who, for a sexual purpose, touches, directly or indirectly, with a part of the body or with an object, any part of the body of a person under the age of 16 years is guilty of an indictable offence and liable to imprisonment for a term not exceeding 14 years.",
                summary: "Prohibits sexual contact with minors",
                penalties: "Up to 14 years imprisonment",
                category: "Sexual Offences"
            },
            {
                id: 3,
                sectionNumber: "220",
                title: "Criminal Negligence Causing Death",
                fullText: "Every person who by criminal negligence causes death to another person is guilty of an indictable offence and liable to imprisonment for life.",
                summary: "Criminal negligence resulting in death",
                penalties: "Life imprisonment",
                category: "Homicide"
            },
            {
                id: 4,
                sectionNumber: "264",
                title: "Criminal Harassment",
                fullText: "No person shall, without lawful authority and knowing that another person is harassed or recklessly as to whether the other person is harassed, engage in conduct referred to in subsection (2) that causes that other person reasonably, in all the circumstances, to fear for their safety or the safety of anyone known to them.",
                summary: "Prohibits stalking and harassment",
                penalties: "Up to 10 years imprisonment",
                category: "Harassment"
            },
            {
                id: 5,
                sectionNumber: "334",
                title: "Theft",
                fullText: "Every one commits theft who fraudulently and without colour of right takes, or fraudulently and without colour of right converts to his use or to the use of another person, anything, whether animate or inanimate, with intent to deprive, temporarily or absolutely, the owner of it or a person who has a special property or interest in it, of the thing or of his property or interest in it.",
                summary: "Prohibits theft of property",
                penalties: "Up to 10 years imprisonment",
                category: "Property Crimes"
            },
            {
                id: 6,
                sectionNumber: "380",
                title: "Fraud",
                fullText: "Every one who, by deceit, falsehood or other fraudulent means, whether or not it is a false pretence within the meaning of this Act, defrauds the public or any person, whether ascertained or not, of any property, money or valuable security or any service is guilty of an indictable offence.",
                summary: "Prohibits fraud and deception",
                penalties: "Up to 14 years imprisonment",
                category: "Fraud"
            },
            {
                id: 7,
                sectionNumber: "430",
                title: "Mischief",
                fullText: "Every one commits mischief who wilfully destroys or damages property, renders property dangerous, useless, inoperative or ineffective, or interferes with the lawful use, enjoyment or operation of property.",
                summary: "Prohibits damage to property",
                penalties: "Up to 10 years imprisonment",
                category: "Property Crimes"
            },
            {
                id: 8,
                sectionNumber: "462.31",
                title: "Money Laundering",
                fullText: "Every one commits an offence who uses, transfers the possession of, sends or delivers to any person or place, transports, transmits, alters, disposes of or otherwise deals with, in any manner and by any means, any property or any proceeds of any property with intent to conceal or convert that property or those proceeds, knowing or believing that all or a part of that property or of those proceeds was obtained or derived directly or indirectly as a result of the commission in Canada of a designated offence.",
                summary: "Prohibits money laundering",
                penalties: "Up to 10 years imprisonment",
                category: "Financial Crimes"
            }
        ],
        federalActs: [
            {
                id: 1,
                title: "Canadian Human Rights Act",
                year: 1977,
                summary: "Prohibits discrimination in federally regulated activities",
                keyProvisions: ["Equal opportunity", "Anti-discrimination", "Human rights complaints"],
                category: "Human Rights"
            },
            {
                id: 2,
                title: "Privacy Act",
                year: 1983,
                summary: "Governs the collection, use, and disclosure of personal information by federal government institutions",
                keyProvisions: ["Personal information protection", "Access to personal information", "Privacy rights"],
                category: "Privacy"
            },
            {
                id: 3,
                title: "Personal Information Protection and Electronic Documents Act (PIPEDA)",
                year: 2000,
                summary: "Governs how private sector organizations collect, use, and disclose personal information",
                keyProvisions: ["Consent requirements", "Data protection", "Electronic documents"],
                category: "Privacy"
            },
            {
                id: 4,
                title: "Cannabis Act",
                year: 2018,
                summary: "Legalizes and regulates the production, distribution, and consumption of cannabis",
                keyProvisions: ["Legal cannabis", "Age restrictions", "Licensing requirements"],
                category: "Health"
            },
            {
                id: 5,
                title: "Impact Assessment Act",
                year: 2019,
                summary: "Establishes a federal impact assessment regime for major projects",
                keyProvisions: ["Environmental assessment", "Indigenous consultation", "Public participation"],
                category: "Environment"
            }
        ],
        provincialLaws: [
            {
                id: 1,
                province: "Ontario",
                title: "Ontario Human Rights Code",
                year: 1962,
                summary: "Prohibits discrimination in Ontario",
                keyProvisions: ["Equal treatment", "Accommodation", "Anti-discrimination"],
                category: "Human Rights"
            },
            {
                id: 2,
                province: "Quebec",
                title: "Charter of the French Language",
                year: 1977,
                summary: "Establishes French as the official language of Quebec",
                keyProvisions: ["French language rights", "Language requirements", "Signage regulations"],
                category: "Language"
            },
            {
                id: 3,
                province: "British Columbia",
                title: "Environmental Management Act",
                year: 2003,
                summary: "Governs environmental protection in British Columbia",
                keyProvisions: ["Environmental protection", "Waste management", "Air quality"],
                category: "Environment"
            },
            {
                id: 4,
                province: "Alberta",
                title: "Alberta Human Rights Act",
                year: 1972,
                summary: "Prohibits discrimination in Alberta",
                keyProvisions: ["Equal rights", "Anti-discrimination", "Human rights complaints"],
                category: "Human Rights"
            }
        ]
    };
    // Root legal endpoint
    app.get('/api/legal', async (req, res) => {
        try {
            const legalData = {
                acts: canadianLaws.federalActs,
                cases: [
                    {
                        id: 1,
                        title: "R. v. Oakes",
                        year: 1986,
                        summary: "Landmark case establishing the Oakes test for reasonable limits on Charter rights",
                        category: "Constitutional Law",
                        impact: "Established framework for analyzing Charter violations"
                    },
                    {
                        id: 2,
                        title: "R. v. Jordan",
                        year: 2016,
                        summary: "Established the Jordan framework for unreasonable delay in criminal proceedings",
                        category: "Criminal Law",
                        impact: "Set 18-month presumptive ceiling for provincial court proceedings"
                    },
                    {
                        id: 3,
                        title: "R. v. Morgentaler",
                        year: 1988,
                        summary: "Struck down Canada's abortion law as unconstitutional",
                        category: "Constitutional Law",
                        impact: "Decriminalized abortion in Canada"
                    }
                ],
                sections: canadianLaws.criminalCode,
                message: "Legal data retrieved successfully"
            };
            return ResponseFormatter.success(res, legalData, "Legal data retrieved successfully", 200);
        }
        catch (error) {
            return ResponseFormatter.databaseError(res, `Failed to fetch legal data: ${error.message}`);
        }
    });
    // Get legal database
    app.get('/api/legal/database', async (req, res) => {
        try {
            return ResponseFormatter.success(res, canadianLaws, "Canadian legal database retrieved successfully", 200, Object.keys(canadianLaws).length);
        }
        catch (error) {
            return ResponseFormatter.databaseError(res, `Failed to fetch legal database: ${error.message}`);
        }
    });
    // Get Criminal Code sections
    app.get('/api/legal/criminal-code', async (req, res) => {
        try {
            const { search } = req.query;
            let sections = canadianLaws.criminalCode;
            if (search) {
                const searchTerm = search.toLowerCase();
                sections = sections.filter(section => section.title.toLowerCase().includes(searchTerm) ||
                    section.summary.toLowerCase().includes(searchTerm) ||
                    section.sectionNumber.toLowerCase().includes(searchTerm));
            }
            return ResponseFormatter.success(res, sections, "Criminal Code sections retrieved successfully", 200, sections.length);
        }
        catch (error) {
            return ResponseFormatter.databaseError(res, `Failed to fetch Criminal Code sections: ${error.message}`);
        }
    });
    // Get federal acts
    app.get('/api/legal/acts', async (req, res) => {
        try {
            const { search, category } = req.query;
            let acts = canadianLaws.federalActs;
            if (search) {
                const searchTerm = search.toLowerCase();
                acts = acts.filter(act => act.title.toLowerCase().includes(searchTerm) ||
                    act.summary.toLowerCase().includes(searchTerm));
            }
            if (category && category !== 'all') {
                acts = acts.filter(act => act.category.toLowerCase() === category.toLowerCase());
            }
            return ResponseFormatter.success(res, acts, "Federal acts retrieved successfully", 200, acts.length);
        }
        catch (error) {
            return ResponseFormatter.databaseError(res, `Failed to fetch federal acts: ${error.message}`);
        }
    });
    // Legal search
    app.get('/api/legal/search', async (req, res) => {
        try {
            const { q, type } = req.query;
            const query = q?.toLowerCase() || '';
            const searchType = type || 'all';
            let results = [];
            if (searchType === 'all' || searchType === 'criminal_code') {
                const criminalResults = canadianLaws.criminalCode.filter(section => section.title.toLowerCase().includes(query) ||
                    section.summary.toLowerCase().includes(query) ||
                    section.sectionNumber.toLowerCase().includes(query));
                results.push(...criminalResults.map(r => ({ ...r, type: 'criminal_code' })));
            }
            if (searchType === 'all' || searchType === 'federal_acts') {
                const actResults = canadianLaws.federalActs.filter(act => act.title.toLowerCase().includes(query) ||
                    act.summary.toLowerCase().includes(query));
                results.push(...actResults.map(r => ({ ...r, type: 'federal_act' })));
            }
            if (searchType === 'all' || searchType === 'provincial_laws') {
                const provincialResults = canadianLaws.provincialLaws.filter(law => law.title.toLowerCase().includes(query) ||
                    law.summary.toLowerCase().includes(query) ||
                    law.province.toLowerCase().includes(query));
                results.push(...provincialResults.map(r => ({ ...r, type: 'provincial_law' })));
            }
            return ResponseFormatter.success(res, {
                query: q,
                totalResults: results.length,
                results: results.slice(0, 50), // Limit results
                categories: {
                    criminal_code: results.filter(r => r.type === 'criminal_code').length,
                    federal_acts: results.filter(r => r.type === 'federal_act').length,
                    provincial_laws: results.filter(r => r.type === 'provincial_law').length
                }
            }, "Legal search completed successfully", 200, results.length);
        }
        catch (error) {
            return ResponseFormatter.databaseError(res, `Failed to search legal database: ${error.message}`);
        }
    });
    // Get legal statistics
    app.get('/api/legal/stats', async (req, res) => {
        try {
            const stats = {
                totalCriminalCodeSections: canadianLaws.criminalCode.length,
                totalFederalActs: canadianLaws.federalActs.length,
                totalProvincialLaws: canadianLaws.provincialLaws.length,
                categories: {
                    "National Security": canadianLaws.criminalCode.filter(s => s.category === "National Security").length,
                    "Sexual Offences": canadianLaws.criminalCode.filter(s => s.category === "Sexual Offences").length,
                    "Property Crimes": canadianLaws.criminalCode.filter(s => s.category === "Property Crimes").length,
                    "Human Rights": canadianLaws.federalActs.filter(a => a.category === "Human Rights").length,
                    "Privacy": canadianLaws.federalActs.filter(a => a.category === "Privacy").length
                },
                lastUpdated: new Date().toISOString()
            };
            return ResponseFormatter.success(res, stats, "Legal statistics retrieved successfully", 200);
        }
        catch (error) {
            return ResponseFormatter.databaseError(res, `Failed to fetch legal statistics: ${error.message}`);
        }
    });
}
