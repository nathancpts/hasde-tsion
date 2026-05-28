window.Native = {
  load: (filename) => Promise.resolve(window.CalJJSInterface.load(filename)),
  openOmer: () => CalJJSInterface.openOmer(),
};
