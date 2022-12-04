// See openapi.yaml for the request and response schema
import { APIGatewayProxyHandler } from 'aws-lambda';
import { createTempUser } from 'src/utils/user';

export const handler: APIGatewayProxyHandler = async (event) => {
    const { email } = JSON.parse(event.body);
    const newUser = await createTempUser(email);
    return {
        statusCode: 200,
        body: JSON.stringify({
            salt: newUser.salt
        })
    };
}
