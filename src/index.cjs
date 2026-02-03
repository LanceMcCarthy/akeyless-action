let core;

const runAction = async () => {
  core = await import('@actions/core');
  const {run} = await import('./index.js');

  core.debug('Starting main run');
  core.info('Note: Any AWS SDK warnings come from the Akeyless dependencies. Once they\'re addressed, this action will automatically inherit those fixes in the next update.');

  await run();
};

runAction().catch((error) => {
  const message = error?.stack || error?.message || String(error);

  if (core?.setFailed) {
    core.debug(message);
    core.setFailed(message);
  } else {
    console.error(message);
    process.exitCode = 1;
  }
});
