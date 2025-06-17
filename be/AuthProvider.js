const msal = require("@azure/msal-node");
require('dotenv').config({ path: './config/.env'});

class AuthProvider {
    constructor(msalConfig) {
        this.clientApplication = new msal.ConfidentialClientApplication(msalConfig);
    }

    async acquireTokenByCode(tokenRequest) {
        const response = await this.clientApplication.acquireTokenByCode(tokenRequest);
        return response;
    }

    async acquireTokenSilent(account, scopes) {
        if (!account){
          throw new Error("No account loaded, please login!");  
        } 
        return this.clientApplication.acquireTokenSilent({
            account,
            scopes,
        });
    }

    async getAccountById(homeAccountId) {
        const accounts = await this.clientApplication.getTokenCache().getAllAccounts();
        return accounts.find(acc => acc.homeAccountId === homeAccountId);
    }
}


const config = {
    auth: {
      clientId: process.env.CLIENT_ID,
      authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
      clientSecret: process.env.CLIENT_SECRET,
    }
};

const authProvider = new AuthProvider(config);

module.exports = {AuthProvider, authProvider};
