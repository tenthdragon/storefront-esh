console.error(
  [
    'Direct production deploys from a local machine are disabled for this repository.',
    'Push changes to GitHub first, then let the approved GitHub deployment flow publish the site.',
  ].join('\n'),
)

process.exit(1)
