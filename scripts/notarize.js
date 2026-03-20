const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  // Skip notarization if credentials are not provided
  if (!process.env.APPLE_ID || !process.env.APPLE_ID_PASS || !process.env.APPLE_TEAM_ID) {
    console.log('Skipping notarization - Apple ID credentials not provided (APPLE_ID, APPLE_ID_PASS, APPLE_TEAM_ID required)');
    return;
  }

  return await notarize({
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_ID_PASS,
    teamId: process.env.APPLE_TEAM_ID,
  });
};