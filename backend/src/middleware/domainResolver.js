const db = require('../services/database');

/**
 * Middleware to resolve custom domain and inject white-label settings
 */
async function domainResolver(req, res, next) {
  const host = req.get('host');
  
  // Skip if localhost or default domain
  if (host.includes('localhost') || host.includes('127.0.0.1') || host === process.env.DEFAULT_DOMAIN) {
    return next();
  }

  try {
    // Try to find organization by custom domain
    const org = await db.getOrganizationByDomain(host);
    
    if (org) {
      // Attach organization and white-label settings to request
      req.organization = org;
      req.whiteLabelSettings = await db.getWhiteLabelSettings(org.id);
    }
  } catch (error) {
    console.error('Error resolving domain:', error);
    // Continue without white-label settings if there's an error
  }

  next();
}

module.exports = domainResolver;






















