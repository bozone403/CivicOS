import { jwtAuth } from "./auth.js";
export function registerWhistleblowerRoutes(app) {
    // Get whistleblower protection information
    app.get('/api/whistleblower/protection', async (req, res) => {
        try {
            const protectionInfo = {
                legalFramework: {
                    title: "Legal Protection Framework",
                    description: "Canada has comprehensive whistleblower protection laws at both federal and provincial levels.",
                    federalLaws: [
                        "Public Servants Disclosure Protection Act (PSDPA)",
                        "Criminal Code protections",
                        "Canada Labour Code"
                    ],
                    provincialLaws: [
                        "Ontario: Public Interest Disclosure Act",
                        "Quebec: Loi sur la protection des dénonciateurs",
                        "British Columbia: Public Interest Disclosure Act"
                    ]
                },
                rights: [
                    "Right to report wrongdoing without fear of reprisal",
                    "Right to confidentiality and anonymity",
                    "Right to legal representation",
                    "Right to protection from retaliation",
                    "Right to compensation for damages"
                ],
                protections: [
                    "Protection from dismissal",
                    "Protection from demotion",
                    "Protection from harassment",
                    "Protection from discrimination",
                    "Protection from blacklisting"
                ],
                reportingChannels: [
                    "Internal reporting mechanisms",
                    "External oversight bodies",
                    "Law enforcement agencies",
                    "Media organizations (with proper safeguards)",
                    "Whistleblower protection offices"
                ]
            };
            res.json({
                success: true,
                protectionInfo
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch whistleblower protection information"
            });
        }
    });
    // Get whistleblower support resources
    app.get('/api/whistleblower/support', async (req, res) => {
        try {
            const supportResources = {
                organizations: [
                    {
                        name: "Public Sector Integrity Commissioner",
                        description: "Federal oversight body for public sector whistleblowing",
                        website: "https://www.psic-ispc.gc.ca",
                        phone: "1-800-557-0334",
                        jurisdiction: "Federal"
                    },
                    {
                        name: "Canadian Centre for Policy Alternatives",
                        description: "Research and advocacy organization supporting whistleblowers",
                        website: "https://www.policyalternatives.ca",
                        phone: "1-613-563-1341",
                        jurisdiction: "National"
                    },
                    {
                        name: "Whistleblower Security",
                        description: "International organization providing whistleblower support",
                        website: "https://whistleblowersecurity.com",
                        phone: "1-604-688-5111",
                        jurisdiction: "International"
                    }
                ],
                legalAid: [
                    {
                        name: "Legal Aid Ontario",
                        description: "Free legal services for eligible individuals",
                        website: "https://www.legalaid.on.ca",
                        phone: "1-800-668-8258"
                    },
                    {
                        name: "Pro Bono Law Ontario",
                        description: "Free legal services from volunteer lawyers",
                        website: "https://www.probonoontario.org",
                        phone: "1-416-979-1446"
                    }
                ],
                counseling: [
                    {
                        name: "Canadian Mental Health Association",
                        description: "Mental health support and counseling",
                        website: "https://cmha.ca",
                        phone: "1-800-875-6213"
                    },
                    {
                        name: "Employee Assistance Programs",
                        description: "Workplace mental health support",
                        website: "Varies by employer",
                        phone: "Check with your employer"
                    }
                ]
            };
            res.json({
                success: true,
                supportResources
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch whistleblower support resources"
            });
        }
    });
    // Get whistleblower reporting guidelines
    app.get('/api/whistleblower/guidelines', async (req, res) => {
        try {
            const reportingGuidelines = {
                beforeReporting: [
                    "Document everything - keep detailed records",
                    "Understand your organization's internal reporting procedures",
                    "Know your legal rights and protections",
                    "Consider consulting with a lawyer",
                    "Ensure you have evidence to support your allegations"
                ],
                duringReporting: [
                    "Follow proper reporting channels",
                    "Maintain confidentiality when possible",
                    "Keep copies of all communications",
                    "Document any retaliation or threats",
                    "Seek legal advice if needed"
                ],
                afterReporting: [
                    "Monitor for retaliation",
                    "Document any adverse actions",
                    "Maintain professional relationships",
                    "Seek support from colleagues or organizations",
                    "Consider joining whistleblower support groups"
                ],
                evidenceCollection: [
                    "Emails and written communications",
                    "Financial records and documents",
                    "Photographs and videos",
                    "Witness statements",
                    "Internal memos and reports"
                ],
                commonMistakes: [
                    "Reporting without evidence",
                    "Violating confidentiality agreements",
                    "Making allegations publicly before proper channels",
                    "Not documenting retaliation",
                    "Failing to seek legal advice"
                ]
            };
            res.json({
                success: true,
                reportingGuidelines
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch whistleblower reporting guidelines"
            });
        }
    });
    // Get whistleblower case studies
    app.get('/api/whistleblower/cases', async (req, res) => {
        try {
            const caseStudies = [
                {
                    id: 1,
                    title: "Phoenix Pay System Whistleblower",
                    description: "A public servant reported serious issues with the Phoenix pay system implementation",
                    outcome: "Led to parliamentary investigation and system overhaul",
                    lessons: [
                        "Importance of early reporting",
                        "Value of technical expertise",
                        "Need for proper oversight"
                    ],
                    year: 2016
                },
                {
                    id: 2,
                    title: "SNC-Lavalin Scandal",
                    description: "Multiple whistleblowers reported political interference in criminal prosecution",
                    outcome: "Led to ethics commissioner investigation and political consequences",
                    lessons: [
                        "Political pressure can affect justice",
                        "Multiple sources strengthen cases",
                        "Media attention can protect whistleblowers"
                    ],
                    year: 2019
                },
                {
                    id: 3,
                    title: "WE Charity Controversy",
                    description: "Public servants reported concerns about government contract award process",
                    outcome: "Led to parliamentary committee investigation",
                    lessons: [
                        "Process transparency is crucial",
                        "Conflicts of interest must be disclosed",
                        "Public scrutiny provides protection"
                    ],
                    year: 2020
                }
            ];
            res.json({
                success: true,
                caseStudies
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch whistleblower case studies"
            });
        }
    });
    // Submit whistleblower report (protected endpoint)
    app.post('/api/whistleblower/report', jwtAuth, async (req, res) => {
        try {
            const userId = req.user?.id;
            const { title, description, organization, evidence, category, urgency, anonymous } = req.body;
            // Validate required fields
            if (!title || !description || !organization) {
                return res.status(400).json({
                    success: false,
                    message: "Title, description, and organization are required"
                });
            }
            // In a real implementation, this would:
            // 1. Store the report securely
            // 2. Assign case number
            // 3. Notify appropriate authorities
            // 4. Provide whistleblower with case tracking info
            // 5. Ensure confidentiality
            const reportId = Date.now().toString();
            const caseNumber = `WB-${reportId}`;
            // For now, return success with case number
            res.status(201).json({
                success: true,
                message: "Whistleblower report submitted successfully",
                caseNumber,
                reportId,
                nextSteps: [
                    "Your report has been received and assigned a case number",
                    "You will be contacted within 48 hours by an investigator",
                    "Keep your case number confidential",
                    "Document any retaliation or threats",
                    "Consider seeking legal advice"
                ],
                contactInfo: {
                    caseManager: "To be assigned",
                    phone: "1-800-555-0123",
                    email: `case-${caseNumber}@whistleblower.gov.ca`
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to submit whistleblower report"
            });
        }
    });
    // Get whistleblower report status
    app.get('/api/whistleblower/report/:caseNumber', jwtAuth, async (req, res) => {
        try {
            const { caseNumber } = req.params;
            const userId = req.user?.id;
            // In a real implementation, this would:
            // 1. Verify user has access to this case
            // 2. Return current status and updates
            // 3. Provide timeline and next steps
            // Mock response for now
            const reportStatus = {
                caseNumber,
                status: "Under Investigation",
                submittedDate: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                investigator: "John Smith",
                timeline: [
                    {
                        date: new Date().toISOString(),
                        event: "Report submitted",
                        description: "Initial report received and assigned case number"
                    },
                    {
                        date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
                        event: "Investigation begins",
                        description: "Investigator assigned and initial review started"
                    }
                ],
                nextSteps: [
                    "Evidence collection and analysis",
                    "Witness interviews",
                    "Legal review",
                    "Final report preparation"
                ],
                estimatedCompletion: "3-6 months"
            };
            res.json({
                success: true,
                reportStatus
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch report status"
            });
        }
    });
    // Get whistleblower FAQ
    app.get('/api/whistleblower/faq', async (req, res) => {
        try {
            const faq = [
                {
                    question: "What is whistleblowing?",
                    answer: "Whistleblowing is the act of reporting wrongdoing, illegal activities, or unethical behavior within an organization to authorities who can take action."
                },
                {
                    question: "Am I protected if I report wrongdoing?",
                    answer: "Yes, Canadian law provides comprehensive protection for whistleblowers, including protection from retaliation, dismissal, and harassment."
                },
                {
                    question: "Can I report anonymously?",
                    answer: "Yes, you can report anonymously in many cases, though providing your identity may strengthen the investigation and your legal protections."
                },
                {
                    question: "What should I do if I face retaliation?",
                    answer: "Document all incidents, report them immediately to authorities, and seek legal advice. Retaliation is illegal and can result in additional penalties."
                },
                {
                    question: "How long does an investigation take?",
                    answer: "Investigation timelines vary depending on complexity, but typically range from 3-12 months. You will be kept informed of progress."
                },
                {
                    question: "Do I need a lawyer?",
                    answer: "While not required, consulting with a lawyer experienced in whistleblower protection is highly recommended to understand your rights and options."
                }
            ];
            res.json({
                success: true,
                faq
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: "Failed to fetch whistleblower FAQ"
            });
        }
    });
}
