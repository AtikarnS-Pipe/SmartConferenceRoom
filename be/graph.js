const { Client } = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');

/**
 * Creating a Graph client instance via options method. For more information, visit:
 * https://github.com/microsoftgraph/msgraph-sdk-javascript/blob/dev/docs/CreatingClientInstance.md#2-create-with-options
 * @param {String} accessToken
 * @returns
 */
const getGraphClient = (accessToken) => {
    // Initialize Graph client
    const graphClient = Client.init({
        // Use the provided access token to authenticate requests
        authProvider: (done) => { 
            done(null, accessToken); //null = ถ้าไม่มี error, accessToken = ให้ clinet ใส่ Authorization:Bearer accessToken ทุก request
        },
    });
    return graphClient;
};

module.exports = getGraphClient;