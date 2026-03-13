Promise.all([
  import('./..//tests/deck.test.js'),
  import('./..//tests/ui.test.js')
]).then(([d,u])=>{
  console.log('Tests finished');
}).catch(err=>{console.error(err);process.exit(1)});
