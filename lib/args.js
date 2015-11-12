var documentation = require('../'),
  path = require('path'),
  loadConfig = require('../lib/load_config.js');
var yargs = require('yargs')

function parse(args) {
  // reset() needs to be called at parse time because the yargs module uses an
  // internal global variable to hold option state
  return yargs.reset()
  .usage('Usage: $0 <command> [options]')

  .option('f', {
    alias: 'format',
    default: 'json',
    choices: ['json', 'md', 'html']
  })

  .option('lint', {
    describe: 'check output for common style and uniformity mistakes',
    type: 'boolean'
  })

  .option('w', {
    describe: 'watch input files and rebuild documentation when they change',
    alias: 'watch',
    type: 'boolean'
  })

  .option('s', {
    describe: 'serve html files under a webserver. must be used alongide -w',
    alias: 'serve',
    type: 'boolean'
  })

  .describe('t', 'specify a theme: this must be a valid theme module')
  .alias('t', 'theme')

  .boolean('p')
  .describe('p', 'generate documentation tagged as private')
  .alias('p', 'private')

  .version(function () {
    return require('../package').version;
  })

  .describe('name', 'project name. by default, inferred from package.json')
  .describe('project-version', 'project version. by default, inferred from package.json')

  .option('shallow', {
    describe: 'shallow mode turns off dependency resolution, ' +
    'only processing the specified files (or the main script specified in package.json)',
    default: false,
    type: 'boolean'
  })

  .boolean('polyglot')
  .describe('polyglot', 'polyglot mode turns off dependency resolution and ' +
            'enables multi-language support. use this to document c++')

  .boolean('g')
  .describe('g', 'infer links to github in documentation')
  .alias('g', 'github')

  .option('o', {
    describe: 'output location. omit for stdout, otherwise is a filename ' +
      'for single-file outputs and a directory name for multi-file outputs like html',
    alias: 'output',
    default: 'stdout'
  })

  .describe('c', 'configuration file. an array defining explicit sort order')
  .alias('c', 'config')

  .help('h')
  .alias('h', 'help')

  .example('$0 foo.js', 'parse documentation in a given file')

  .parse(args)

}
/**
 * Parse and validate command-line options for documentation.
 * @param {Array} args The array of arguments to parse; e.g. process.argv.slice(2).
 * @return {object} {inputs, options, formatter, formatterOptions, output}
 * @private
 */
module.exports = function (args) {
  var argv = parse(args);

  var inputs,
    name = argv.name,
    version = argv['project-version'],
    transform;

  if (argv._.length > 0) {
    inputs = argv._;
  } else {
    try {
      var p = require(path.resolve('package.json'));
      inputs = [p.main || 'index.js'];
      name = name || p.name;
      version = version || p.version;
      if (p.browserify && p.browserify.transform) {
        transform = p.browserify.transform;
      }
    } catch (e) {
      yargs.showHelp();
      throw new Error('documentation was given no files and was not run in a module directory');
    }
  }

  if (!documentation.formats[argv.f]) {
    yargs.showHelp();
    throw new Error('Formatter not found');
  }

  if (argv.w && argv.lint) {
    yargs.showHelp();
    throw new Error('--lint cannot be specified along with --watch');
  }

  if (argv.f === 'html' && argv.o === 'stdout') {
    yargs.showHelp();
    throw new Error('The HTML output mode requires a destination directory set with -o');
  }

  var config = {};

  if (argv.config) {
    config = loadConfig(argv.config);
  }

  return {
    inputs: inputs,
    options: {
      private: argv.private,
      transform: transform,
      lint: argv.lint,
      github: argv.github,
      polyglot: argv.polyglot,
      order: config.order || [],
      shallow: argv.shallow
    },
    formatter: argv.f,
    watch: argv.w,
    formatterOptions: {
      name: name,
      version: version,
      theme: argv.theme
    },
    output: argv.o
  }
}


