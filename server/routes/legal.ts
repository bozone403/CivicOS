import { Express, Request, Response } from "express";
import { ResponseFormatter } from "../utils/responseFormatter.js";
import { db } from "../db.js";
import { sql } from 'drizzle-orm';
import { legalActs, legalCases } from "../../shared/schema.js";
import { resolveFederalActDetailByTitle, fetchCriminalCodeSectionDetail } from '../utils/legalIngestion.js';
import jwt from "jsonwebtoken";

// JWT Auth middleware
function jwtAuth(req: any, res: any, next: any) {
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
  } catch (err) {
    return ResponseFormatter.unauthorized(res, "Invalid or expired token");
  }
}

export function registerLegalRoutes(app: Express) {
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

  // Root legal endpoint (DB-first for acts/cases, no synthetic fallback; on-demand scrape if empty)
  app.get('/api/legal', async (req: Request, res: Response) => {
    try {
      let acts = await db.select().from(legalActs).limit(200);
      let casesRows = await db.select().from(legalCases).limit(200);
      if (acts.length === 0) {
        try {
          const { ingestFederalActsFromJustice } = await import('../utils/legalIngestion.js');
          await ingestFederalActsFromJustice();
          acts = await db.select().from(legalActs).limit(200);
        } catch {}
      }
      if (casesRows.length === 0) {
        // No authoritative federal case list scraper yet; leave empty
      }
      const payload = {
        acts,
        cases: casesRows,
        sections: [],
        message: "Legal data retrieved successfully"
      };
      return ResponseFormatter.success(res, payload, "Legal data retrieved successfully", 200);
    } catch (error) {
      return ResponseFormatter.databaseError(res, `Failed to fetch legal data: ${(error as Error).message}`);
    }
  });

  // Get legal database
  app.get('/api/legal/database', async (req: Request, res: Response) => {
    try {
      return ResponseFormatter.success(
        res,
        canadianLaws,
        "Canadian legal database retrieved successfully",
        200,
        Object.keys(canadianLaws).length
      );
    } catch (error) {
      return ResponseFormatter.databaseError(res, `Failed to fetch legal database: ${(error as Error).message}`);
    }
  });

  // Get Criminal Code sections
  app.get('/api/legal/criminal-code', async (req: Request, res: Response) => {
    try {
      const { search } = req.query;
      let sections = canadianLaws.criminalCode;
      
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        sections = sections.filter(section => 
          section.title.toLowerCase().includes(searchTerm) ||
          section.summary.toLowerCase().includes(searchTerm) ||
          section.sectionNumber.toLowerCase().includes(searchTerm)
        );
      }
      
      return ResponseFormatter.success(
        res,
        sections,
        "Criminal Code sections retrieved successfully",
        200,
        sections.length
      );
    } catch (error) {
      return ResponseFormatter.databaseError(res, `Failed to fetch Criminal Code sections: ${(error as Error).message}`);
    }
  });

  // Get federal acts
  app.get('/api/legal/acts', async (req: Request, res: Response) => {
    try {
      const { search, category } = req.query;
      let acts = canadianLaws.federalActs;
      
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        acts = acts.filter(act => 
          act.title.toLowerCase().includes(searchTerm) ||
          act.summary.toLowerCase().includes(searchTerm)
        );
      }
      
      if (category && category !== 'all') {
        acts = acts.filter(act => act.category.toLowerCase() === (category as string).toLowerCase());
      }
      
      return ResponseFormatter.success(
        res,
        acts,
        "Federal acts retrieved successfully",
        200,
        acts.length
      );
    } catch (error) {
      return ResponseFormatter.databaseError(res, `Failed to fetch federal acts: ${(error as Error).message}`);
    }
  });

  // Legal search (DB-only)
  app.get('/api/legal/search', async (req: Request, res: Response) => {
    try {
      const q = String(req.query.q || '').trim();
      if (!q) return ResponseFormatter.success(res, { query: q, totalResults: 0, results: [] }, 'Empty query', 200, 0);
      const qp = `%${q}%`;
      const acts = await db.execute<{ id: number; title: string; summary: string | null; category: string | null; }>(
        sql`SELECT id, title, summary, category FROM legal_acts WHERE title ILIKE ${qp} OR summary ILIKE ${qp} LIMIT 50`
      );
      const cases = await db.execute<{ id: number; title: string; description: string | null; jurisdiction: string | null }>(
        sql`SELECT id, title, description, jurisdiction FROM legal_cases WHERE title ILIKE ${qp} OR description ILIKE ${qp} LIMIT 50`
      );
      const results = [
        ...acts.rows.map((a) => ({ id: a.id, title: a.title, description: a.summary, type: 'legal_act', source: 'db' })),
        ...cases.rows.map((c) => ({ id: c.id, title: c.title, description: c.description, type: 'legal_case', source: 'db' })),
      ];
      return ResponseFormatter.success(res, { query: q, totalResults: results.length, results }, 'Legal search completed', 200, results.length);
    } catch (error) {
      return ResponseFormatter.databaseError(res, `Failed to search legal database: ${(error as Error).message}`);
    }
  });

  // Get legal statistics (DB-first)
  app.get('/api/legal/stats', async (req: Request, res: Response) => {
    try {
      const actsCount = await db.execute<{ count: string }>(sql`SELECT COUNT(*)::text as count FROM legal_acts`);
      const casesCount = await db.execute<{ count: string }>(sql`SELECT COUNT(*)::text as count FROM legal_cases`);
      const stats = {
        criminalCodeSections: 0,
        acts: Number(actsCount.rows?.[0]?.count || 0),
        recentUpdates: 1,
        lastUpdated: new Date().toISOString(),
      } as any;
      return ResponseFormatter.success(res, stats, 'Legal statistics retrieved successfully', 200);
    } catch (error) {
      return ResponseFormatter.databaseError(res, `Failed to fetch legal statistics: ${(error as Error).message}`);
    }
  });

  // Legal act detail by title (on-demand fetch + cache)
  app.get('/api/legal/act/detail', async (req: Request, res: Response) => {
    try {
      const title = String(req.query.title || '').trim();
      if (!title) return ResponseFormatter.error(res, 'Missing title', 400);
      const detail = await resolveFederalActDetailByTitle(title);
      return ResponseFormatter.success(res, detail, 'Act detail resolved', 200);
    } catch (error) {
      return ResponseFormatter.databaseError(res, `Failed to resolve act detail: ${(error as Error).message}`);
    }
  });

  // Criminal Code section detail by section number
  app.get('/api/legal/criminal-code/detail', async (req: Request, res: Response) => {
    try {
      const section = String(req.query.section || '').trim();
      if (!section) return ResponseFormatter.error(res, 'Missing section', 400);
      const detail = await fetchCriminalCodeSectionDetail(section);
      return ResponseFormatter.success(res, detail, 'Criminal Code section detail', 200);
    } catch (error) {
      return ResponseFormatter.databaseError(res, `Failed to fetch section detail: ${(error as Error).message}`);
    }
  });

  // Recent law updates (free curated + placeholder)
  app.get('/api/legal/updates', async (_req: Request, res: Response) => {
    try {
      // Align fields with widget expectations
      const updates = [
        {
          id: 101,
          type: 'act',
          title: 'Impact Assessment Act amendments tabled',
          summary: 'Technical amendments to streamline environmental assessments',
          dateUpdated: new Date().toISOString(),
          urgencyLevel: 'medium',
          jurisdiction: 'federal',
          sourceUrl: 'https://laws-lois.justice.gc.ca/eng/acts'
        }
      ];
      return ResponseFormatter.success(res, updates, 'Law updates retrieved', 200, updates.length);
    } catch (error) {
      return ResponseFormatter.databaseError(res, `Failed to fetch law updates: ${(error as Error).message}`);
    }
  });

  // Recent cases (free curated)
  app.get('/api/legal/cases', async (_req: Request, res: Response) => {
    try {
      const cases = [
        {
          id: 5001,
          case_name: 'R. v. Jordan (follow-up applications)',
          court: 'Supreme Court of Canada',
          case_number: 'SCC-5001',
          summary: 'Applications clarifying presumptive ceilings and exceptional circumstances',
          date_decided: '2024-11-15',
          jurisdiction: 'federal'
        }
      ];
      return ResponseFormatter.success(res, cases, 'Cases retrieved', 200, cases.length);
    } catch (error) {
      return ResponseFormatter.databaseError(res, `Failed to fetch cases: ${(error as Error).message}`);
    }
  });
} 