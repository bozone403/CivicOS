import { Express, Request, Response } from "express";

interface ChartRight {
  id: string;
  section: number;
  title: string;
  category: "fundamental" | "democratic" | "mobility" | "legal" | "equality" | "language";
  text: string;
  plainLanguage: string;
  examples: string[];
  limitations?: string[];
  relatedSections?: number[];
  provincialVariations?: Array<{
    province: string;
    variation: string;
    examples: string[];
  }>;
}

interface ProvincialRight {
  id: string;
  province: string;
  title: string;
  category: string;
  description: string;
  plainLanguage: string;
  examples: string[];
  relatedCharter?: number[];
}

const charterRights: ChartRight[] = [
  {
    id: "fundamental-1",
    section: 2,
    title: "Freedom of Conscience and Religion",
    category: "fundamental",
    text: "Everyone has the following fundamental freedoms: (a) freedom of conscience and religion; (b) freedom of thought, belief, opinion and expression, including freedom of the press and other media of communication; (c) freedom of peaceful assembly; and (d) freedom of association.",
    plainLanguage: "You have the right to believe in any religion or no religion, and to express your beliefs freely.",
    examples: [
      "Attending any religious service or ceremony",
      "Wearing religious symbols or clothing",
      "Refusing to participate in activities that conflict with your beliefs",
      "Starting a religious organization",
      "Expressing your religious views publicly"
    ],
    limitations: [
      "Cannot use religion to justify discrimination",
      "Must not harm others in the name of religion",
      "Religious practices must not violate other laws"
    ]
  },
  {
    id: "fundamental-2",
    section: 2,
    title: "Freedom of Expression",
    category: "fundamental",
    text: "Everyone has the following fundamental freedoms: (a) freedom of conscience and religion; (b) freedom of thought, belief, opinion and expression, including freedom of the press and other media of communication; (c) freedom of peaceful assembly; and (d) freedom of association.",
    plainLanguage: "You have the right to express your opinions, beliefs, and ideas freely.",
    examples: [
      "Writing articles or blogs",
      "Protesting government policies",
      "Creating art, music, or literature",
      "Speaking at public meetings",
      "Publishing books or newspapers"
    ],
    limitations: [
      "Cannot spread hate speech",
      "Cannot make false statements that harm others",
      "Cannot incite violence",
      "Must respect others' rights"
    ]
  },
  {
    id: "democratic-1",
    section: 3,
    title: "Democratic Rights",
    category: "democratic",
    text: "Every citizen of Canada has the right to vote in an election of members of the House of Commons or of a legislative assembly and to be qualified for membership therein.",
    plainLanguage: "You have the right to vote in elections and run for political office.",
    examples: [
      "Voting in federal elections",
      "Voting in provincial elections",
      "Voting in municipal elections",
      "Running for political office",
      "Joining political parties"
    ]
  },
  {
    id: "mobility-1",
    section: 6,
    title: "Mobility Rights",
    category: "mobility",
    text: "Every citizen of Canada has the right to enter, remain in and leave Canada. Every citizen of Canada and every person who has the status of a permanent resident of Canada has the right to move to and take up residence in any province and to pursue the gaining of a livelihood in any province.",
    plainLanguage: "You have the right to move freely within Canada and to work anywhere in the country.",
    examples: [
      "Moving from one province to another",
      "Working in any province",
      "Traveling within Canada",
      "Choosing where to live",
      "Starting a business anywhere in Canada"
    ]
  },
  {
    id: "legal-1",
    section: 7,
    title: "Life, Liberty and Security of Person",
    category: "legal",
    text: "Everyone has the right to life, liberty and security of the person and the right not to be deprived thereof except in accordance with the principles of fundamental justice.",
    plainLanguage: "You have the right to be safe and free, and cannot be deprived of these rights without fair legal process.",
    examples: [
      "Protection from arbitrary arrest",
      "Right to a fair trial",
      "Protection from cruel and unusual punishment",
      "Right to legal representation",
      "Protection from unreasonable search and seizure"
    ]
  },
  {
    id: "equality-1",
    section: 15,
    title: "Equality Rights",
    category: "equality",
    text: "Every individual is equal before and under the law and has the right to the equal protection and equal benefit of the law without discrimination and, in particular, without discrimination based on race, national or ethnic origin, colour, religion, sex, age or mental or physical disability.",
    plainLanguage: "You have the right to be treated equally under the law, regardless of your background or characteristics.",
    examples: [
      "Equal access to government services",
      "Equal treatment in employment",
      "Equal access to education",
      "Equal treatment in housing",
      "Protection from discrimination"
    ]
  },
  {
    id: "language-1",
    section: 16,
    title: "Official Languages",
    category: "language",
    text: "English and French are the official languages of Canada and have equality of status and equal rights and privileges as to their use in all institutions of the Parliament and government of Canada.",
    plainLanguage: "You have the right to use English or French when dealing with the federal government.",
    examples: [
      "Receiving government services in English or French",
      "Communicating with federal officials in either language",
      "Accessing federal court proceedings in either language",
      "Receiving federal documents in your preferred language"
    ]
  }
];

const provincialRights: ProvincialRight[] = [
  {
    id: "bc-1",
    province: "British Columbia",
    title: "Right to Clean Environment",
    category: "environmental",
    description: "British Columbia recognizes the right to a healthy environment and clean air and water.",
    plainLanguage: "You have the right to live in a clean, healthy environment.",
    examples: [
      "Access to clean drinking water",
      "Protection from pollution",
      "Right to participate in environmental decisions",
      "Access to public parks and green spaces"
    ]
  },
  {
    id: "qc-1",
    province: "Quebec",
    title: "French Language Rights",
    category: "language",
    description: "Quebec has specific language rights protecting the use of French in the province.",
    plainLanguage: "French is the primary language of Quebec, and you have rights related to French language use.",
    examples: [
      "Right to receive government services in French",
      "Right to work in French",
      "Right to education in French",
      "Right to commercial signage in French"
    ]
  },
  {
    id: "on-1",
    province: "Ontario",
    title: "Consumer Protection Rights",
    category: "consumer",
    description: "Ontario has strong consumer protection laws and rights.",
    plainLanguage: "You have rights as a consumer in Ontario, including protection from unfair business practices.",
    examples: [
      "Right to cancel contracts within cooling-off periods",
      "Protection from false advertising",
      "Right to refunds for defective products",
      "Protection from unfair debt collection practices"
    ]
  }
];

export function registerRightsRoutes(app: Express) {
  // Root rights endpoint
  app.get('/api/rights', async (req: Request, res: Response) => {
    try {
      res.json({
        charterRights: charterRights.slice(0, 5),
        totalRights: charterRights.length,
        categories: ["fundamental", "democratic", "mobility", "legal", "equality", "language"],
        message: "Rights data retrieved successfully"
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch rights data' });
    }
  });
  // GET /api/rights/charter - Get Charter of Rights and Freedoms
  app.get("/api/rights/charter", async (req: Request, res: Response) => {
    try {
      res.json(charterRights);
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ error: "Failed to fetch charter rights" });
    }
  });

  // GET /api/rights/provincial - Get provincial rights
  app.get("/api/rights/provincial", async (req: Request, res: Response) => {
    try {
      const { province } = req.query;
      
      if (province && province !== "all") {
        const filteredRights = provincialRights.filter(right => 
          right.province.toLowerCase() === (province as string).toLowerCase()
        );
        res.json(filteredRights);
      } else {
        res.json(provincialRights);
      }
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ error: "Failed to fetch provincial rights" });
    }
  });

  // GET /api/rights/search - Search rights
  app.get("/api/rights/search", async (req: Request, res: Response) => {
    try {
      const { q, category, province } = req.query;
      
      let results = [...charterRights, ...provincialRights];
      
      if (q) {
        const query = (q as string).toLowerCase();
        results = results.filter(right => 
          right.title.toLowerCase().includes(query) ||
          right.plainLanguage.toLowerCase().includes(query) ||
          right.examples.some(example => example.toLowerCase().includes(query))
        );
      }
      
      if (category && category !== "all") {
        results = results.filter(right => right.category === category);
      }
      
      if (province && province !== "all") {
        results = results.filter(right => 
          'province' in right && right.province.toLowerCase() === (province as string).toLowerCase()
        );
      }
      
      res.json(results);
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ error: "Failed to search rights" });
    }
  });
} 