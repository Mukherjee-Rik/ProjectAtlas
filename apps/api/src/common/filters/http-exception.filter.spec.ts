import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: {
    status: jest.Mock;
    json: jest.Mock;
  };
  let mockRequest: {
    url: string;
  };
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/api/v1/test',
    };

    mockArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should format HttpException with string response correctly', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 403,
        path: '/api/v1/test',
        error: 'Forbidden',
      }),
    );
  });

  it('should format HttpException with object response message array correctly', () => {
    const exception = new HttpException(
      { message: ['name is required', 'email is invalid'] },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 400,
        path: '/api/v1/test',
        error: ['name is required', 'email is invalid'],
      }),
    );
  });

  it('should format non-HttpException as 500 Internal Server Error', () => {
    const exception = new Error('Database connection failed');

    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 500,
        path: '/api/v1/test',
        error: 'Internal server error',
      }),
    );
  });
});
