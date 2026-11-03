// lexcode-expect: 1
module.exports = {
  packagerConfig: {
    asar: true,
    name: 'Field Notes',
  },
  rebuildConfig: {},
  makers: [
    { name: '@electron-forge/maker-squirrel', config: {} },
    { name: '@electron-forge/maker-zip', platforms: ['darwin'] },
    { name: '@electron-forge/maker-deb', config: {} },
  ],
  publishers: [],
};
