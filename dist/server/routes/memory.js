export function registerMemoryRoutes(app) {
    // Memory API endpoints
    app.get('/api/memory', async (req, res) => {
        try {
            const { search, timeframe, page = '1', limit = '20' } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);
            // Mock data for now
            const mockMemory = [
                {
                    id: '1',
                    title: 'Climate Action Plan 2024',
                    politician: 'Justin Trudeau',
                    party: 'Liberal',
                    promise: 'Reduce emissions by 40% by 2030',
                    status: 'In Progress',
                    progress: 65,
                    dateMade: '2024-01-15',
                    deadline: '2030-12-31',
                    category: 'Environment'
                },
                {
                    id: '2',
                    title: 'Healthcare System Reform',
                    politician: 'Jagmeet Singh',
                    party: 'NDP',
                    promise: 'Universal pharmacare by 2025',
                    status: 'Not Started',
                    progress: 0,
                    dateMade: '2024-02-10',
                    deadline: '2025-12-31',
                    category: 'Healthcare'
                }
            ];
            // Filter by search term
            let filteredMemory = mockMemory;
            if (search) {
                const searchLower = search.toLowerCase();
                filteredMemory = mockMemory.filter(item => item.title.toLowerCase().includes(searchLower) ||
                    item.politician.toLowerCase().includes(searchLower) ||
                    item.promise.toLowerCase().includes(searchLower));
            }
            // Filter by timeframe
            if (timeframe && timeframe !== 'all') {
                const now = new Date();
                const timeframeMap = {
                    'recent': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days
                    'year': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000), // 1 year
                    'term': new Date(now.getTime() - 4 * 365 * 24 * 60 * 60 * 1000) // 4 years
                };
                if (timeframeMap[timeframe]) {
                    const cutoffDate = timeframeMap[timeframe];
                    filteredMemory = filteredMemory.filter(item => new Date(item.dateMade) >= cutoffDate);
                }
            }
            // Pagination
            const total = filteredMemory.length;
            const paginatedMemory = filteredMemory.slice(offset, offset + parseInt(limit));
            res.json({
                memory: paginatedMemory,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            });
        }
        catch (error) {
            console.error('Error fetching memory data:', error);
            res.status(500).json({ error: 'Failed to fetch memory data' });
        }
    });
}
