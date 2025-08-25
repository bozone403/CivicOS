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
export function registerRightsRoutes(app) {
    // Charter of Rights and Freedoms data
    const charterRights = [
        {
            id: "1",
            section: 1,
            title: "Guarantee of Rights and Freedoms",
            category: "fundamental",
            text: "The Canadian Charter of Rights and Freedoms guarantees the rights and freedoms set out in it subject only to such reasonable limits prescribed by law as can be demonstrably justified in a free and democratic society.",
            plainLanguage: "Your rights are protected, but they can be limited if the government can show it's reasonable and necessary in a democratic society.",
            examples: ["Freedom of speech can be limited to prevent hate speech", "Right to privacy can be limited for national security"],
            limitations: ["Reasonable limits clause", "Notwithstanding clause"]
        },
        {
            id: "2",
            section: 2,
            title: "Fundamental Freedoms",
            category: "fundamental",
            text: "Everyone has the following fundamental freedoms: (a) freedom of conscience and religion; (b) freedom of thought, belief, opinion and expression, including freedom of the press and other media of communication; (c) freedom of peaceful assembly; and (d) freedom of association.",
            plainLanguage: "You have the right to practice your religion, express your opinions, gather peacefully, and join groups.",
            examples: ["Attending religious services", "Protesting government policies", "Joining a political party", "Publishing articles"],
            limitations: ["Hate speech laws", "Public safety restrictions", "Reasonable time and place restrictions"]
        },
        {
            id: "3",
            section: 3,
            title: "Democratic Rights",
            category: "democratic",
            text: "Every citizen of Canada has the right to vote in an election of members of the House of Commons or of a legislative assembly and to be qualified for membership therein.",
            plainLanguage: "You have the right to vote in federal and provincial elections and to run for office.",
            examples: ["Voting in federal elections", "Running for Parliament", "Voting in provincial elections", "Being a candidate"],
            limitations: ["Age requirements (18+)", "Citizenship requirements", "Residency requirements"]
        },
        {
            id: "4",
            section: 4,
            title: "Maximum Duration of Legislative Bodies",
            category: "democratic",
            text: "No House of Commons and no legislative assembly shall continue for longer than five years from the date fixed for the return of the writs at a general election of its members.",
            plainLanguage: "Federal and provincial governments must hold elections at least every 5 years.",
            examples: ["Federal elections every 4-5 years", "Provincial elections every 4-5 years", "Fixed election dates in some provinces"],
            limitations: ["Can be extended during war or emergency", "Prime Minister can call early elections"]
        },
        {
            id: "5",
            section: 5,
            title: "Annual Sitting of Legislative Bodies",
            category: "democratic",
            text: "There shall be a sitting of Parliament and of each legislature at least once every twelve months.",
            plainLanguage: "Parliament and provincial legislatures must meet at least once a year.",
            examples: ["Fall sitting of Parliament", "Spring budget session", "Provincial legislative sessions"],
            limitations: ["Can be prorogued or dissolved", "Emergency situations"]
        },
        {
            id: "6",
            section: 6,
            title: "Mobility Rights",
            category: "mobility",
            text: "Every citizen of Canada has the right to enter, remain in and leave Canada. Every citizen of Canada and every person who has the status of a permanent resident of Canada has the right to move to and take up residence in any province and to pursue the gaining of a livelihood in any province.",
            plainLanguage: "You can move freely within Canada and work anywhere in the country.",
            examples: ["Moving from Ontario to British Columbia", "Working in any province", "Leaving and returning to Canada"],
            limitations: ["Provincial residency requirements for some benefits", "Professional licensing requirements"]
        },
        {
            id: "7",
            section: 7,
            title: "Life, Liberty and Security of Person",
            category: "legal",
            text: "Everyone has the right to life, liberty and security of the person and the right not to be deprived thereof except in accordance with the principles of fundamental justice.",
            plainLanguage: "You have the right to life, freedom, and personal security, and can only be deprived of these rights through fair legal processes.",
            examples: ["Right to bodily integrity", "Right to make personal decisions", "Protection from arbitrary detention"],
            limitations: ["Criminal law restrictions", "Public safety measures", "Medical treatment requirements"]
        },
        {
            id: "8",
            section: 8,
            title: "Search or Seizure",
            category: "legal",
            text: "Everyone has the right to be secure against unreasonable search or seizure.",
            plainLanguage: "You have the right to be protected from unreasonable searches and seizures by police or other authorities.",
            examples: ["Requiring a warrant for home searches", "Protection from random police stops", "Right to privacy in personal belongings"],
            limitations: ["Search incident to arrest", "Plain view doctrine", "Exigent circumstances"]
        },
        {
            id: "9",
            section: 9,
            title: "Detention or Imprisonment",
            category: "legal",
            text: "Everyone has the right not to be arbitrarily detained or imprisoned.",
            plainLanguage: "You cannot be held in custody without a good reason and proper legal process.",
            examples: ["Right to know why you're being detained", "Right to challenge detention", "Protection from arbitrary arrest"],
            limitations: ["Arrest with reasonable grounds", "Detention for public safety", "Mental health holds"]
        },
        {
            id: "10",
            section: 10,
            title: "Arrest or Detention",
            category: "legal",
            text: "Everyone has the right on arrest or detention to be informed promptly of the reasons therefor; to retain and instruct counsel without delay and to be informed of that right; and to have the validity of the detention determined by way of habeas corpus and to be released if the detention is not lawful.",
            plainLanguage: "If you're arrested, you have the right to know why, to speak to a lawyer, and to challenge your detention in court.",
            examples: ["Right to legal counsel", "Right to know charges", "Right to challenge detention in court"],
            limitations: ["Delays in emergency situations", "Limited access in remote areas"]
        },
        {
            id: "11",
            section: 11,
            title: "Proceedings in Criminal and Penal Matters",
            category: "legal",
            text: "Any person charged with an offence has the right to be presumed innocent until proven guilty according to law in a fair and public hearing by an independent and impartial tribunal; to be informed without unreasonable delay of the specific offence; to be tried within a reasonable time; not to be compelled to be a witness in proceedings against that person in respect of the offence; to be tried by a jury where the maximum punishment for the offence is imprisonment for five years or a more severe punishment; to the benefit of the lesser punishment where the punishment for the offence has been varied between the time of commission and the time of sentencing; and to the benefit of the lesser punishment where the punishment for the offence has been varied between the time of commission and the time of sentencing.",
            plainLanguage: "If you're charged with a crime, you have many rights including the right to a fair trial, to remain silent, and to be presumed innocent until proven guilty.",
            examples: ["Right to remain silent", "Right to a jury trial", "Right to a speedy trial", "Presumption of innocence"],
            limitations: ["Can be waived", "Limited in some administrative proceedings"]
        },
        {
            id: "12",
            section: 12,
            title: "Treatment or Punishment",
            category: "legal",
            text: "Everyone has the right not to be subjected to any cruel and unusual treatment or punishment.",
            plainLanguage: "You have the right to be protected from cruel and unusual treatment or punishment.",
            examples: ["Protection from torture", "Protection from excessive force", "Protection from inhumane prison conditions"],
            limitations: ["Reasonable use of force by police", "Legitimate punishment for crimes"]
        },
        {
            id: "13",
            section: 13,
            title: "Self-Incrimination",
            category: "legal",
            text: "A witness who testifies in any proceedings has the right not to have any incriminating evidence so given used to incriminate that witness in any other proceedings, except in a prosecution for perjury or for the giving of contradictory evidence.",
            plainLanguage: "If you testify in court, your testimony cannot be used against you in other criminal proceedings.",
            examples: ["Protection when testifying", "Right to refuse to answer self-incriminating questions"],
            limitations: ["Perjury prosecutions", "Contradictory evidence prosecutions"]
        },
        {
            id: "14",
            section: 14,
            title: "Interpreter",
            category: "legal",
            text: "A party or witness in any proceedings who does not understand or speak the language in which the proceedings are conducted or who is deaf has the right to the assistance of an interpreter.",
            plainLanguage: "You have the right to an interpreter if you don't understand the language of the court or if you're deaf.",
            examples: ["Court interpreter services", "Sign language interpreters", "Translation of legal documents"],
            limitations: ["Availability of qualified interpreters", "Cost considerations"]
        },
        {
            id: "15",
            section: 15,
            title: "Equality Rights",
            category: "equality",
            text: "Every individual is equal before and under the law and has the right to the equal protection and equal benefit of the law without discrimination and, in particular, without discrimination based on race, national or ethnic origin, colour, religion, sex, age or mental or physical disability.",
            plainLanguage: "You have the right to be treated equally under the law regardless of your race, religion, gender, age, or disability.",
            examples: ["Equal access to government services", "Protection from discrimination", "Equal treatment in employment"],
            limitations: ["Affirmative action programs", "Bona fide occupational requirements", "Age restrictions for certain activities"]
        },
        {
            id: "16",
            section: 16,
            title: "Official Languages of Canada",
            category: "language",
            text: "English and French are the official languages of Canada and have equality of status and equal rights and privileges as to their use in all institutions of the Parliament and government of Canada.",
            plainLanguage: "English and French are Canada's official languages and have equal status in federal government institutions.",
            examples: ["Bilingual government services", "Right to receive services in either language", "Bilingual federal courts"],
            limitations: ["Not applicable to provincial governments", "Practical limitations in some regions"]
        },
        {
            id: "17",
            section: 17,
            title: "Proceedings of Parliament",
            category: "language",
            text: "Everyone has the right to use English or French in any debates and other proceedings of Parliament.",
            plainLanguage: "You have the right to use English or French in Parliament proceedings.",
            examples: ["Bilingual parliamentary debates", "Right to address Parliament in either language"],
            limitations: ["Practical considerations", "Translation services"]
        },
        {
            id: "18",
            section: 18,
            title: "Parliamentary Statutes and Records",
            category: "language",
            text: "The statutes, records and journals of Parliament shall be printed and published in English and French and both language versions are equally authoritative.",
            plainLanguage: "Federal laws and parliamentary records must be published in both English and French.",
            examples: ["Bilingual federal laws", "Bilingual parliamentary records", "Equal authority of both versions"],
            limitations: ["Translation delays", "Technical terminology challenges"]
        },
        {
            id: "19",
            section: 19,
            title: "Proceedings in Courts Established by Parliament",
            category: "language",
            text: "Either English or French may be used by any person in, or in any pleading in or process issuing from, any court established by Parliament.",
            plainLanguage: "You can use English or French in federal courts.",
            examples: ["Right to use either language in federal court", "Bilingual court proceedings"],
            limitations: ["Not applicable to provincial courts", "Availability of bilingual judges"]
        },
        {
            id: "20",
            section: 20,
            title: "Communications by Public with Federal Institutions",
            category: "language",
            text: "Any member of the public in Canada has the right to communicate with, and to receive available services from, any head or central office of an institution of the Parliament or government of Canada in English or French, and has the same right with respect to any other office of any such institution where there is a significant demand for communications with and services from that office in such language.",
            plainLanguage: "You have the right to communicate with federal government offices in English or French.",
            examples: ["Bilingual government services", "Right to receive services in preferred language"],
            limitations: ["Significant demand requirement", "Practical limitations"]
        },
        {
            id: "21",
            section: 21,
            title: "Continuation of Existing Constitutional Provisions",
            category: "language",
            text: "Nothing in sections 16 to 20 abrogates or derogates from any right, privilege or obligation with respect to the English and French languages, or either of them, that exists or is continued by virtue of any other provision of the Constitution of Canada.",
            plainLanguage: "The language rights in sections 16-20 don't take away from any existing language rights in the Constitution.",
            examples: ["Preservation of existing language rights", "Continuation of constitutional language provisions"],
            limitations: ["Limited to existing rights", "Does not create new rights"]
        },
        {
            id: "22",
            section: 22,
            title: "Rights and Privileges Preserved",
            category: "language",
            text: "Nothing in sections 16 to 20 abrogates or derogates from any legal or customary right or privilege acquired or enjoyed either before or after the coming into force of this Charter with respect to the English and French languages, or either of them, or with respect to any other language.",
            plainLanguage: "The language rights in sections 16-20 don't take away from any existing language rights or privileges.",
            examples: ["Preservation of existing language rights", "Protection of other languages"],
            limitations: ["Limited to existing rights", "Does not create new rights"]
        },
        {
            id: "23",
            section: 23,
            title: "Minority Language Educational Rights",
            category: "language",
            text: "Citizens of Canada who have received their primary school instruction in Canada in English or French and who reside in a province where the language in which they received that instruction is the language of the English or French linguistic minority population of the province have the right to have their children receive primary and secondary school instruction in that language in that province.",
            plainLanguage: "If you were educated in English or French in Canada, your children have the right to be educated in the same language in provinces where that language is the minority language.",
            examples: ["French education in English provinces", "English education in Quebec", "Minority language school rights"],
            limitations: ["Where numbers warrant", "Provincial jurisdiction over education"]
        },
        {
            id: "24",
            section: 24,
            title: "Enforcement",
            category: "legal",
            text: "Anyone whose rights or freedoms, as guaranteed by this Charter, have been infringed or denied may apply to a court of competent jurisdiction to obtain such remedy as the court considers appropriate and just in the circumstances.",
            plainLanguage: "If your Charter rights are violated, you can go to court to get a remedy.",
            examples: ["Charter challenges in court", "Seeking remedies for rights violations", "Judicial review of government actions"],
            limitations: ["Court costs and delays", "Standing requirements", "Remedy discretion"]
        },
        {
            id: "25",
            section: 25,
            title: "General",
            category: "legal",
            text: "The guarantee in this Charter of certain rights and freedoms shall not be construed so as to abrogate or derogate from any aboriginal, treaty or other rights or freedoms that pertain to the aboriginal peoples of Canada including any rights or freedoms that have been recognized by the Royal Proclamation of October 7, 1763; and any rights or freedoms that may be acquired by the aboriginal peoples of Canada by way of land claims settlement.",
            plainLanguage: "The Charter doesn't take away from Aboriginal and treaty rights.",
            examples: ["Protection of treaty rights", "Aboriginal rights preservation", "Land claims settlements"],
            limitations: ["Limited to existing rights", "Does not create new rights"]
        },
        {
            id: "26",
            section: 26,
            title: "Other Rights and Freedoms Not Affected",
            category: "legal",
            text: "The guarantee in this Charter of certain rights and freedoms shall not be construed as denying the existence of any other rights or freedoms that exist in Canada.",
            plainLanguage: "The Charter doesn't deny the existence of other rights and freedoms in Canada.",
            examples: ["Preservation of common law rights", "Protection of other constitutional rights"],
            limitations: ["Limited to existing rights", "Does not create new rights"]
        },
        {
            id: "27",
            section: 27,
            title: "Multicultural Heritage",
            category: "equality",
            text: "This Charter shall be interpreted in a manner consistent with the preservation and enhancement of the multicultural heritage of Canadians.",
            plainLanguage: "The Charter should be interpreted to preserve and enhance Canada's multicultural heritage.",
            examples: ["Protection of cultural practices", "Recognition of diversity", "Multicultural interpretation of rights"],
            limitations: ["Interpretive provision only", "Does not create specific rights"]
        },
        {
            id: "28",
            section: 28,
            title: "Rights Guaranteed Equally to Both Sexes",
            category: "equality",
            text: "Notwithstanding anything in this Charter, the rights and freedoms referred to in it are guaranteed equally to male and female persons.",
            plainLanguage: "All Charter rights are guaranteed equally to men and women.",
            examples: ["Equal rights for men and women", "Gender equality in all Charter rights"],
            limitations: ["Limited to Charter rights", "Does not address other forms of discrimination"]
        },
        {
            id: "29",
            section: 29,
            title: "Rights Respecting Certain Schools Preserved",
            category: "legal",
            text: "Nothing in this Charter abrogates or derogates from any rights or privileges guaranteed by or under the Constitution of Canada in respect of denominational, separate or dissentient schools.",
            plainLanguage: "The Charter doesn't take away from rights related to religious schools.",
            examples: ["Protection of Catholic schools", "Preservation of separate school rights"],
            limitations: ["Limited to existing rights", "Does not create new rights"]
        },
        {
            id: "30",
            section: 30,
            title: "Application to Territories and Territorial Authorities",
            category: "legal",
            text: "A reference in this Charter to a province or to the legislative assembly or legislature of a province shall be deemed to include a reference to the Yukon Territory and the Northwest Territories, or to the appropriate legislative authority thereof, as the case may be.",
            plainLanguage: "Charter references to provinces also apply to territories.",
            examples: ["Territorial application of Charter rights", "Territorial government obligations"],
            limitations: ["Limited to Charter application", "Does not change territorial status"]
        },
        {
            id: "31",
            section: 31,
            title: "Legislative Powers Not Extended",
            category: "legal",
            text: "Nothing in this Charter extends the legislative powers of any body or authority.",
            plainLanguage: "The Charter doesn't give any government body more power to make laws.",
            examples: ["Preservation of federal-provincial division of powers", "No extension of legislative authority"],
            limitations: ["Limited to legislative powers", "Does not affect other powers"]
        },
        {
            id: "32",
            section: 32,
            title: "Application of Charter",
            category: "legal",
            text: "This Charter applies to the Parliament and government of Canada in respect of all matters within the authority of Parliament including all matters relating to the Yukon Territory and Northwest Territories; and to the legislature and government of each province in respect of all matters within the authority of the legislature of each province.",
            plainLanguage: "The Charter applies to federal and provincial governments.",
            examples: ["Federal government obligations", "Provincial government obligations", "Territorial government obligations"],
            limitations: ["Limited to government action", "Does not apply to private individuals"]
        },
        {
            id: "33",
            section: 33,
            title: "Exception Where Express Declaration",
            category: "legal",
            text: "Parliament or the legislature of a province may expressly declare in an Act of Parliament or of the legislature, as the case may be, that the Act or a provision thereof shall operate notwithstanding a provision included in section 2 or sections 7 to 15 of this Charter.",
            plainLanguage: "Parliament or provincial legislatures can override certain Charter rights by explicitly saying so in a law.",
            examples: ["Notwithstanding clause usage", "Legislative override of Charter rights"],
            limitations: ["Limited to specific sections", "Must be explicit declaration", "Five-year limit"]
        },
        {
            id: "34",
            section: 34,
            title: "Citation",
            category: "legal",
            text: "This Part may be cited as the Canadian Charter of Rights and Freedoms.",
            plainLanguage: "This section gives the Charter its official name.",
            examples: ["Official name of the Charter", "Legal citation"],
            limitations: ["Naming provision only", "No substantive rights"]
        }
    ];
    // Get Charter rights
    app.get('/api/rights/charter', async (req, res) => {
        try {
            const { search, category } = req.query;
            let rights = charterRights;
            if (search) {
                const searchTerm = search.toLowerCase();
                rights = rights.filter(right => right.title.toLowerCase().includes(searchTerm) ||
                    right.plainLanguage.toLowerCase().includes(searchTerm) ||
                    right.text.toLowerCase().includes(searchTerm));
            }
            if (category && category !== 'all') {
                rights = rights.filter(right => right.category === category);
            }
            return ResponseFormatter.success(res, rights, "Charter of Rights and Freedoms retrieved successfully", 200, rights.length);
        }
        catch (error) {
            return ResponseFormatter.databaseError(res, `Failed to fetch Charter rights: ${error.message}`);
        }
    });
    // Get rights statistics
    app.get('/api/rights/stats', async (req, res) => {
        try {
            const stats = {
                totalCharterRights: charterRights.length,
                categories: {
                    fundamental: charterRights.filter(r => r.category === 'fundamental').length,
                    democratic: charterRights.filter(r => r.category === 'democratic').length,
                    legal: charterRights.filter(r => r.category === 'legal').length,
                    equality: charterRights.filter(r => r.category === 'equality').length,
                    language: charterRights.filter(r => r.category === 'language').length,
                    mobility: charterRights.filter(r => r.category === 'mobility').length
                },
                lastUpdated: new Date().toISOString()
            };
            return ResponseFormatter.success(res, stats, "Rights statistics retrieved successfully", 200);
        }
        catch (error) {
            return ResponseFormatter.databaseError(res, `Failed to fetch rights statistics: ${error.message}`);
        }
    });
    // Provincial rights (placeholder curated)
    app.get('/api/rights/provincial', async (req, res) => {
        try {
            const { province = 'all' } = req.query;
            const all = [
                { id: 'on-human-rights', province: 'Ontario', title: 'Ontario Human Rights Code', category: 'Human Rights', description: 'Prohibits discrimination in Ontario', plainLanguage: 'Equal treatment and anti-discrimination protections', examples: ['Housing discrimination', 'Employment equity'], relatedCharter: [15] },
                { id: 'qc-charter', province: 'Quebec', title: 'Charter of the French Language', category: 'Language', description: 'French language protections in Quebec', plainLanguage: 'French language rights and obligations', examples: ['Signage rules', 'Workplace language'], relatedCharter: [16] }
            ];
            const filtered = province === 'all' ? all : all.filter(r => r.province === province);
            return ResponseFormatter.success(res, filtered, 'Provincial rights retrieved', 200, filtered.length);
        }
        catch (error) {
            return ResponseFormatter.databaseError(res, `Failed to fetch provincial rights: ${error.message}`);
        }
    });
    // Geolocation to province (very rough ip/user-agent placeholder)
    app.get('/api/location/province', async (req, res) => {
        try {
            // Default to Ontario if unknown to avoid blocking UI
            const province = 'Ontario';
            res.json(province);
        }
        catch {
            res.json('Ontario');
        }
    });
}
