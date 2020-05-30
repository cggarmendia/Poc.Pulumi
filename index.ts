import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";

const gatResourceGroup = new azure.core.ResourceGroup("gat-eastus");

const gatStorageAccount = new azure.storage.Account("gatstorage", {
    resourceGroupName: gatResourceGroup.name,
    accountTier: "Standard",
    accountReplicationType: "LRS",
    enableHttpsTrafficOnly: true
});

const gatWebAppInsight = new azure.appinsights.Insights("gat-webapp-app-i", {
    resourceGroupName: gatResourceGroup.name,
    applicationType: "web"
});

const gatWebAppServicePlan = new azure.appservice.Plan("gat-webapp-service-plan", {
    resourceGroupName: gatResourceGroup.name,
    kind: "app",
    sku: {
        size: "S1",
        tier: "Standard"
    }    
});

const gatWebapp = new azure.appservice.AppService("gat-webapp", {
    resourceGroupName: gatResourceGroup.name,
    appServicePlanId: gatWebAppServicePlan.id,
    httpsOnly: true,
    appSettings: {
        "ApplicationInsights__InstrumentationKey ": gatWebAppInsight.instrumentationKey
    }
});

const gatBackendServicePlan = new azure.appservice.Plan("gat-backend-service-plan", {
    resourceGroupName: gatResourceGroup.name,
    kind: "FunctionApp",
    sku: {
        size: "Y1",
        tier: "Dynamic"
    }
});

new azure.appservice.FunctionApp("gat-backend", {
    version: "~2",
    resourceGroupName: gatResourceGroup.name,
    appServicePlanId: gatBackendServicePlan.id,
    storageConnectionString: gatStorageAccount.primaryConnectionString,
    httpsOnly: true,
    appSettings: {
        "ApplicationInsights__InstrumentationKey ": gatWebAppInsight.instrumentationKey
    },
    siteConfig: {
        cors:{
            allowedOrigins: [
                "https://functions.azure.com",
                "https://functions-staging.azure.com",
                "https://functions-next.azure.com",
                "http://localhost:4200",
                pulumi.concat("https://", gatWebapp.defaultSiteHostname)
            ]
        }
    }
});