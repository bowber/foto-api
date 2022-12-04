import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { addSaltToPassword, generateSalt } from './auth';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export interface User {
    id: string;
    email: string;
    saltedPassword: string;
    salt: string;
}
export interface TempUser {
    id: string;
    email: string;
    salt: string;
}
const USER_TABLE = process.env.USER_TABLE;
const USER_ID_INDEX = process.env.USER_ID_INDEX;
const TEMP_USER_TABLE = process.env.TEMP_USER_TABLE;

// User Operations
export const createUser = async (user: User) => {
    const command = new PutCommand({
        TableName: USER_TABLE,
        Item: user,
        ConditionExpression: 'attribute_not_exists(id) OR attribute_not_exists(email)',
    });
    return await ddbDocClient.send(command);
}

export const getUserById = async (id: string) => {
    const command = new GetCommand({
        TableName: USER_TABLE,
        Key: {
            id
        }
    });
    const result = await ddbDocClient.send(command);
    return result.Item as User;
}

export const getUserByEmail = async (email: string) => {
    const command = new ScanCommand({
        TableName: USER_TABLE,
        IndexName: 'email-index',
        FilterExpression: 'email = :email',
        ExpressionAttributeValues: {
            ':email': email
        },
        Limit: 1
    });
    const result = await ddbDocClient.send(command);
    return result.Items[0] as User;
}

/// TempUser operations
export const getTempUser = async (email: string) => {
    const command = new GetCommand({
        TableName: TEMP_USER_TABLE,
        Key: {
            email: email
        }
    });
    const result = await ddbDocClient.send(command);
    return result.Item as User;
}

/**
 * Create a temporary user in the database. 
 * 
 * Remember to delete the user in temp table after the real user has been created in the real user table.
 * 
 * And don't forget to check if the user already exists in the real user table before creating a temp user.
 * 
 * @returns a temp user without saltedPassword
 */
export const createTempUser = async (email: string) => {
    const salt = generateSalt();
    const user: TempUser = {
        id: randomUUID(),
        email: email,
        salt: salt,
    };

    const command = new PutCommand({
        TableName: TEMP_USER_TABLE,
        Item: user,
        ConditionExpression: 'attribute_not_exists(email)',
    });
    await ddbDocClient.send(command);
    return user;
}
