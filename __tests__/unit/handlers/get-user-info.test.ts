import { handler } from '../../../src/handlers/get-user-info';
describe('get-user-info', () => {
    it('should return a 200 response', async () => {
        const event = {} as any;
        const result = await handler(event, null, null) as any;
        expect(result.statusCode).toEqual(200);
    });
    
});
