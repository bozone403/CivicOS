export function registerCasesRoutes(app) {
    // Cases API endpoints
    app.get('/api/cases', async (req, res) => {
        try {
            const { search, court, category, page = '1', limit = '20' } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);
            // Mock data for now
            const mockCases = [
                {
                    id: '1',
                    title: 'R. v. Smith',
                    court: 'Supreme Court of Canada',
                    category: 'Criminal Law',
                    status: 'Active',
                    dateFiled: '2024-01-10',
                    description: 'Constitutional challenge regarding privacy rights',
                    parties: ['Crown', 'Defendant Smith'],
                    judge: 'Justice Johnson',
                    outcome: 'Pending',
                    significance: 'High',
                    legalPrinciples: ['Privacy Rights', 'Constitutional Law']
                },
                {
                    id: '2',
                    title: 'Doe v. Government of Canada',
                    court: 'Federal Court',
                    category: 'Administrative Law',
                    status: 'Resolved',
                    dateFiled: '2023-11-15',
                    description: 'Judicial review of administrative decision',
                    parties: ['Plaintiff Doe', 'Government of Canada'],
                    judge: 'Justice Williams',
                    outcome: 'Appeal Allowed',
                    significance: 'Medium',
                    legalPrinciples: ['Administrative Law', 'Judicial Review']
                }
            ];
            // Filter by search term
            let filteredCases = mockCases;
            if (search) {
                const searchLower = search.toLowerCase();
                filteredCases = mockCases.filter(item => item.title.toLowerCase().includes(searchLower) ||
                    item.court.toLowerCase().includes(searchLower) ||
                    item.description.toLowerCase().includes(searchLower));
            }
            // Filter by court
            if (court && court !== 'all') {
                filteredCases = filteredCases.filter(item => item.court === court);
            }
            // Filter by category
            if (category && category !== 'all') {
                filteredCases = filteredCases.filter(item => item.category === category);
            }
            // Pagination
            const total = filteredCases.length;
            const paginatedCases = filteredCases.slice(offset, offset + parseInt(limit));
            res.json({
                cases: paginatedCases,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            });
        }
        catch (error) {
            console.error('Error fetching cases data:', error);
            res.status(500).json({ error: 'Failed to fetch cases data' });
        }
    });
}
