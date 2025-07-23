import { Express, Request, Response } from "express";

export function registerCorruptionRoutes(app: Express) {
  // Corruption API endpoints
  app.get('/api/corruption', async (req: Request, res: Response) => {
    try {
      const { search, category, severity, page = '1', limit = '20' } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      // Mock data for now
      const mockCorruption = [
        {
          id: '1',
          title: 'Contract Favoritism Investigation',
          category: 'Procurement Fraud',
          severity: 'High',
          status: 'Under Investigation',
          dateReported: '2024-01-20',
          description: 'Allegations of preferential treatment in government contracts',
          amount: 2500000,
          location: 'Ottawa, ON',
          involvedParties: ['Government Official A', 'Company B'],
          evidenceLevel: 'Strong',
          publicImpact: 'High'
        },
        {
          id: '2',
          title: 'Misuse of Public Funds',
          category: 'Financial Mismanagement',
          severity: 'Medium',
          status: 'Resolved',
          dateReported: '2023-12-15',
          description: 'Inappropriate use of taxpayer dollars for personal expenses',
          amount: 150000,
          location: 'Toronto, ON',
          involvedParties: ['Official C'],
          evidenceLevel: 'Confirmed',
          publicImpact: 'Medium'
        }
      ];
      
      // Filter by search term
      let filteredCorruption = mockCorruption;
      if (search) {
        const searchLower = (search as string).toLowerCase();
        filteredCorruption = mockCorruption.filter(item => 
          item.title.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower)
        );
      }
      
      // Filter by category
      if (category && category !== 'all') {
        filteredCorruption = filteredCorruption.filter(item => item.category === category);
      }
      
      // Filter by severity
      if (severity && severity !== 'all') {
        filteredCorruption = filteredCorruption.filter(item => item.severity === severity);
      }
      
      // Pagination
      const total = filteredCorruption.length;
      const paginatedCorruption = filteredCorruption.slice(offset, offset + parseInt(limit as string));
      
      res.json({
        corruption: paginatedCorruption,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          pages: Math.ceil(total / parseInt(limit as string))
        }
      });
    } catch (error) {
      console.error('Error fetching corruption data:', error);
      res.status(500).json({ error: 'Failed to fetch corruption data' });
    }
  });
} 