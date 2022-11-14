import {handler} from '../../../src/handlers/get-user-info';
import {APIGatewayProxyEvent} from 'aws-lambda';

describe('get-user-info', () => {
    it('should return a 200 response', async () => {
        const event = {} as APIGatewayProxyEvent;
        const result = await handler(event, null, null) as {statusCode: number};
        expect(result.statusCode).toEqual(200);
    });
});
