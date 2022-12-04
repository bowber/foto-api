import { APIGatewayProxyHandler } from 'aws-lambda';

// TODO: implement
export const handler: APIGatewayProxyHandler = async (event, _context) => {
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Your function executed successfully!',
            input: event,
        }, null, 2),
    };
};