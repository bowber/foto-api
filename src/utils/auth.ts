import { randomBytes, scrypt } from 'crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const getClient = () => new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(getClient());

const PEPPER_KEY = 'pepper';
const PEPPER_EXPIRATION = parseInt(process.env.PEPPER_EXPIRATION) || 1000 * 60 * 60 * 24; // 1 day in milliseconds

// const accessTokenPrivateKey = 'accessToken';
// const accessTokenExpiration = parseInt(process.env.ACCESS_TOKEN_EXPIRATION) || 1000 * 60 * 60 * 24 * 30; // 1 month in milliseconds

/**
 * Generates a random string for security purposes (e.g. salt, pepper)
 * @param bytes bytes to generate
 * @returns a random string in base64
 */
export const generateSalt = (bytes = 64) => {
    return randomBytes(bytes).toString('base64');
}

export const generatePepper = () => {
    return generateSalt();
}

export interface PepperItem {
    pepper: string;
    expires: number;
}

/**
 * Check if the pepper is expired. If it is, get one from the database. 
 * If the database doesn't have one or it's expired, generate a new one and save it to the database (consistently).
 * @param pepperItem the current pepper item, passed in to check if it's expired, pass null if you don't have one
 * @param client the DynamoDB client to use.
 * @param getPepperItemFn a function to get the pepperItem from the database. If not provided, the default will be used.
 * Useful for testing.
 * @param refreshPepperItemFn a function to refresh the pepperItem in the database (and return it). If not provided, the default will be used.
 * Useful for testing.
 * @returns the pepper string
 */
export const tryGetPepperAndRefresh = async (
    pepperItem: PepperItem,
    client: DynamoDBDocumentClient,
    getPepperItemFn: typeof getPepperItem = getPepperItem,
    refreshPepperItemFn: typeof refreshPepperItem = refreshPepperItem
) => {
    if (!pepperItem || pepperItem.expires < Date.now()) {
        pepperItem = await getPepperItemFn(client);
    }
    if (!pepperItem || pepperItem.expires < Date.now()) {
        pepperItem = await refreshPepperItemFn(client);
    }
    if (!pepperItem || pepperItem.expires < Date.now()) {
        return null;
    }
    return pepperItem.pepper;
}

/**
 * Get the pepperItem from the database, even if it's expired.
 * @param client the DynamoDB client to use.
 * @returns the pepperItem
 */
const getPepperItem = async (client: DynamoDBDocumentClient) => {
    const output = await client.send(new GetCommand({
        TableName: process.env.SHARED_TABLE,
        Key: {
            sharedID: PEPPER_KEY
        },
        ProjectionExpression: 'pepper, expires'
    }));
    return output.Item as PepperItem;
}

/**
 * Refresh the pepperItem in the database if it's expired. And return the new pepperItem.
 * @param client the DynamoDB client to use.
 * @returns the pepperItem
 */
const refreshPepperItem = async (client: DynamoDBDocumentClient) => {
    const newPepper = generatePepper();
    const result = await client.send(new UpdateCommand({
        TableName: process.env.SHARED_TABLE,
        Key: {
            sharedID: PEPPER_KEY
        },
        ConditionExpression: 'attribute_not_exists(sharedID) OR expires < :now',
        UpdateExpression: 'SET pepper = :pepper, expires = :expires',
        ExpressionAttributeValues: {
            ':pepper': newPepper,
            ':expires': Date.now() + PEPPER_EXPIRATION,
            ':now': Date.now()
        },
        ReturnValues: 'ALL_NEW',
    }));
    return result.Attributes as PepperItem;
}

/**
 * Hash a password using scrypt.
 * @param password the password to hash
 * @param salt the salt to use
 * @param keylen the length of the key to generate
 * @returns the hashed password
 */
export const addSaltToPassword = async (password: string, salt: string, keylen = 64) => {
    return new Promise<string>((resolve, reject) => {
        scrypt(password, salt, keylen, (err, derivedKey) => {
            if (err) {
                reject(err);
            }
            resolve(derivedKey.toString('base64')); // convert to base64 to make it easier to store in the database
        });
    });
}

// TODO: Isn't necessary yet, but will be
// export const addPepperToSaltedPassword = async (saltedPassword: string, pepper: string) => {
//     return new Promise<string>((resolve, reject) => {
//         scrypt(saltedPassword, pepper, 64, (err, derivedKey) => {
//             if (err) {
//                 reject(err);
//             }
//             resolve(derivedKey.toString('hex'));
//         });
//     });
// }