import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DriveMate API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for DriveMate ride-sharing platform',
      contact: {
        name: 'DriveMate Support',
        email: 'support@drivemate.com',
      },
    },
    servers: [
      {
        url: 'https://drivemate.api.luisant.cloud',
        description: 'Production server',
      },
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Admin Auth', description: 'Admin authentication endpoints' },
      { name: 'Driver Auth', description: 'Driver authentication endpoints' },
      { name: 'Customer Auth', description: 'Customer authentication endpoints' },
      { name: 'Admin', description: 'Admin management endpoints' },
      { name: 'Driver', description: 'Driver management endpoints' },
      { name: 'Booking', description: 'Booking management endpoints' },
      { name: 'Booking Workflow', description: 'Booking workflow and allocation endpoints' },
      { name: 'Trip', description: 'Trip management endpoints' },
      { name: 'Package', description: 'Package management endpoints' },
      { name: 'Subscription', description: 'Subscription management endpoints' },
      { name: 'Maps', description: 'Maps and location endpoints' },
      { name: 'Upload', description: 'File upload endpoints' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' },
            advancePayment: { type: 'number' },
          },
        },
        Driver: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            vehicleNo: { type: 'string' },
            vehicleType: { type: 'string' },
            status: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] },
            isOnline: { type: 'boolean' },
            packageType: { type: 'string', enum: ['LOCAL', 'OUTSTATION', 'ALL_PREMIUM'] },
            rating: { type: 'number' },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            customerId: { type: 'string' },
            pickupLocation: { type: 'string' },
            dropLocation: { type: 'string' },
            bookingType: { type: 'string' },
            startDateTime: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'ONGOING', 'COMPLETED', 'CANCELLED'] },
            estimateAmount: { type: 'number' },
          },
        },
        Trip: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            customerId: { type: 'string' },
            driverId: { type: 'string' },
            fromLocation: { type: 'string' },
            toLocation: { type: 'string' },
            packageType: { type: 'string', enum: ['LOCAL', 'OUTSTATION', 'ALL_PREMIUM'] },
            status: { type: 'string', enum: ['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'] },
            totalAmount: { type: 'number' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

export default swaggerJsdoc(options);
