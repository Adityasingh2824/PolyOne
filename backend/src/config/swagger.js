const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./env');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PolyOne API',
      version: '1.0.0',
      description: 'PolyOne - Polygon App Chain Launcher API Documentation',
      contact: {
        name: 'PolyOne Support',
        email: 'support@polyone.io'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}`,
        description: 'Development server'
      },
      {
        url: 'https://api.polyone.io',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /api/auth/login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Error message'
                },
                code: {
                  type: 'string',
                  example: 'ERROR_CODE'
                },
                requestId: {
                  type: 'string',
                  example: 'uuid-request-id'
                }
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object'
            }
          }
        },
        Chain: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            name: {
              type: 'string',
              example: 'My Chain'
            },
            status: {
              type: 'string',
              enum: ['pending', 'deploying', 'active', 'paused', 'error', 'deleted'],
              example: 'active'
            },
            user_id: {
              type: 'string',
              example: 'user-wallet-address'
            },
            network: {
              type: 'string',
              example: 'polygon-amoy'
            },
            created_at: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            username: {
              type: 'string'
            },
            wallet_address: {
              type: 'string'
            },
            role: {
              type: 'string',
              enum: ['super_admin', 'admin', 'user', 'viewer']
            }
          }
        }
      },
      responses: {
        ValidationError: {
          description: 'Validation error',
          content: {
            application/json: {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Validation failed'
                  },
                  errors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        msg: { type: 'string' },
                        param: { type: 'string' },
                        location: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        UnauthorizedError: {
          description: 'Unauthorized',
          content: {
            application/json: {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            application/json: {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Chains',
        description: 'Chain management endpoints'
      },
      {
        name: 'Validators',
        description: 'Validator management endpoints'
      },
      {
        name: 'Monitoring',
        description: 'Chain monitoring and metrics endpoints'
      },
      {
        name: 'Billing',
        description: 'Billing and subscription endpoints'
      },
      {
        name: 'Notifications',
        description: 'User notification endpoints'
      },
      {
        name: 'Health',
        description: 'Health check endpoints'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/server.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;




















