var techs = require('../techs'),
    config = require('../config'),
    PLATFORMS = config.platforms,
    LIB_NAME = 'bem-core';

/**
 * Creates `dist` task.
 *
 * This task allows to build distribution of this project.
 *
 * @param {ProjectConfig} project - main ENB config for this project
 * @example Build dist for all platforms
 * $ magic run dist
 * @example Build dist for desktop platform
 * $ magic make dist/desktop
 */
module.exports = function (project) {
    var dirs = PLATFORMS.map(function (platform) {
        return 'dist/' + platform;
    });

    project.task('dist', function(task) {
        return task.buildTargets(dirs);
    });

    PLATFORMS.forEach(function (platform, i) {
        var dir = dirs[i];

        project.node(dir, function (node) {
            configure(node, platform);
        });
    });
};

/**
 * Configures task for specified platform.
 *
 * @param {NodeConfig} node — instance for configure dir with dist for specified platform
 * @param {String} platform - platform name
 */
function configure(node, platform) {
    node.addTechs([
        // get FileList
        [techs.bem.levels, { levels : config.levels(platform) }],
        [techs.bem.levelsToBemdecl, { target : '.tmp.bemdecl.js' }],
        [techs.bem.deps, { bemdeclFile : '.tmp.bemdecl.js', target : '.tmp.deps.js' }],
        [techs.bem.files, { depsFile : '.tmp.deps.js' }],

        // build CSS
        [techs.css, { target : LIB_NAME + '.dev.css' }],
        [techs.borschik, { source : LIB_NAME + '.dev.css', target : LIB_NAME + '.css' }],

        // build core of i18n
        [techs.i18n.keysets, {
            target : '.tmp.keysets.js',
            lang : 'none'
        }],
        [techs.i18n.js, {
            target : '.tmp.i18n.js',
            keysetsFile : '.tmp.keysets.js',
            exports : {
                globals : true,
                ym : true
            },
            lang : 'none'
        }],

        // build JavaScript for browsers
        [techs.browserJS, {
            target : '.tmp.without-i18n.js',
            includeYM : true
        }],
        [techs.files.merge, {
            sources : ['.tmp.without-i18n.js', '.tmp.i18n.js'],
            target : LIB_NAME + '.dev.js'
        }],
        [techs.borschik, { source : LIB_NAME + '.dev.js', target : LIB_NAME + '.js' }],

        // build BEMHTML
        [techs.engines.bemhtml, { target : LIB_NAME + '.dev.bemhtml.js' }],
        [techs.borschik, { source : LIB_NAME + '.dev.bemhtml.js', target : LIB_NAME + '.bemhtml.js' }],

        // build BH
        [techs.engines.bhBundle, {
            target : LIB_NAME + '.dev.bh.js',
            mimic : ['bh', 'BEMHTML'],
            bhOptions : {
                jsAttrName : 'data-bem',
                jsAttrScheme : 'json'
            }
        }],
        [techs.borschik, { source : LIB_NAME + '.dev.bh.js', target : LIB_NAME + '.bh.js' }],

        // merge JavaScript with BEMHTML
        [techs.files.merge, {
            target : LIB_NAME + '.dev.js+bemhtml.js',
            sources : [LIB_NAME + '.dev.js', LIB_NAME + '.dev.bemhtml.js']
        }],
        [techs.borschik, { source : LIB_NAME + '.dev.js+bemhtml.js', target : LIB_NAME + '.js+bemhtml.js' }],

        // merge JavaScript with BH
        [techs.files.merge, {
            target : LIB_NAME + '.dev.js+bh.js',
            sources : [LIB_NAME + '.dev.js', LIB_NAME + '.dev.bh.js']
        }],
        [techs.borschik, { source : LIB_NAME + '.dev.js+bh.js', target : LIB_NAME + '.js+bh.js' }]
    ]);

    node.addTargets([
        '.dev.css',
        '.dev.js',
        '.dev.bemhtml.js',
        '.dev.bh.js',
        '.dev.js+bemhtml.js',
        '.dev.js+bh.js',

        '.css',
        '.js',
        '.bemhtml.js',
        '.bh.js',
        '.js+bemhtml.js',
        '.js+bh.js'
    ].map(function (ext) {
        return LIB_NAME + ext;
    }));
}
