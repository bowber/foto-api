// See openapi.yaml for the request and response schema
import { APIGatewayProxyHandler } from 'aws-lambda';
import { createTempUser, getTempUser } from '../utils/user';

export const handler: APIGatewayProxyHandler = async (event) => {
    const { email } = event.queryStringParameters;
    const tempUser = await tryCreateTempUser(email);
    return {
        statusCode: 200,
        body: JSON.stringify({
            salt: tempUser.salt
        })
    };
}

const tryCreateTempUser = async (email: string) => {
    const newUser = await createTempUser(email);
    if (newUser) {
        return newUser;
    }
    return await getTempUser(email);
}
