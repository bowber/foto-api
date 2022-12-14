import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { addSaltToPassword, generateSalt } from './auth';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

export interface User {
    userID: string;
    email: string;
    saltedPassword: string;
    salt: string;
}
export interface TempUser {
    userID: string;
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
        ConditionExpression: 'attribute_not_exists(userID) OR attribute_not_exists(email)',
    });
    return await ddbDocClient.send(command);
}

export const getUserById = async (userID: string) => {
    const command = new GetCommand({
        TableName: USER_TABLE,
        Key: {
            userID: userID
        }
    });
    const result = await ddbDocClient.send(command);
    return result.Item as User;
}

export const getUserByEmail = async (email: string) => {
    const command = new ScanCommand({
        TableName: USER_TABLE,
        IndexName: USER_ID_INDEX,
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
    return result.Item as TempUser;
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
        userID: randomUUID(),
        email: email,
        salt: salt,
    };
    try {
        const command = new PutCommand({
            TableName: TEMP_USER_TABLE,
            Item: user,
            ConditionExpression: 'attribute_not_exists(email)',
        });
        await ddbDocClient.send(command);
        return user;
    } catch (error) {
        if (error.name === 'ConditionalCheckFailedException') {
            return null;
        }
        throw error;
    }

}
