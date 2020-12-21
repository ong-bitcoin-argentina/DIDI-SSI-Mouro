const appInsights = require('applicationinsights');

if (process.env.ENABLE_AZURE_LOGGER) {
    const ikey = process.env.APP_INSIGTHS_IKEY;

    appInsights.setup(ikey)
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true, true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setUseDiskRetryCaching(true)
        .setSendLiveMetrics(true)
        .setDistributedTracingMode(appInsights.DistributedTracingModes.AI)

    appInsights.defaultClient.commonProperties = {
        environment: process.env.ENVIRONMENT,
    };

    appInsights.defaultClient.config.disableAppInsights =  process.env.DISABLE_TELEMETRY_CLIENT;
    appInsights.defaultClient.context.tags["ai.cloud.role"] =  process.env.NAME;
    appInsights.defaultClient.context.tags["ai.cloud.roleInstance"] = process.env.ENVIRONMENT;
}

export const logger = process.env.ENABLE_AZURE_LOGGER ? appInsights : {};

