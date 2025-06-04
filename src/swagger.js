// swagger.js
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import User from './models/User.js';
import mongooseToSwagger from 'mongoose-to-swagger'

const userSwaggerSchema = mongooseToSwagger(User);
if (userSwaggerSchema.properties && userSwaggerSchema.properties.accountInfo && userSwaggerSchema.properties.accountInfo.properties) {
  delete userSwaggerSchema.properties.accountInfo.properties.password;
  delete userSwaggerSchema.properties.accountInfo.properties.emailVerified;
  delete userSwaggerSchema.properties.accountInfo.properties.verificationDueBy;
  delete userSwaggerSchema.properties.accountInfo.properties.passResetToken;
  delete userSwaggerSchema.properties.accountInfo.properties.passResetVerifiedToken;
  delete userSwaggerSchema.properties.accountInfo.properties.mfaSecret;
  delete userSwaggerSchema.properties.accountInfo.properties.mfaVerified;
  delete userSwaggerSchema.properties.accountInfo.properties.mfaAttempts;
  delete userSwaggerSchema.properties.accountInfo.properties.mfaStartTime;
}

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SpeedScore API Documentation',
      version: '1.0.0',
      description: 'Swagger documentation for the SpeedScore API.',
    },
    servers: [
      {
        url:  process.env.API_DEPLOYMENT_URL || 'http://localhost:4000'
      },
    ],
    components: {
      schemas: {
        User: userSwaggerSchema,
        ValidationErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'integer',
              example: 400
            },
            error: {
              type: 'string',
              example: 'Validation Error'
            },
            message: {
              type: 'string',
              example: 'Validation failed'
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'email'
                  },
                  message: {
                    type: 'string',
                    example: 'Email is required'
                  }
                }
              }
            }
          }
        },
        GeneralErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'integer',
              example: 500
            },
            error: {
              type: 'string',
              example: 'Internal Server Error'
            },
            message: {
              type: 'string',
              example: 'An unexpected error occurred.'
            }
          }
        },
        InvalidJsonErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'integer',
              example: 400
            },
            error: {
              type: 'string',
              example: 'Invalid JSON'
            },
            message: {
              type: 'string',
              example: 'Invalid JSON in message body'
            }
          }
        },
        InvalidIdFormatErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'integer',
              example: 400
            },
            error: {
              type: 'string',
              example: 'Invalid ID Format'
            },
            message: {
              type: 'string',
              example: 'Invalid ID format'
            }
          }
        },
        DuplicateKeyErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'integer',
              example: 409
            },
            error: {
              type: 'string',
              example: 'Duplicate Key Error'
            },
            message: {
              type: 'string',
              example: 'A user with that email already exists'
            }
          }
        },
        CustomErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'integer',
              example: 400
            },
            error: {
              type: 'string',
              example: 'Custom Error'
            },
            message: {
              type: 'string',
              example: 'Custom error message'
            }
          }
        },
        UnauthorizedErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'integer',
              example: 401
            },
            error: {
              type: 'string',
              example: 'Invalid access token'
            },
            message: {
              type: 'string',
              example: 'Invalid access token'
            }
          }
        },
        ForbiddenErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'integer',
              example: 403
            },
            error: {
              type: 'string',
              example: 'Invalid anti-CSRF token'
            },
            message: {
              type: 'string',
              example: 'Invalid anti-CSRF token'
            }
          }
        },
        NotFoundErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'integer',
              example: 404
            },
            error: {
              type: 'string',
              example: 'Not Found'
            },
            message: {
              type: 'string',
              example: 'User not found'
            }
          }
        },
        TooManyRequestsErrorResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'integer',
              example: 429
            },
            error: {
              type: 'string',
              example: 'Too many requests'
            },
            message: {
              type: 'string',
              example: 'Too many requests, please try again later.'
            }
          }
        }
      },
      responses: {
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationErrorResponse'
              }
            }
          }
        },
        GeneralError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/GeneralErrorResponse'
              }
            }
          }
        },
        InvalidJsonError: {
          description: 'Invalid JSON error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/InvalidJsonErrorResponse'
              }
            }
          }
        },
        InvalidIdFormatError: {
          description: 'Invalid ID format error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/InvalidIdFormatErrorResponse'
              }
            }
          }
        },
        DuplicateKeyError: {
          description: 'Duplicate key error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/DuplicateKeyErrorResponse'
              }
            }
          }
        },
        CustomError: {
          description: 'Custom error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CustomErrorResponse'
              }
            }
          }
        },
        UnauthorizedError: {
          description: 'Unauthorized error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UnauthorizedErrorResponse'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Forbidden error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ForbiddenErrorResponse'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Not Found error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NotFoundErrorResponse'
              }
            }
          } 
        },
        TooManyRequestsError: {
          description: 'Too many requests',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TooManyRequestsErrorResponse'
              }
            }
          }
        }
      },
      securitySchemes: {
        cookieAuthAccessToken: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
          description: 'HTTP-only cookie containing the JWT access token.'
        },
        cookieAuthRefreshToken: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
          description: 'HTTP-only cookie containing the JWT refresh token.'
        },
        antiCsrfToken: {
          type: 'apiKey',
          in: 'header',
          name: 'x-anti-csrf-token',
          description: 'Anti-CSRF token required for security.'
        }
      }
    },
    security: [
      {
        cookieAuthAccessToken: [],
        cookieAuthRefreshToken: [],
        antiCsrfToken: []
      }
    ],
  },
  apis: ['./src/routes/*.js'] // Path to the API docs from project root directory
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec,
    {
      customSiteTitle: 'SpeedScore API Documentation'
    }
  ));
};

export default setupSwagger;