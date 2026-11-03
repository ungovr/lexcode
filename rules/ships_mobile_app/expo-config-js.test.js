// lexcode-expect: 1
const variant = process.env.APP_VARIANT;

module.exports = ({ config }) => ({
  ...config,
  name: variant === 'preview' ? 'Trail Log (preview)' : 'Trail Log',
  slug: 'trail-log',
  android: {
    ...config.android,
    package: variant === 'preview' ? 'org.example.traillog.preview' : 'org.example.traillog',
    versionCode: 7,
  },
});
