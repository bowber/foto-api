import { APIGatewayProxyHandler } from 'aws-lambda';

export const handler: APIGatewayProxyHandler = async (event, _context) => {
    console.log(`Event: ${JSON.stringify(event, null, 2)}`);
    console.log(`Context: ${JSON.stringify(_context, null, 2)}`);
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Your function executed successfully!',
            input: event,
        }, null, 2),
    };
};