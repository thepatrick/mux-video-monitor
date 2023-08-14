import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { credentialProvider } from './credentialProvider';

export const dynamo = new DynamoDB({ credentials: credentialProvider });
