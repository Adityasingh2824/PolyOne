const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('./database');

// Load templates from file
async function loadTemplates() {
  try {
    // Try multiple possible paths (relative to backend directory and project root)
    const possiblePaths = [
      path.join(__dirname, '../../config/chain-templates.json'), // From backend/src/services -> backend/config
      path.join(__dirname, '../../../config/chain-templates.json'), // From backend/src/services -> config
      path.join(process.cwd(), 'config/chain-templates.json'), // From project root
      path.join(process.cwd(), '../config/chain-templates.json'), // From backend -> config
      path.resolve(process.cwd(), '..', 'config', 'chain-templates.json') // Absolute from backend
    ];
    
    let templatesPath = null;
    let foundPath = null;
    
    for (const testPath of possiblePaths) {
      try {
        await fs.access(testPath);
        templatesPath = testPath;
        foundPath = testPath;
        console.log('✅ Found templates file at:', testPath);
        break;
      } catch (e) {
        // Path doesn't exist, try next
        console.log('❌ Templates file not found at:', testPath);
      }
    }
    
    if (!templatesPath) {
      console.warn('⚠️ Templates file not found in any of the expected locations. Using default templates.');
      console.warn('Searched paths:', possiblePaths);
      return getDefaultTemplates(); // Return default templates if file not found
    }
    
    const data = await fs.readFile(templatesPath, 'utf8');
    const config = JSON.parse(data);
    const templates = config.templates || [];
    
    console.log(`✅ Loaded ${templates.length} templates from ${foundPath}`);
    
    // Ensure all templates have required fields
    return templates.map(template => ({
      ...template,
      stats: template.stats || { deployments: 0, rating: 0, reviews: 0 },
      tags: template.tags || [],
      icon: template.icon || '🔗',
      isOfficial: template.isOfficial !== undefined ? template.isOfficial : true,
      isCommunity: template.isCommunity !== undefined ? template.isCommunity : false,
      recommended: template.recommended !== undefined ? template.recommended : false,
      category: template.category || 'general',
      author: template.author || 'PolyOne',
      createdAt: template.createdAt || new Date().toISOString()
    }));
  } catch (error) {
    console.error('❌ Error loading templates:', error);
    console.error('Error stack:', error.stack);
    return getDefaultTemplates(); // Return default templates on error
  }
}

// Default templates if file can't be loaded
function getDefaultTemplates() {
  return [
    {
      id: 'gaming-optimized',
      name: 'Gaming Chain',
      category: 'gaming',
      description: 'High-performance chain optimized for gaming applications with low latency and high throughput',
      author: 'PolyOne',
      isOfficial: true,
      isCommunity: false,
      recommended: true,
      tags: ['gaming', 'low-latency', 'high-throughput', 'optimistic'],
      icon: '🎮',
      config: {
        chainType: 'public',
        rollupType: 'optimistic-rollup',
        validatorAccess: 'public',
        gasToken: 'POL',
        initialValidators: 5,
        blockTime: 1,
        gasLimit: 50000000,
        consensus: 'PoS',
        dataAvailability: 'rollup',
        features: {
          fastFinality: true,
          lowGasCosts: true,
          highTPS: true,
          gamingOptimized: true
        }
      },
      pricing: {
        setupFee: 399,
        monthlyHosting: 249,
        validatorCost: 40
      },
      stats: {
        deployments: 0,
        rating: 0,
        reviews: 0
      },
      createdAt: new Date().toISOString()
    },
    {
      id: 'defi-zkrollup',
      name: 'DeFi Chain',
      category: 'defi',
      description: 'Secure zkRollup chain optimized for DeFi applications with instant finality',
      author: 'PolyOne',
      isOfficial: true,
      isCommunity: false,
      recommended: true,
      tags: ['defi', 'security', 'zk-rollup', 'instant-finality'],
      icon: '💱',
      config: {
        chainType: 'public',
        rollupType: 'zk-rollup',
        validatorAccess: 'public',
        gasToken: 'POL',
        initialValidators: 7,
        blockTime: 2,
        gasLimit: 30000000,
        consensus: 'PoS',
        dataAvailability: 'rollup',
        features: {
          instantFinality: true,
          highSecurity: true,
          defiOptimized: true,
          bridgeSupport: true
        }
      },
      pricing: {
        setupFee: 599,
        monthlyHosting: 399,
        validatorCost: 60
      },
      stats: {
        deployments: 0,
        rating: 0,
        reviews: 0
      },
      createdAt: new Date().toISOString()
    },
    {
      id: 'nft-marketplace',
      name: 'NFT Marketplace Chain',
      category: 'nft',
      description: 'Optimized chain for NFT marketplaces with low minting costs and fast transactions',
      author: 'PolyOne',
      isOfficial: true,
      isCommunity: false,
      recommended: true,
      tags: ['nft', 'marketplace', 'low-cost', 'fast'],
      icon: '🖼️',
      config: {
        chainType: 'public',
        rollupType: 'optimistic-rollup',
        validatorAccess: 'public',
        gasToken: 'POL',
        initialValidators: 5,
        blockTime: 1,
        gasLimit: 40000000,
        consensus: 'PoS',
        dataAvailability: 'rollup',
        features: {
          lowMintingCosts: true,
          fastTransactions: true,
          nftOptimized: true,
          metadataSupport: true
        }
      },
      pricing: {
        setupFee: 349,
        monthlyHosting: 199,
        validatorCost: 35
      },
      stats: {
        deployments: 0,
        rating: 0,
        reviews: 0
      },
      createdAt: new Date().toISOString()
    },
    {
      id: 'enterprise-zkrollup',
      name: 'Enterprise Chain',
      category: 'enterprise',
      description: 'Full-featured enterprise chain with advanced security, governance, and SLA guarantees',
      author: 'PolyOne',
      isOfficial: true,
      isCommunity: false,
      recommended: true,
      tags: ['enterprise', 'security', 'governance', 'sla'],
      icon: '🏢',
      config: {
        chainType: 'permissioned',
        rollupType: 'zk-rollup',
        validatorAccess: 'permissioned',
        gasToken: 'POL',
        initialValidators: 10,
        blockTime: 2,
        gasLimit: 40000000,
        consensus: 'PoA',
        dataAvailability: 'rollup',
        features: {
          customGovernance: true,
          privateTransactions: true,
          advancedMonitoring: true,
          slaGuarantees: true,
          compliance: true
        }
      },
      pricing: {
        setupFee: 2999,
        monthlyHosting: 1499,
        validatorCost: 150
      },
      stats: {
        deployments: 0,
        rating: 0,
        reviews: 0
      },
      createdAt: new Date().toISOString()
    }
  ];
}

// Get all templates
async function getAllTemplates(filters = {}) {
  let templates = await loadTemplates();
  
  // Load community templates from database if available
  // In production, this would query a templates table
  const communityTemplates = [];
  templates = [...templates, ...communityTemplates];

  // Apply filters
  if (filters.category) {
    templates = templates.filter(t => t.category === filters.category);
  }

  if (filters.isOfficial !== undefined) {
    templates = templates.filter(t => t.isOfficial === filters.isOfficial);
  }

  if (filters.isCommunity !== undefined) {
    templates = templates.filter(t => t.isCommunity === filters.isCommunity);
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    templates = templates.filter(t => 
      t.name.toLowerCase().includes(searchLower) ||
      t.description.toLowerCase().includes(searchLower) ||
      (t.tags && t.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
  }

  if (filters.minRating) {
    templates = templates.filter(t => (t.stats?.rating || 0) >= filters.minRating);
  }

  // Sort by recommended, then by rating, then by deployments
  templates.sort((a, b) => {
    if (a.recommended && !b.recommended) return -1;
    if (!a.recommended && b.recommended) return 1;
    if ((b.stats?.rating || 0) !== (a.stats?.rating || 0)) {
      return (b.stats?.rating || 0) - (a.stats?.rating || 0);
    }
    return (b.stats?.deployments || 0) - (a.stats?.deployments || 0);
  });

  return templates;
}

// Get template by ID
async function getTemplateById(templateId) {
  const templates = await getAllTemplates();
  return templates.find(t => t.id === templateId);
}

// Get templates by category
async function getTemplatesByCategory(category) {
  return getAllTemplates({ category });
}

// Create community template
async function createCommunityTemplate(templateData, userId) {
  const template = {
    id: uuidv4(),
    ...templateData,
    author: userId,
    isOfficial: false,
    isCommunity: true,
    stats: {
      deployments: 0,
      rating: 0,
      reviews: 0
    },
    createdAt: new Date().toISOString(),
    status: 'pending' // pending, approved, rejected
  };

  // In production, save to database
  // await db.createTemplate(template);

  return template;
}

// Update template stats (deployments, ratings)
async function updateTemplateStats(templateId, updates) {
  // In production, update in database
  // await db.updateTemplateStats(templateId, updates);
  return true;
}

// Rate template
async function rateTemplate(templateId, userId, rating, review) {
  // In production, save rating to database
  // await db.createTemplateRating({
  //   template_id: templateId,
  //   user_id: userId,
  //   rating,
  //   review,
  //   created_at: new Date().toISOString()
  // });

  // Update template average rating
  // const template = await getTemplateById(templateId);
  // const newRating = calculateAverageRating(templateId);
  // await updateTemplateStats(templateId, { rating: newRating });

  return { success: true, rating, review };
}

// Get template reviews
async function getTemplateReviews(templateId, limit = 10) {
  // In production, query from database
  // return await db.getTemplateReviews(templateId, limit);
  return [];
}

// Increment deployment count
async function incrementDeploymentCount(templateId) {
  // In production, increment in database
  // await db.incrementTemplateDeployments(templateId);
  return true;
}

module.exports = {
  getAllTemplates,
  getTemplateById,
  getTemplatesByCategory,
  createCommunityTemplate,
  updateTemplateStats,
  rateTemplate,
  getTemplateReviews,
  incrementDeploymentCount
};

