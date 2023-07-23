import { fromNodeProviderChain } from '@aws-sdk/credential-providers'; // ES6 import
// const { fromNodeProviderChain } = require("@aws-sdk/credential-providers") // CommonJS import

export const credentialProvider = fromNodeProviderChain({
  //...any input of fromEnv(), fromSSO(), fromTokenFile(), fromIni(),
  // fromProcess(), fromInstanceMetadata(), fromContainerMetadata()
  // Optional. Custom STS client configurations overriding the default ones.
  // clientConfig: { region: process.env.AWS_REGION },
});
