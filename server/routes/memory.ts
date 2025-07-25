import { Express, Request, Response } from "express";

export function registerMemoryRoutes(app: Express) {
  // Memory API endpoints
  app.get('/api/memory', async (req: Request, res: Response) => {
    try {
      const { search, timeframe, page = '1', limit = '20' } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      // Production data fetching - integrate with real government APIs
      // This would connect to parliamentary records, election platforms, etc.
      const memory = await fetchMemoryData({
        search: search as string,
        timeframe: timeframe as string,
        offset,
        limit: parseInt(limit as string)
      });
      
      res.json({
        memory: memory.data,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: memory.total,
          pages: Math.ceil(memory.total / parseInt(limit as string))
        }
      });
    } catch (error) {
      // console.error removed for production
      res.status(500).json({ error: 'Failed to fetch memory data' });
    }
  });
}

async function fetchMemoryData(params: {
  search?: string;
  timeframe?: string;
  offset: number;
  limit: number;
}) {
  // Production implementation would:
  // 1. Connect to parliamentary Hansard records
  // 2. Query election platform databases
  // 3. Access government commitment tracking systems
  // 4. Return real, verified promise data
  
  // Sample political memory data for demonstration
  const sampleMemoryData = [
    {
      id: 1,
      politician: "Hon. Justin Trudeau",
      promise: "Implement universal pharmacare by 2025",
      date: "2023-10-15",
      status: "in_progress",
      category: "Healthcare",
      source: "2023 Election Platform",
      progress: 65,
      notes: "Legislation introduced, awaiting parliamentary approval"
    },
    {
      id: 2,
      politician: "Hon. Pierre Poilievre",
      promise: "Balance the federal budget within 4 years",
      date: "2023-09-20",
      status: "pending",
      category: "Economy",
      source: "Conservative Party Platform",
      progress: 0,
      notes: "Campaign promise, not yet in government"
    },
    {
      id: 3,
      politician: "Hon. Jagmeet Singh",
      promise: "Implement wealth tax on fortunes over $10M",
      date: "2023-11-05",
      status: "proposed",
      category: "Taxation",
      source: "NDP Policy Platform",
      progress: 25,
      notes: "Bill introduced in Parliament, under debate"
    },
    {
      id: 4,
      politician: "Hon. Chrystia Freeland",
      promise: "Reduce inflation to 2% target by end of 2024",
      date: "2023-08-12",
      status: "completed",
      category: "Economy",
      source: "Budget 2023",
      progress: 100,
      notes: "Target achieved, inflation at 1.8% as of December 2024"
    },
    {
      id: 5,
      politician: "Hon. Mark Holland",
      promise: "Increase healthcare funding by $46B over 10 years",
      date: "2023-07-30",
      status: "in_progress",
      category: "Healthcare",
      source: "Health Accord Agreement",
      progress: 40,
      notes: "First tranche of funding delivered, negotiations ongoing"
    }
  ];
  
  // Filter by search term if provided
  let filteredData = sampleMemoryData;
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filteredData = sampleMemoryData.filter(item => 
      item.politician.toLowerCase().includes(searchLower) ||
      item.promise.toLowerCase().includes(searchLower) ||
      item.category.toLowerCase().includes(searchLower)
    );
  }
  
  // Apply pagination
  const paginatedData = filteredData.slice(params.offset, params.offset + params.limit);
  
  return {
    data: paginatedData,
    total: filteredData.length
  };
} 