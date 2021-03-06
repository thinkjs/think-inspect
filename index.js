const Helper = require('think-helper');
const fs = require('fs');
const path = require('path');

const Inspector = class {
  constructor(config) {
    this.config = config;
  }
  /**
   * check if node version meets the requirement of ThinkJS.
   */
  checkNodeVersion() {
    const config = this.config;
    const logger = config.logger;
    const packageFile = path.join(config.THINK_PATH, 'package.json');

    if (!Helper.isFile(packageFile)) {
      return;
    }
    const {engines} = JSON.parse(fs.readFileSync(packageFile, 'utf-8'));
    const needVersion = engines.node.substr(2);

    let nodeVersion = process.version;
    if (nodeVersion[0] === 'v') {
      nodeVersion = nodeVersion.slice(1);
    }

    if (needVersion > nodeVersion) {
      logger.error(`ThinkJS need node version >= ${needVersion}, current version is ${nodeVersion}, please upgrade it.`);
    }
  }

  /**
   * check if filenames in application are in lowercase;
   * include: js, html, tpl;
   * exclude: filenames with `/locale/`.
   */
  checkFileName() {
    const config = this.config;
    const logger = config.logger;
    const files = Helper.getdirFiles(config.APP_PATH);
    const excludePath = `${path.sep}${config.locale}${path.sep}`;
    const excludeReg = new RegExp(excludePath);
    const includeReg = /\.(js|html|tpl)$/;
    const uppercaseReg = /[A-Z]/;
    files.forEach((item) => {
      // inspect filename
      if (!includeReg.test(item) || excludeReg.test(item)) return;
      if (uppercaseReg.test(item)) {
        logger.warn(`filename \`${item}\` has uppercase chars.`);
      }
    });
  }
  /**
    * check dependencies are installed before server starts
    */
  checkDependencies() {
    const config = this.config;
    const logger = config.logger;
    const packageFile = path.join(config.ROOT_PATH, 'package.json');
    if (!Helper.isFile(packageFile)) {
      return;
    }

    const data = JSON.parse(fs.readFileSync(packageFile, 'utf-8'));
    let dependencies = Helper.extend({}, data.dependencies);
    // merge devDependencies in development env
    if (config.env === 'development') {
      dependencies = Helper.extend(dependencies, data.devDependencies);
    }

    // package alias
    const pkgAlias = {
      'babel-runtime': 'babel-runtime/helpers/inherits'
    };
    const pkgPath = path.join(config.ROOT_PATH, 'node_modules/');
    for (let pkg in dependencies) {
      pkg = pkgAlias[pkg] || pkg;
      const pkgFilename = path.join(pkgPath, pkg);
      if (Helper.isDirectory(pkgFilename)) {
        continue;
      }

      try {
        require(pkg);
      } catch (e) {
        logger.error(`package \`${pkg}\` is not installed. please run \`npm install\` command before server starts.`);
      }
    }
  }
};
module.exports = Inspector;
